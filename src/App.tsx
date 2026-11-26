import React, { useEffect, useState } from 'react';
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
import { CheckCircle2 } from 'lucide-react';
import { AdminPanel } from './components/AdminPanel';
import { UserAppointmentChat } from './components/UserAppointmentChat';
import { PatientFlow } from './components/PatientFlow';

const AppContent: React.FC = () => {
  const { isSignedIn } = useAuth();
  const { activeSection, notificationToast, setNotificationToast, appointmentRequestAvailability, language } = useHealthCenter();

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
      <Header />

      {isSignedIn && ['pending', 'confirmed'].includes(appointmentRequestAvailability) && (
        <div role="status" aria-live="polite" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-950">
          {appointmentRequestAvailability === 'confirmed'
            ? (language === 'fil'
              ? 'May aktibo ka pang kumpirmadong appointment. Kumpletuhin o kanselahin muna ito bago mag-request muli.'
              : 'You have an active confirmed appointment. Complete or cancel it before submitting another request.')
            : (language === 'fil'
              ? 'May appointment request ka pang naghihintay ng pagsusuri ng kawani.'
              : 'You have an appointment request waiting for clinic staff to review.')}
        </div>
      )}

      <main key={activeSection} className="public-view-enter flex-1">
        {activeSection === 'information' ? (
          <PublicInformation />
        ) : activeSection === 'schedule' ? (
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
