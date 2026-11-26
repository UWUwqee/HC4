import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useAuth } from '@clerk/react';
import { DEFAULT_CLINIC_PUBLIC_SETTINGS, SERVICES_DATA } from '../data/healthCenterData';
import type { ClinicPublicSettings, PublicSiteContent } from '../types';

export type Language = 'en' | 'fil';
export type AppointmentRequestAvailability = 'checking' | 'available' | 'pending' | 'confirmed' | 'error';

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
    brand: 'Delfin Salonga Health Center',
    contactTitle: 'Visit Delfin Salonga Health Center',
    newsTitle: 'Health center updates',
    newsSubtitle: 'Announcements and public health advisories.',
    newsSearchPlaceholder: 'Search updates...',
    btnReadArticle: 'Read update',
    btnCloseArticle: 'Close',
    outreachTitle: 'Community health programs',
    outreachSubtitle: 'Current outreach programs from Delfin Salonga Health Center.',
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
    brand: 'Delfin Salonga Health Center',
    contactTitle: 'Bumisita sa Delfin Salonga Health Center',
    newsTitle: 'Mga update ng health center',
    newsSubtitle: 'Mga anunsyo at pampublikong pabatid pangkalusugan.',
    newsSearchPlaceholder: 'Maghanap ng mga update...',
    btnReadArticle: 'Basahin',
    btnCloseArticle: 'Isara',
    outreachTitle: 'Mga programang pangkalusugan sa komunidad',
    outreachSubtitle: 'Mga kasalukuyang programa ng Delfin Salonga Health Center.',
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
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  siteContent: PublicSiteContent;
  siteContentError: string;
  clinicOpen: boolean | null;
  clinicStatusError: string;
  appointmentRequestAvailability: AppointmentRequestAvailability;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  isSignedIn: boolean;
  bookingModalOpen: boolean;
  setBookingModalOpen: (open: boolean) => void;
  selectedProgramForBooking: string;
  openBookingForProgram: (programId: string) => void;
  markAppointmentRequestStatus: (status: 'pending' | 'confirmed') => void;
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
  const { getToken, isSignedIn } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => (
    localStorage.getItem('delfin-salonga-language') === 'fil' ? 'fil' : 'en'
  ));
  const [activeSection, setActiveSectionState] = useState('home');
  const [siteContent, setSiteContent] = useState(DEFAULT_SITE_CONTENT);
  const [siteContentError, setSiteContentError] = useState('');
  const [clinicOpen, setClinicOpen] = useState<boolean | null>(null);
  const [clinicStatusError, setClinicStatusError] = useState('');
  const [appointmentRequestAvailability, setAppointmentRequestAvailability] = useState<AppointmentRequestAvailability>(
    isSignedIn ? 'checking' : 'available',
  );
  const [authModalOpen, setAuthModalOpenState] = useState(false);
  const [bookingModalOpenState, setBookingModalOpenState] = useState(false);
  const [selectedProgramForBooking, setSelectedProgramForBooking] = useState('');
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [unreadAdminMessageCount, setUnreadAdminMessageCount] = useState(0);
  const [unreadMessagesError, setUnreadMessagesError] = useState('');
  const [notificationToast, setNotificationToast] = useState('');

  const setActiveSection = (section: string) => setActiveSectionState(section);
  const setLanguage = (nextLanguage: Language) => {
    localStorage.setItem('delfin-salonga-language', nextLanguage);
    setLanguageState(nextLanguage);
  };
  const toggleLanguage = () => setLanguage(language === 'en' ? 'fil' : 'en');

  const setAuthModalOpen = useCallback((open: boolean) => {
    if (!open) {
      sessionStorage.removeItem('mfhc_booking_after_signin');
      sessionStorage.removeItem('mfhc_booking_program');
      setSelectedProgramForBooking('');
    }
    setAuthModalOpenState(open);
  }, []);
  const setBookingModalOpen = useCallback((open: boolean) => {
    if (!open) {
      setBookingModalOpenState(false);
      setSelectedProgramForBooking('');
      return;
    }
    if (appointmentRequestAvailability !== 'available') return;
    if (!isSignedIn) {
      sessionStorage.setItem('mfhc_booking_after_signin', 'true');
      if (selectedProgramForBooking) sessionStorage.setItem('mfhc_booking_program', selectedProgramForBooking);
      setAuthModalOpenState(true);
      return;
    }
    setBookingModalOpenState(true);
  }, [appointmentRequestAvailability, isSignedIn, selectedProgramForBooking]);
  const openBookingForProgram = useCallback((programId: string) => {
    if (appointmentRequestAvailability !== 'available') return;
    setSelectedProgramForBooking(programId);
    if (!isSignedIn) {
      sessionStorage.setItem('mfhc_booking_after_signin', 'true');
      sessionStorage.setItem('mfhc_booking_program', programId);
      setAuthModalOpenState(true);
      return;
    }
    setBookingModalOpenState(true);
  }, [appointmentRequestAvailability, isSignedIn]);
  const markAppointmentRequestStatus = useCallback((status: 'pending' | 'confirmed') => {
    setAppointmentRequestAvailability(status);
  }, []);

  useEffect(() => {
    let active = true;
    if (!getToken) {
      setAppointmentRequestAvailability('error');
      setClinicStatusError('Sign in to load clinic status.');
      return () => { active = false; };
    }

    const requestWithToken = async (path: string) => {
      const token = await getToken();
      if (!token) throw new Error('Your Clerk sign-in session could not be verified.');
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
        const response = isSignedIn
          ? await requestWithToken('/api/admin?mode=clinic_status')
          : await fetch('/api/admin?mode=clinic_status', { cache: 'no-store' });
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
      if (!isSignedIn) {
        setAppointments([]);
        setAppointmentRequestAvailability('available');
        return;
      }
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
          : nextAppointments.some((appointment) => appointment.status === 'Confirmed')
            ? 'confirmed'
            : 'available');
        if (sessionStorage.getItem('mfhc_booking_after_signin') === 'true') {
          sessionStorage.removeItem('mfhc_booking_after_signin');
          const programId = sessionStorage.getItem('mfhc_booking_program') ?? '';
          sessionStorage.removeItem('mfhc_booking_program');
          if (programId) setSelectedProgramForBooking(programId);
          if (!nextAppointments.some((appointment) => ['Pending', 'Confirmed'].includes(appointment.status))) {
            setBookingModalOpenState(true);
          }
        }
      } catch {
        if (active) setAppointmentRequestAvailability((current) => current === 'pending' || current === 'confirmed' ? current : 'error');
      }
    };

    const loadUnreadMessages = async () => {
      if (!isSignedIn) {
        setUnreadAdminMessageCount(0);
        setUnreadMessagesError('');
        return;
      }
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
  }, [getToken, isSignedIn]);

  const cancelAppointment = async (id: string) => {
    const appointment = appointments.find((item) => item.id === id);
    if (!appointment) return;
    const token = await getToken();
    if (!token) throw new Error('Your Clerk sign-in session could not be verified.');
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
      setLanguage,
      toggleLanguage,
      activeSection,
      setActiveSection,
      siteContent,
      siteContentError,
      clinicOpen,
      clinicStatusError,
      appointmentRequestAvailability,
      authModalOpen,
      setAuthModalOpen,
      isSignedIn: Boolean(isSignedIn),
      bookingModalOpen: bookingModalOpenState,
      setBookingModalOpen,
      selectedProgramForBooking,
      openBookingForProgram,
      markAppointmentRequestStatus,
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