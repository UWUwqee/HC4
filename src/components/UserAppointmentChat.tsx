import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth, useUser } from '@clerk/react';
import { CalendarClock, ChevronLeft, MessageCircle, Send, X } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { formatAppointmentTime } from '../appointmentSchedule';

interface ChatAppointment {
  id: string;
  reference_code: string;
  patient_name: string;
  service_name: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  chat_status: string;
}

interface ChatMessage {
  id: string;
  appointment_id: string;
  sender_role: string;
  sender_name: string;
  message: string;
  created_at: string;
}

interface ChatResponse {
  appointments: ChatAppointment[];
  messages: ChatMessage[];
}

async function chatRequest(getToken: () => Promise<string | null>, body?: Record<string, unknown>) {
  const token = await getToken();
  if (!token) throw new Error('Your Clerk sign-in session could not be verified.');
  return fetch('/api/admin', {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
}

export const UserAppointmentChat: React.FC = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { language, messagesOpen, setMessagesOpen } = useHealthCenter();
  const isFilipino = language === 'fil';
  const [appointments, setAppointments] = useState<ChatAppointment[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const lastStatuses = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!messagesOpen) return;
    let active = true;
    setLoading(true);

    const loadMessages = async () => {
      try {
        const response = await chatRequest(getToken);
        if (!response.ok) throw new Error('Messages could not be loaded.');
        const data = await response.json() as ChatResponse;
        if (!active) return;
        const nextStatuses: Record<string, string> = {};
        data.appointments.forEach((appointment) => {
          const status = appointment.status.toLowerCase();
          const previousStatus = lastStatuses.current[appointment.id];
          if (previousStatus && previousStatus !== status) {
            window.dispatchEvent(new CustomEvent('appointment-status-change', {
              detail: { status, referenceCode: appointment.reference_code },
            }));
          }
          nextStatuses[appointment.id] = status;
        });
        lastStatuses.current = nextStatuses;
        setAppointments(data.appointments);
        setMessages(data.messages);
        setSelectedAppointmentId((current) => (
          current && data.appointments.some((appointment) => appointment.id === current)
            ? current
            : ''
        ));
        setError('');
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : 'Messages could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadMessages();
    const timer = window.setInterval(() => void loadMessages(), 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [messagesOpen, getToken]);

  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedAppointmentId);
  const selectedMessages = messages.filter((message) => message.appointment_id === selectedAppointmentId);
  const latestAdminMessage = [...selectedMessages].reverse().find((message) => message.sender_role === 'admin');

  const cancelSelectedAppointment = async () => {
    if (!selectedAppointment || !['pending', 'confirmed'].includes(selectedAppointment.status.toLowerCase())) return;
    if (!window.confirm(isFilipino ? 'Kanselahin ang appointment na ito?' : 'Cancel this appointment?')) return;
    setError('');
    try {
      const response = await chatRequest(getToken, {
        action: 'patient_cancel',
        appointmentId: selectedAppointment.id,
      });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error || 'Appointment could not be cancelled.');
      }
      const refresh = await chatRequest(getToken);
      if (!refresh.ok) throw new Error('Appointment was cancelled, but the conversation could not be refreshed.');
      const data = await refresh.json() as ChatResponse;
      setAppointments(data.appointments);
      setMessages(data.messages);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Appointment could not be cancelled.');
    }
  };

  useEffect(() => {
    if (!messagesOpen || !selectedAppointmentId || !latestAdminMessage) return;
    void chatRequest(getToken, { action: 'mark_chat_read', appointmentId: selectedAppointmentId });
  }, [messagesOpen, selectedAppointmentId, latestAdminMessage?.created_at, getToken]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = messageDraft.trim();
    if (!selectedAppointment || selectedAppointment.chat_status !== 'open' || !message || sending) return;

    setSending(true);
    setError('');
    try {
      const response = await chatRequest(getToken, {
        action: 'message',
        appointmentId: selectedAppointment.id,
        senderName: user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Patient',
        message,
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error || 'Message could not be sent.');
      }
      setMessageDraft('');
      const refresh = await chatRequest(getToken);
      if (!refresh.ok) throw new Error('Message sent, but the conversation could not be refreshed.');
      const data = await refresh.json() as ChatResponse;
      setAppointments(data.appointments);
      setMessages(data.messages);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  if (!messagesOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setMessagesOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="patient-messages-title" className="flex max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-5xl flex-col overflow-hidden border border-[#dfe6e1] bg-[#f8faf7] shadow-2xl sm:max-h-[92dvh]">
        <header className="flex shrink-0 items-center justify-between border-b border-[#dfe6e1] bg-white px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <div className="text-xs font-bold text-[#17645c]">{isFilipino ? 'Iyong mga appointment' : 'Your appointments'}</div>
            <h2 id="patient-messages-title" className="mt-1 text-xl font-bold text-[#17312e]">{isFilipino ? 'Mga mensahe' : 'Messages'}</h2>
          </div>
          <button type="button" onClick={() => setMessagesOpen(false)} aria-label={isFilipino ? 'Isara ang mga mensahe' : 'Close messages'} className="flex h-11 w-11 items-center justify-center text-[#66736f] hover:bg-[#f1f4f1]">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className={`${selectedAppointment ? 'hidden lg:block' : 'block'} border-b border-[#dfe6e1] bg-white lg:border-b-0 lg:border-r`}>
            {appointments.map((appointment) => (
              <button
                key={appointment.id}
                type="button"
                onClick={() => setSelectedAppointmentId(appointment.id)}
                className={`w-full border-b border-[#edf1ee] px-4 py-4 text-left hover:bg-[#f4f7f4] ${
                  selectedAppointmentId === appointment.id ? 'bg-[#edf3ef]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-[#17312e]">{appointment.service_name}</div>
                    <div className="mt-1 text-xs text-[#66736f]">{appointment.reference_code}</div>
                  </div>
                  <span className={`shrink-0 px-2 py-1 text-[10px] font-bold uppercase ${
                    appointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800'
                      : appointment.status === 'completed' ? 'bg-sky-100 text-sky-800'
                        : appointment.status === 'cancelled' || appointment.status === 'rejected' ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                  }`}>{appointment.status}</span>
                </div>
                <div className="mt-2 text-xs text-[#66736f]">{appointment.preferred_date} · {formatAppointmentTime(appointment.preferred_time)}</div>
              </button>
            ))}
            {appointments.length === 0 && (
              <p className="p-4 text-sm text-[#66736f]">
                {loading
                  ? (isFilipino ? 'Naglo-load ng mga appointment...' : 'Loading appointments...')
                  : (isFilipino ? 'Wala pang appointment conversation.' : 'No appointment conversations yet.')}
              </p>
            )}
          </aside>

          <div className={`${selectedAppointment ? 'block' : 'hidden'} min-w-0 lg:block`}>
            {!selectedAppointment ? (
              <div className="flex min-h-[360px] items-center justify-center px-6 text-center text-sm text-[#66736f]">
                {isFilipino ? 'Pumili ng appointment para makita ang mga mensahe.' : 'Select an appointment to view its messages.'}
              </div>
            ) : (
              <div className="flex min-h-[min(420px,55dvh)] flex-col">
                <div className="flex min-w-0 items-center gap-2 border-b border-[#dfe6e1] bg-white px-3 py-3 sm:px-4">
                  <button type="button" onClick={() => setSelectedAppointmentId('')} className="shrink-0 lg:hidden" aria-label={isFilipino ? 'Bumalik sa mga pag-uusap' : 'Back to conversations'}>
                    <ChevronLeft className="h-5 w-5 text-[#17645c]" />
                  </button>
                  <MessageCircle className="h-4 w-4 shrink-0 text-[#17645c]" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">{selectedAppointment.service_name}</div>
                    <div className="text-[11px] text-[#66736f]">{selectedAppointment.chat_status === 'closed'
                      ? (isFilipino ? 'Sarado ang chat ng kawani' : 'Chat closed by clinic staff')
                      : (isFilipino ? 'Bukas ang chat' : 'Chat open')}</div>
                  </div>
                </div>

                {['pending', 'confirmed'].includes(selectedAppointment.status.toLowerCase()) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dfe6e1] bg-white px-3 py-2 sm:px-4">
                    <p className="text-[11px] text-[#66736f]">
                      {isFilipino ? 'Kanselahin kung kailangan mong baguhin ang appointment.' : 'Cancel if you need to change your appointment.'}
                    </p>
                    <button type="button" onClick={() => void cancelSelectedAppointment()} className="min-h-10 border border-rose-200 px-3 text-xs font-bold text-rose-700 hover:bg-rose-50">
                      <CalendarClock className="mr-1 inline h-4 w-4" aria-hidden="true" />{isFilipino ? 'Kanselahin' : 'Cancel appointment'}
                    </button>
                  </div>
                )}

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-white px-3 py-4 sm:px-4" aria-live="polite">
                  {loading && selectedMessages.length === 0 && <p role="status" className="text-sm text-[#66736f]">{isFilipino ? 'Naglo-load ng mga mensahe...' : 'Loading messages...'}</p>}
                  {selectedMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender_role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <article className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm ${
                        message.sender_role === 'user' ? 'rounded-br-sm bg-[#17645c] text-white' : 'rounded-bl-sm bg-[#edf1ee] text-[#17312e]'
                      }`}>
                        <p>{message.message}</p>
                        <p className={`mt-1 text-[10px] ${message.sender_role === 'user' ? 'text-white/70' : 'text-[#66736f]'}`}>{message.sender_name}</p>
                      </article>
                    </div>
                  ))}
                  {!loading && selectedMessages.length === 0 && (
                    <p className="flex min-h-40 items-center justify-center text-center text-xs text-[#87938c]">
                      {selectedAppointment.chat_status === 'deleted'
                        ? (isFilipino ? 'Tinanggal ang pag-uusap na ito para sa parehong account.' : 'This conversation was deleted for both accounts.')
                        : (isFilipino ? 'Wala pang mensahe sa usapang ito.' : 'No messages for this request yet.')}
                    </p>
                  )}
                  {error && <p role="alert" className="text-xs text-rose-800">{error}</p>}
                </div>

                {selectedAppointment.chat_status === 'open' ? (
                  <form onSubmit={sendMessage} className="flex shrink-0 gap-2 border-t border-[#dfe6e1] bg-white p-2.5 sm:p-3">
                    <input value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} maxLength={2000} aria-label={isFilipino ? 'Isulat ang mensahe' : 'Message clinic staff'} placeholder={isFilipino ? 'Isulat ang mensahe...' : 'Message clinic staff'} className="h-11 min-w-0 flex-1 rounded-full border border-[#cfd8d2] px-4 text-sm outline-none focus:border-[#17645c]" />
                    <button type="submit" disabled={sending || !messageDraft.trim()} aria-label={isFilipino ? 'Ipadala ang mensahe' : 'Send message'} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#17645c] text-white hover:bg-[#104f49] disabled:cursor-not-allowed disabled:opacity-50">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <div className="border-t border-[#dfe6e1] bg-white px-4 py-4 text-center text-xs font-bold text-[#66736f]">
                    {selectedAppointment.chat_status === 'deleted'
                      ? (isFilipino ? 'Tinanggal ang pag-uusap na ito at hindi na mabubuksan.' : 'This conversation has been deleted and cannot be reopened.')
                      : (isFilipino ? 'Sarado ang chat na ito ng kawani ng klinika.' : 'This conversation is closed by clinic staff.')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};