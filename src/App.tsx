import React, { useCallback, useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/react';
import { HealthCenterProvider, useHealthCenter } from './context/HealthCenterContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { RouteFinder } from './components/RouteFinder';
import { ServicesSection } from './components/ServicesSection';
import { PublicInformation } from './components/PublicInformation';
import { AppointmentSchedule } from './components/AppointmentSchedule';
import { Footer } from './components/Footer';
import { OutreachBookingModal } from './components/OutreachBookingModal';
import { CheckCircle2, Clock3 } from 'lucide-react';
import { AdminPanel } from './components/AdminPanel';
import { UserAppointmentChat } from './components/UserAppointmentChat';
import { PatientFlow } from './components/PatientFlow';
import { AuthScreen } from './components/AuthScreen';

const AppContent: React.FC = () => {
  const { isSignedIn } = useAuth();
  const {
    activeSection,
    notificationToast,
    setNotificationToast,
    appointmentRequestAvailability,
    language,
    authModalOpen,
    setAuthModalOpen,
  } = useHealthCenter();
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), [setAuthModalOpen]);

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
    <div className="public-page-shell min-h-screen flex flex-col text-[#374151] antialiased selection:bg-[#eaf3ee] selection:text-[#0f4d3c]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-[#0f4d3c]">
        Skip to main content
      </a>
      <Header />

      {isSignedIn && ['pending', 'confirmed'].includes(appointmentRequestAvailability) && (
        <div role="status" aria-live="polite" className={`hidden border-b px-4 py-3 sm:block ${
          appointmentRequestAvailability === 'pending'
            ? 'border-amber-200 bg-amber-50 text-amber-950'
            : 'border-emerald-200 bg-emerald-50 text-emerald-950'
        }`}>
          <div className="mx-auto flex max-w-7xl items-start gap-2.5 text-sm">
            {appointmentRequestAvailability === 'pending'
              ? <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
              : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />}
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
            <PatientFlow />
          </>
        )}
      </main>

      <Footer />

      {isSignedIn && <UserAppointmentChat />}
      <OutreachBookingModal />
      {authModalOpen && <AuthScreen onClose={closeAuthModal} />}

      {notificationToast && (
        <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 z-50 flex max-w-sm items-center gap-2 rounded-md border border-white/10 bg-[#0f4d3c] px-4 py-3 text-sm font-semibold text-white shadow-lg animate-fade-in sm:bottom-5 sm:left-auto sm:right-5">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{notificationToast}</span>
        </div>
      )}
    </div>
  );
};

const PublicApp: React.FC = () => (
  <HealthCenterProvider>
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  </HealthCenterProvider>
);

export default function App() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user } = useUser();
  const [accountRole, setAccountRole] = useState<'checking' | 'admin' | 'user' | 'error'>('checking');
  const [roleError, setRoleError] = useState('');

  useEffect(() => {
    if (!isSignedIn || !user) {
      setAccountRole('checking');
      setRoleError('');
      return;
    }

    let active = true;
    setAccountRole('checking');
    void (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Your Clerk sign-in session could not be verified.');
        const response = await fetch('/api/admin?mode=role', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const responseBody = await response.text();
        let data: { role?: string; error?: string } = {};
        try {
          data = JSON.parse(responseBody) as { role?: string; error?: string };
        } catch {
          throw new Error(responseBody.trim() || `Server responded with status ${response.status}.`);
        }
        if (!response.ok || (data.role !== 'admin' && data.role !== 'user')) {
          throw new Error(data.error || 'Your account role could not be verified.');
        }
        if (!active) return;
        setAccountRole(data.role);
        setRoleError('');
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
  }, [getToken, isSignedIn, user]);

  if (!isLoaded) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#eef2ee] text-sm font-bold text-[#173a37]">
        Loading...
      </main>
    );
  }

  if (!isSignedIn) {
    return <PublicApp />;
  }

  if (accountRole === 'checking') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#eef2ee] text-sm font-bold text-[#173a37]">
        Checking account access...
      </main>
    );
  }

  if (accountRole === 'error') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#eef2ee] px-5 text-center text-[#173a37]">
        <p role="alert" className="max-w-md text-sm">{roleError}</p>
        <button type="button" onClick={() => void signOut()} className="border border-[#b9c7be] px-4 py-2 text-sm font-bold">Sign out and try again</button>
      </main>
    );
  }

  if (accountRole === 'admin') return <AdminPanel />;

  return <PublicApp />;
}
