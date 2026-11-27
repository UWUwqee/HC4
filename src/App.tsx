import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth, useUser } from '@clerk/react';
import { HealthCenterProvider, useHealthCenter } from './context/HealthCenterContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { RouteFinder } from './components/RouteFinder';
import { ServicesSection } from './components/ServicesSection';
import { PublicInformation } from './components/PublicInformation';
import { AppointmentSchedule } from './components/AppointmentSchedule';
import { Footer } from './components/Footer';
import { OutreachBookingModal } from './components/OutreachBookingModal';
import { CheckCircle2, Clock3, MessageCircleMore, X } from 'lucide-react';
import { AuthScreen } from './components/AuthScreen';
import { AdminPanel } from './components/AdminPanel';
import { UserAppointmentChat } from './components/UserAppointmentChat';
import patientFlowDiagram from './assets/images/DIAGRAM xd.png';
import { AccessibilityProvider } from './context/AccessibilityContext';

const AppContent: React.FC = () => {
  const [patientFlowOpen, setPatientFlowOpen] = useState(false);
  const {
    activeSection,
    notificationToast,
    setNotificationToast,
    appointmentRequestAvailability,
    language,
    isSignedIn,
    authModalOpen,
    setAuthModalOpen,
    setMessagesOpen,
    unreadAdminMessageCount,
    unreadMessagesError,
  } = useHealthCenter();

  useEffect(() => {
    if (!patientFlowOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPatientFlowOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [patientFlowOpen]);

  useEffect(() => {
    const handleStatusChange = (event: Event) => {
      const detail = (event as CustomEvent<{ status: string; referenceCode: string }>).detail;
      setNotificationToast(detail.status === 'confirmed'
        ? `Appointment ${detail.referenceCode} approved.`
        : detail.status === 'completed'
          ? `Appointment ${detail.referenceCode} marked completed and removed from the public schedule.`
        : detail.status === 'rejected' || detail.status === 'cancelled'
          ? `Appointment ${detail.referenceCode} ${detail.status}.`
          : `Appointment ${detail.referenceCode} updated.`);
    };
    window.addEventListener('appointment-status-change', handleStatusChange);
    return () => window.removeEventListener('appointment-status-change', handleStatusChange);
  }, [setNotificationToast]);

  return (
    <AccessibilityProvider>
    <div className="public-page-shell min-h-screen flex flex-col text-[#374151] antialiased selection:bg-[#eaf3ee] selection:text-[#0f4d3c]">
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      <Header />
      {isSignedIn && (
        <button
          type="button"
          onClick={() => setMessagesOpen(true)}
          aria-label={`Messages${unreadAdminMessageCount > 0 ? `, ${unreadAdminMessageCount} unread` : ''}`}
          aria-haspopup="dialog"
          title={unreadMessagesError || (unreadAdminMessageCount > 0 ? `${unreadAdminMessageCount} unread message${unreadAdminMessageCount === 1 ? '' : 's'}` : 'Messages')}
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0f4d3c] text-white shadow-lg ring-2 ring-white transition-colors hover:bg-[#17645c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#17645c] xl:hidden"
        >
          <MessageCircleMore className="h-7 w-7" aria-hidden="true" />
          {unreadAdminMessageCount > 0 && (
            <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-none text-white">
              {unreadAdminMessageCount > 99 ? '99+' : unreadAdminMessageCount}
            </span>
          )}
        </button>
      )}
      {(appointmentRequestAvailability === 'pending' || appointmentRequestAvailability === 'confirmed') && (
        <div role="status" aria-live="polite" className={`hidden border-b px-4 py-3 sm:block ${appointmentRequestAvailability === 'pending' ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-emerald-200 bg-emerald-50 text-emerald-950'}`}>
          <div className="mx-auto flex max-w-7xl items-start gap-2.5 text-sm">
            {appointmentRequestAvailability === 'pending'
              ? <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />}
            <p>{appointmentRequestAvailability === 'pending'
              ? (language === 'fil'
                ? 'Sinusuri pa ng kawani ang iyong appointment request. Mag-a-update ang abisong ito kapag may aksyon na.'
                : 'Your appointment request is under review. This notice will update when clinic staff respond.')
              : (language === 'fil'
                ? 'May kumpirmado kang appointment. Kumpletuhin o kanselahin muna ito bago humiling muli.'
                : 'You have an accepted appointment. Complete or cancel it before requesting another.')}</p>
          </div>
        </div>
      )}

      <main id="main-content" key={activeSection} tabIndex={-1} className="public-view-enter flex-1">
        {activeSection === 'clinic-information' ? (
          <PublicInformation />
        ) : activeSection === 'appointment-schedule' ? (
          <AppointmentSchedule />
        ) : activeSection === 'services' ? (
          <ServicesSection />
        ) : (
          <>
            <Hero />
            <RouteFinder />
            <section aria-label="Patient flow diagram" className="site-section-bg section-enter border-t border-[#dce7e1] py-8 sm:py-10">
              <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
                <button
                  type="button"
                  onClick={() => setPatientFlowOpen(true)}
                  aria-label="View patient flow diagram at full size"
                  className="group mx-auto block w-full max-w-6xl cursor-zoom-in overflow-hidden rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#17645c]"
                >
                  <img
                    src={patientFlowDiagram}
                    alt="Patient flow and visit information: registration, initial screening, consultation and follow-up, and clinic-specific visit guidance."
                    loading="lazy"
                    decoding="async"
                    className="block h-auto w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />

      {isSignedIn && <UserAppointmentChat />}
      <OutreachBookingModal />
      {authModalOpen && <AuthScreen onClose={() => setAuthModalOpen(false)} />}
      {patientFlowOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Patient flow diagram"
          className="fixed inset-0 z-[70] flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-slate-950/90 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-8"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setPatientFlowOpen(false); }}
        >
          <button type="button" onClick={() => setPatientFlowOpen(false)} aria-label="Close patient flow diagram" className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          <img
            src={patientFlowDiagram}
            alt="Patient flow and visit information: registration, initial screening, consultation and follow-up, and clinic-specific visit guidance."
            className="block h-auto w-auto max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem)] max-w-[calc(100vw-2rem)] object-contain"
          />
        </div>,
        document.body,
      )}

      {notificationToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#0f4d3c] text-white px-4 py-3 rounded-md shadow-lg border border-white/10 text-sm font-semibold flex items-center gap-2 max-w-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{notificationToast}</span>
        </div>
      )}
    </div>
    </AccessibilityProvider>
  );
};

export default function App() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user } = useUser();
  const [accountRole, setAccountRole] = useState<'checking' | 'admin' | 'user' | 'error'>('checking');
  const [roleError, setRoleError] = useState('');
  const verifiedUserId = useRef<string | null>(null);
  const userId = user?.id ?? null;
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) {
      setAccountRole('checking');
      setRoleError('');
      verifiedUserId.current = null;
      return;
    }

    let active = true;
    if (verifiedUserId.current !== userId) setAccountRole('checking');
    void (async () => {
      try {
        const token = await getTokenRef.current();
        if (!token) throw new Error('Your Clerk session could not be verified.');
        const response = await fetch('/api/admin?mode=role', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await response.json() as { role?: string; error?: string };
        if (!response.ok || (data.role !== 'admin' && data.role !== 'user')) {
          throw new Error(data.error || 'Your account role could not be verified.');
        }
        if (!active) return;
        verifiedUserId.current = userId;
        setAccountRole(data.role);
        setRoleError('');
        if (data.role === 'admin') {
          sessionStorage.removeItem('mfhc_booking_after_signin');
          sessionStorage.removeItem('mfhc_booking_program');
        }
        if (data.role === 'user' && window.location.pathname === '/admin') {
          window.history.replaceState(null, '', '/');
        }
      } catch (caught) {
        if (!active) return;
        setRoleError(caught instanceof Error ? caught.message : 'Your account role could not be verified.');
        setAccountRole('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, userId]);

  if (isLoaded && isSignedIn && user && accountRole === 'checking') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#eef2ee] text-sm font-bold text-[#173a37]">
        Checking account access...
      </main>
    );
  }

  if (isLoaded && isSignedIn && user && accountRole === 'error') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#eef2ee] px-5 text-center text-[#173a37]">
        <p role="alert" className="max-w-md text-sm">{roleError}</p>
        <button type="button" onClick={() => void signOut()} className="border border-[#b9c7be] px-4 py-2 text-sm font-bold">Sign out and try again</button>
      </main>
    );
  }

  if (isLoaded && isSignedIn && user && accountRole === 'admin') return <AdminPanel />;

  return (
    <HealthCenterProvider>
      <AppContent />
    </HealthCenterProvider>
  );
}
