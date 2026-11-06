import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { auth } from '../firebase';
import { DEFAULT_CLINIC_PUBLIC_SETTINGS, SERVICES_DATA } from '../data/healthCenterData';
import type { ClinicPublicSettings, PublicSiteContent } from '../types';

export type Language = 'en' | 'fil';
export type AppointmentRequestAvailability = 'checking' | 'available' | 'pending' | 'error';

export interface PatientAppointment {
  id: string;
  referenceCode: string;
  programTitle: string;
  patientName: string;
  zone: string;
  status: 'Pending' | 'Confirmed' | 'Rejected' | 'Cancelled' | string;
  appointmentDate: string;
  timeSlot: string;
}

const DEFAULT_SITE_CONTENT: PublicSiteContent = {
  services: SERVICES_DATA,
  news: [],
  outreach: [],
  settings: DEFAULT_CLINIC_PUBLIC_SETTINGS,
};

type TranslationSet = Record<keyof (typeof TRANSLATIONS_EN)['en'], string>;

const TRANSLATIONS_EN = {
  en: {
    brand: 'Masikap Health Center',
    contactTitle: 'Visit Masikap Health Center',
    newsTitle: 'Health center updates',
    newsSubtitle: 'Announcements and public health advisories.',
    newsSearchPlaceholder: 'Search updates...',
    btnReadArticle: 'Read update',
    btnCloseArticle: 'Close',
    outreachTitle: 'Community health programs',
    outreachSubtitle: 'Current outreach programs from Masikap Health Center.',
    formFullName: 'Full name',
    formPhone: 'Phone number',
    formEmail: 'Email address',
    formZone: 'Zone or barangay',
    formDate: 'Preferred date',
    formTimeSlot: 'Preferred time',
    analyticsTitle: 'Health center analytics',
    analyticsSubtitle: 'Available service and community health data.',
    kpiConsultations: 'Consultations',
    kpiSatisfaction: 'Patient satisfaction',
    kpiOptScreening: 'OPT screening',
    kpiMedsDispensed: 'Medicines dispensed',
    chartServiceVolume: 'Service volume',
    chartZoneFootfall: 'Service area activity',
    chartNutritionStatus: 'Nutrition status',
    chartInventoryStatus: 'Medicine inventory',
  },
};

const TRANSLATIONS_FIL = {
  fil: {
    brand: 'Masikap Health Center',
    contactTitle: 'Bumisita sa Masikap Health Center',
    newsTitle: 'Mga update ng health center',
    newsSubtitle: 'Mga anunsyo at pampublikong pabatid pangkalusugan.',
    newsSearchPlaceholder: 'Maghanap ng mga update...',
    btnReadArticle: 'Basahin',
    btnCloseArticle: 'Isara',
    outreachTitle: 'Mga programang pangkalusugan sa komunidad',
    outreachSubtitle: 'Mga kasalukuyang programa ng Masikap Health Center.',
    formFullName: 'Buong pangalan',
    formPhone: 'Numero ng telepono',
    formEmail: 'Email address',
    formZone: 'Zone o barangay',
    formDate: 'Piling petsa',
    formTimeSlot: 'Piling oras',
    analyticsTitle: 'Datos ng health center',
    analyticsSubtitle: 'Available na datos ng serbisyo at kalusugan sa komunidad.',
    kpiConsultations: 'Konsultasyon',
    kpiSatisfaction: 'Kasiyahan ng pasyente',
    kpiOptScreening: 'OPT screening',
    kpiMedsDispensed: 'Gamot na naipamahagi',
    chartServiceVolume: 'Dami ng serbisyo',
    chartZoneFootfall: 'Aktibidad sa service area',
    chartNutritionStatus: 'Kalagayan sa nutrisyon',
    chartInventoryStatus: 'Imbentaryo ng gamot',
  },
};

const TRANSLATIONS: Record<Language, TranslationSet> = {
  en: TRANSLATIONS_EN.en,
  fil: TRANSLATIONS_FIL.fil,
};

interface AppointmentApiRow {
  id?: unknown;
  reference_code?: unknown;
  service_name?: unknown;
  patient_name?: unknown;
  zone?: unknown;
  status?: unknown;
  preferred_date?: unknown;
  preferred_time?: unknown;
}

interface HealthCenterContextValue {
  t: (typeof TRANSLATIONS)['en'];
  language: Language;
  toggleLanguage: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  siteContent: PublicSiteContent;
  siteContentError: string;
  clinicOpen: boolean | null;
  clinicStatusError: string;
  appointmentRequestAvailability: AppointmentRequestAvailability;
  bookingModalOpen: boolean;
  setBookingModalOpen: (open: boolean) => void;
  selectedProgramForBooking: string;
  openBookingForProgram: (programId: string) => void;
  markAppointmentRequestPending: () => void;
  appointments: PatientAppointment[];
  cancelAppointment: (id: string) => Promise<void>;
  messagesOpen: boolean;
  setMessagesOpen: (open: boolean) => void;
  unreadAdminMessageCount: number;
  unreadMessagesError: string;
  notificationToast: string;
  setNotificationToast: Dispatch<SetStateAction<string>>;
}

const HealthCenterContext = createContext<HealthCenterContextValue | null>(null);

function normalizedStatus(value: unknown): PatientAppointment['status'] {
  const status = typeof value === 'string' ? value.toLowerCase() : '';
  if (status === 'confirmed') return 'Confirmed';
  if (status === 'rejected') return 'Rejected';
  if (status === 'cancelled' || status === 'canceled') return 'Cancelled';
  return 'Pending';
}

function appointmentFromApi(row: AppointmentApiRow): PatientAppointment {
  const referenceCode = typeof row.reference_code === 'string' ? row.reference_code : '';
  return {
    id: referenceCode || String(row.id ?? ''),
    referenceCode,
    programTitle: typeof row.service_name === 'string' ? row.service_name : '',
    patientName: typeof row.patient_name === 'string' ? row.patient_name : '',
    zone: typeof row.zone === 'string' ? row.zone : '',
    status: normalizedStatus(row.status),
    appointmentDate: typeof row.preferred_date === 'string' ? row.preferred_date : '',
    timeSlot: typeof row.preferred_time === 'string' ? row.preferred_time : '',
  };
}

export const HealthCenterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => (
    localStorage.getItem('masikap-language') === 'fil' ? 'fil' : 'en'
  ));
  const [activeSection, setActiveSectionState] = useState('overview');
  const [siteContent, setSiteContent] = useState(DEFAULT_SITE_CONTENT);
  const [siteContentError, setSiteContentError] = useState('');
  const [clinicOpen, setClinicOpen] = useState<boolean | null>(null);
  const [clinicStatusError, setClinicStatusError] = useState('');
  const [appointmentRequestAvailability, setAppointmentRequestAvailability] = useState<AppointmentRequestAvailability>('checking');
  const [bookingModalOpenState, setBookingModalOpenState] = useState(false);
  const [selectedProgramForBooking, setSelectedProgramForBooking] = useState('');
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [unreadAdminMessageCount, setUnreadAdminMessageCount] = useState(0);
  const [unreadMessagesError, setUnreadMessagesError] = useState('');
  const [notificationToast, setNotificationToast] = useState('');

  const setActiveSection = (section: string) => setActiveSectionState(section);
  const toggleLanguage = () => setLanguage((current) => {
    const next = current === 'en' ? 'fil' : 'en';
    localStorage.setItem('masikap-language', next);
    return next;
  });
  const setBookingModalOpen = (open: boolean) => {
    setBookingModalOpenState(open);
    if (!open) setSelectedProgramForBooking('');
  };
  const openBookingForProgram = (programId: string) => {
    setSelectedProgramForBooking(programId);
    setBookingModalOpenState(true);
  };
  const markAppointmentRequestPending = () => setAppointmentRequestAvailability('pending');

  useEffect(() => {
    let active = true;
    const user = auth.currentUser;
    if (!user) {
      setAppointmentRequestAvailability('error');
      setClinicStatusError('Sign in to load clinic status.');
      return () => { active = false; };
    }

    const requestWithToken = async (path: string) => {
      const token = await user.getIdToken();
      return fetch(path, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
    };

    const loadSiteContent = async () => {
      try {
        const response = await fetch('/api/content', { cache: 'no-store' });
        if (!response.ok) throw new Error('Public clinic information could not be loaded.');
        const data = await response.json() as Partial<PublicSiteContent>;
        if (!active) return;
        setSiteContentError('');
        const nextContent = {
          services: Array.isArray(data.services) ? data.services : DEFAULT_SITE_CONTENT.services,
          news: Array.isArray(data.news) ? data.news : [],
          outreach: Array.isArray(data.outreach) ? data.outreach : [],
          settings: data.settings ? { ...DEFAULT_CLINIC_PUBLIC_SETTINGS, ...data.settings } : DEFAULT_CLINIC_PUBLIC_SETTINGS,
        };
        setSiteContent((current) => JSON.stringify(current) === JSON.stringify(nextContent) ? current : nextContent);
      } catch {
        if (active) setSiteContentError('Clinic information could not be refreshed.');
        return;
      }
    };

    const loadClinicStatus = async () => {
      try {
        const response = await requestWithToken('/api/admin?mode=clinic_status');
        const result = await response.json() as { clinicOpen?: boolean; error?: string };
        if (!response.ok || typeof result.clinicOpen !== 'boolean') {
          throw new Error(result.error || 'Clinic status could not be loaded.');
        }
        if (!active) return;
        setClinicOpen(result.clinicOpen);
        setClinicStatusError('');
      } catch (caught) {
        if (!active) return;
        setClinicStatusError(caught instanceof Error ? caught.message : 'Clinic status could not be loaded.');
      }
    };

    const loadAppointments = async () => {
      try {
        const response = await requestWithToken('/api/appointments');
        const result = await response.json() as { appointments?: AppointmentApiRow[]; error?: string };
        if (!response.ok || !Array.isArray(result.appointments)) {
          throw new Error(result.error || 'Appointment requests could not be loaded.');
        }
        if (!active) return;
        const nextAppointments = result.appointments.map(appointmentFromApi);
        setAppointments(nextAppointments);
        setAppointmentRequestAvailability(nextAppointments.some((appointment) => appointment.status === 'Pending')
          ? 'pending'
          : 'available');
      } catch {
        if (active) setAppointmentRequestAvailability((current) => current === 'pending' ? current : 'error');
      }
    };

    const loadUnreadMessages = async () => {
      try {
        const response = await requestWithToken('/api/admin?mode=unread_messages');
        const result = await response.json() as { unreadCount?: number; error?: string };
        if (!response.ok || typeof result.unreadCount !== 'number') {
          throw new Error(result.error || 'Unread messages could not be loaded.');
        }
        if (!active) return;
        setUnreadAdminMessageCount(result.unreadCount);
        setUnreadMessagesError('');
      } catch (caught) {
        if (active) setUnreadMessagesError(caught instanceof Error ? caught.message : 'Unread messages could not be loaded.');
      }
    };

    let refreshInProgress = false;
    const refreshWebsiteData = async () => {
      if (refreshInProgress || document.visibilityState === 'hidden') return;
      refreshInProgress = true;
      try {
        await Promise.all([loadSiteContent(), loadClinicStatus(), loadAppointments(), loadUnreadMessages()]);
      } finally {
        refreshInProgress = false;
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshWebsiteData();
    };
    void refreshWebsiteData();
    const timer = window.setInterval(() => void refreshWebsiteData(), 3500);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  const cancelAppointment = async (id: string) => {
    const appointment = appointments.find((item) => item.id === id);
    const user = auth.currentUser;
    if (!appointment || !user) return;
    const token = await user.getIdToken();
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'cancel', referenceCode: appointment.referenceCode }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) throw new Error(result.error || 'Appointment could not be cancelled.');
    setAppointments((current) => current.map((item) => item.id === id ? { ...item, status: 'Cancelled' } : item));
  };

  return (
    <HealthCenterContext.Provider value={{
      t: TRANSLATIONS[language],
      language,
      toggleLanguage,
      activeSection,
      setActiveSection,
      siteContent,
      siteContentError,
      clinicOpen,
      clinicStatusError,
      appointmentRequestAvailability,
      bookingModalOpen: bookingModalOpenState,
      setBookingModalOpen,
      selectedProgramForBooking,
      openBookingForProgram,
      markAppointmentRequestPending,
      appointments,
      cancelAppointment,
      messagesOpen,
      setMessagesOpen,
      unreadAdminMessageCount,
      unreadMessagesError,
      notificationToast,
      setNotificationToast,
    }}>
      {children}
    </HealthCenterContext.Provider>
  );
};

export function useHealthCenter() {
  const context = useContext(HealthCenterContext);
  if (!context) throw new Error('useHealthCenter must be used within HealthCenterProvider.');
  return context;
}