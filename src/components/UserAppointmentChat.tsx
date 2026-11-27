import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, MessageCircle, Send, X } from 'lucide-react';
import { useAuth } from '@clerk/react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { formatAppointmentTime } from '../appointmentSchedule';

interface UserAppointment {
  id: string;
  reference_code: string;
  patient_name: string;
  service_name: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  chat_status: string;
}

interface UserMessage {
  id: string;
  appointment_id: string;
  sender_role: string;
  sender_name: string;
  message: string;
  created_at: string;
}

const WEBSITE_ASSISTANT_ACKNOWLEDGMENT = 'Got your message! Thanks for reaching out. Our Pateros HealthConnect assistant will reply any minute with information based on published health center listings.';

const isAutomatedReminder = (message: UserMessage) => message.sender_role === 'admin'
  && (message.message.startsWith('This is an automated reminder.')
    || message.message.startsWith('Reminder: Your appointment'));

const getDisplayMessage = (message: string) => {
  const legacyConfirmation = message.match(
    /^Your appointment for (.+) on (\d{4}-\d{2}-\d{2}) at (.+?) has been automatically confirmed\. You can view this schedule in your appointment chat\./,
  );
  if (!legacyConfirmation) return message;

  const [, service, date, time] = legacyConfirmation;
  return `This is an automated message.\n\nYour appointment for ${service} on ${date} at ${time} has been automatically confirmed. You can view the schedule in your appointment chat.\n\nFilipino:\nAwtomatikong mensahe ito. Kumpirmado na ang iyong appointment para sa ${service} sa ${date}, ganap na ${time}. Maaari mong tingnan ang iskedyul sa chat ng iyong appointment.`;
};

export const UserAppointmentChat: React.FC = () => {
  const { getToken } = useAuth();
  const { messagesOpen, setMessagesOpen, markAppointmentMessagesRead } = useHealthCenter();
  const [appointments, setAppointments] = useState<UserAppointment[]>([]);
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [optimisticMessage, setOptimisticMessage] = useState<UserMessage | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [lastStatuses, setLastStatuses] = useState<Record<string, string>>({});
  const [requestedReferenceCode, setRequestedReferenceCode] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState('');
  const conversationRef = useRef<HTMLDivElement>(null);

  const loadChat = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch('/api/admin', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Appointment chat could not be loaded.');
      const data = await response.json() as { appointments: UserAppointment[]; messages: UserMessage[] };
      const normalizedAppointments = data.appointments.map((appointment) => ({
        ...appointment,
        status: String(appointment.status).toLowerCase(),
        chat_status: String(appointment.chat_status || 'closed'),
      }));
      normalizedAppointments.forEach((appointment) => {
        const previousStatus = lastStatuses[appointment.id];
        if (previousStatus && previousStatus !== appointment.status && appointment.status !== 'missed') {
          window.dispatchEvent(new CustomEvent('appointment-status-change', { detail: { status: appointment.status, referenceCode: appointment.reference_code } }));
        }
      });
      setLastStatuses(Object.fromEntries(normalizedAppointments.map((appointment) => [appointment.id, appointment.status])));
      setAppointments(normalizedAppointments);
      setMessages(data.messages.filter((message) => !isAutomatedReminder(message)));
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Appointment chat could not be loaded.');
    }
  };

  useEffect(() => {
    if (!messagesOpen) return;
    void loadChat();
    const timer = window.setInterval(() => void loadChat(), 3000);
    return () => window.clearInterval(timer);
  }, [messagesOpen]);

  useEffect(() => {
    const openAppointmentMessage = (event: Event) => {
      const { referenceCode } = (event as CustomEvent<{ referenceCode?: unknown }>).detail ?? {};
      if (typeof referenceCode !== 'string') return;
      setRequestedReferenceCode(referenceCode);
      setSelectedId('');
      setMessagesOpen(true);
    };

    window.addEventListener('open-appointment-message', openAppointmentMessage);
    return () => window.removeEventListener('open-appointment-message', openAppointmentMessage);
  }, [setMessagesOpen]);

  useEffect(() => {
    if (!requestedReferenceCode) return;
    const appointment = appointments.find((item) => item.reference_code === requestedReferenceCode);
    if (!appointment) return;
    setSelectedId(appointment.id);
    setRequestedReferenceCode('');
  }, [appointments, requestedReferenceCode]);

  const selected = useMemo(() => appointments.find((appointment) => appointment.id === selectedId), [appointments, selectedId]);
  const selectedMessages = useMemo(() => messages.filter((message) => message.appointment_id === selectedId), [messages, selectedId]);
  const visibleMessages = useMemo(() => {
    let visible = selectedMessages;
    const optimisticIsSelected = optimisticMessage?.appointment_id === selectedId;
    if (optimisticIsSelected && !selectedMessages.some((message) => message.id === optimisticMessage.id)) {
      visible = [...visible, optimisticMessage];
    }
    if (assistantLoading && optimisticIsSelected && selected
      && !selectedMessages.some((message) => message.id === `${optimisticMessage.id}-ack`)) {
      visible = [...visible, {
        id: `${optimisticMessage.id}-ack`,
        appointment_id: selectedId,
        sender_role: 'assistant',
        sender_name: 'Website Assistant',
        message: WEBSITE_ASSISTANT_ACKNOWLEDGMENT,
        created_at: new Date(new Date(optimisticMessage.created_at).getTime() + 1).toISOString(),
      }];
    }
    return visible;
  }, [assistantLoading, optimisticMessage, selected, selectedId, selectedMessages]);
  const latestSelectedMessageId = selectedMessages.at(-1)?.id;

  useEffect(() => {
    if (!messagesOpen || !selected || !latestSelectedMessageId) return;
    void markAppointmentMessagesRead(selected.id).catch((caught) => {
      setError(caught instanceof Error ? caught.message : 'Messages could not be marked as read.');
    });
  }, [messagesOpen, selected?.id, latestSelectedMessageId, markAppointmentMessagesRead]);

  useEffect(() => {
    if (!messagesOpen || !selected) return;
    const conversation = conversationRef.current;
    if (conversation) conversation.scrollTop = conversation.scrollHeight;
  }, [messagesOpen, selectedId, visibleMessages.length, assistantLoading]);

  if (!messagesOpen) return null;

  const sendAssistantMessage = async (event: FormEvent) => {
    event.preventDefault();
    const question = draft.trim();
    if (!selected || !question || assistantLoading) return;
    setError('');
    setAssistantError('');
    setAssistantLoading(true);
    const clientMessageId = crypto.randomUUID();
    setOptimisticMessage({
      id: clientMessageId,
      appointment_id: selected.id,
      sender_role: 'user',
      sender_name: selected.patient_name,
      message: question,
      created_at: new Date().toISOString(),
    });
    setDraft('');
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in to ask the website assistant.');
      const response = await fetch('/api/website-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ appointmentId: selected.id, question, clientMessageId }),
      });
      const responseBody = await response.text();
      let result: { error?: string } = {};
      try {
        result = JSON.parse(responseBody) as { error?: string };
      } catch {
        if (response.ok) throw new Error('The website assistant returned an invalid response. Please try again.');
      }
      if (!response.ok && !result.error) {
        throw new Error(`The website assistant is temporarily unavailable (HTTP ${response.status}). Please try again.`);
      }
      if (!response.ok) throw new Error(result.error || 'The website assistant could not respond.');
      await loadChat();
    } catch (caught) {
      setDraft(question);
      setAssistantError(caught instanceof Error ? caught.message : 'The website assistant could not respond.');
    } finally {
      setOptimisticMessage(null);
      setAssistantLoading(false);
    }
  };

  const cancelSelectedAppointment = async () => {
    if (!selected || !['pending', 'confirmed'].includes(selected.status)) return;
    if (!window.confirm('Cancel this appointment request?')) return;
    setError('');
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in to cancel this appointment.');
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'patient_cancel', appointmentId: selected.id }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Appointment could not be cancelled.');
      await loadChat();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Appointment could not be cancelled.');
    }
  };

  return (
    <section role="dialog" aria-modal="true" aria-labelledby="messages-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setMessagesOpen(false); }}>
      <div className="flex h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#dfe6e1] bg-[#f8faf7] shadow-2xl sm:h-[min(420px,72dvh)] sm:max-h-[72dvh]">
        <header className="flex shrink-0 items-center justify-between border-b border-[#e8eeea] bg-white px-4 py-2 sm:px-5">
          <div><div className="text-[10px] font-bold text-[#17645c]">Your appointments</div><h2 id="messages-title" className="mt-0.5 text-base font-bold text-[#17312e]">Messages</h2></div>
          <button type="button" onClick={() => setMessagesOpen(false)} aria-label="Close messages" className="rounded-full p-2 text-[#66736f] transition-colors hover:bg-[#f1f4f1]"><X className="h-5 w-5" /></button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] overflow-hidden bg-white lg:grid-cols-[190px_minmax(0,1fr)]">
          <aside className={`${selected ? 'hidden lg:block' : 'block'} min-h-0 overflow-y-auto border-b border-[#dfe6e1] lg:border-b-0 lg:border-r`}>
            {appointments.map((appointment) => (
              <button key={appointment.id} type="button" onClick={() => { setAssistantError(''); setSelectedId(appointment.id); }} className={`w-full border-b border-[#edf1ee] px-3 py-3 text-left transition-colors hover:bg-[#f4f7f4] ${selectedId === appointment.id ? 'bg-[#edf3ef]' : ''}`}>
                <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-bold text-[#17312e]">{appointment.service_name}</div><div className="mt-1 text-xs text-[#66736f]">{appointment.reference_code}</div></div><span className={`px-2 py-1 text-[10px] font-bold uppercase ${appointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : appointment.status === 'completed' ? 'bg-sky-100 text-sky-800' : appointment.status === 'missed' || appointment.status === 'cancelled' || appointment.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{appointment.status}</span></div>
                <div className="mt-1.5 text-[11px] text-[#66736f]">{appointment.preferred_date} · {formatAppointmentTime(appointment.preferred_time)}</div>
              </button>
            ))}
            {appointments.length === 0 && <p className="p-4 text-sm text-[#66736f]">No conversations yet</p>}
          </aside>

          <div className={`${selected ? 'block' : 'hidden'} h-full min-h-0 min-w-0 overflow-hidden lg:block`}>
            {!selected ? <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-[#66736f]">Select a conversation</div> : (
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <div className="sticky top-0 z-10 flex min-w-0 shrink-0 items-center justify-between gap-2 border-b border-[#e7ece9] bg-white px-3 py-2 sm:px-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <button type="button" onClick={() => setSelectedId('')} className="shrink-0 rounded-full p-1 hover:bg-[#f1f4f1] lg:hidden" aria-label="Back to conversations"><ChevronLeft className="h-5 w-5 text-[#17645c]" /></button>
                    <MessageCircle className="h-4 w-4 shrink-0 text-[#17645c]" />
                    <div className="min-w-0"><div className="truncate text-[13px] font-bold">{selected.service_name}</div><div className="text-[10px] text-[#66736f]">{selected.chat_status === 'closed' ? 'Chat closed by clinic staff' : 'Chat open'}</div></div>
                  </div>
                  {['pending', 'confirmed'].includes(selected.status) && <button type="button" onClick={() => void cancelSelectedAppointment()} className="min-h-8 shrink-0 rounded-md border border-rose-200 px-2.5 text-[11px] font-bold text-rose-700 transition-colors hover:bg-rose-50">Cancel appointment</button>}
                </div>
                <div ref={conversationRef} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain bg-[#f7f9f8] px-3 py-2.5 sm:px-4">
                  {visibleMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender_role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[min(82%,28rem)] rounded-2xl px-2.5 py-1.5 text-[12px] leading-[1.4] ${message.sender_role === 'user' ? 'rounded-br-md bg-[#17645c] text-white' : 'rounded-bl-md border border-[#e8eeea] bg-white text-[#17312e]'}`}><div className="whitespace-pre-line break-words">{getDisplayMessage(message.message)}</div><div className={`mt-0.5 text-[9px] leading-3 ${message.sender_role === 'user' ? 'text-white/70' : 'text-[#87938c]'}`}>{message.id === optimisticMessage?.id ? 'Sending…' : message.sender_name}</div></div></div>
                  ))}
                </div>
                {selected.chat_status === 'open' ? (
                  <div className="shrink-0 border-t border-[#e7ece9] bg-white px-3 py-1.5 sm:px-4">
                    {assistantError && <p role="alert" className="mb-2 text-xs text-rose-800">{assistantError}</p>}
                    <form onSubmit={sendAssistantMessage} className="flex items-center gap-2">
                      <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1200} placeholder="Ask about the health center website" className="h-9 min-w-0 flex-1 rounded-full border border-[#d8e0db] bg-[#f7f9f8] px-3.5 text-xs outline-none transition-colors placeholder:text-[#9aa59f] focus:border-[#17645c] focus:bg-white" />
                      <button type="submit" disabled={!draft.trim() || assistantLoading} aria-label="Send question to website assistant" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#17645c] text-white transition-colors hover:bg-[#124f49] disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-3.5 w-3.5" /></button>
                    </form>
                  </div>
                ) : <div className="shrink-0 border-t border-[#e7ece9] bg-white px-4 py-3 text-center text-xs font-semibold text-[#66736f]">This chat has been closed by clinic staff</div>}
              </div>
            )}
          </div>
        </div>
        {error && <p role="alert" className="shrink-0 border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-800">{error}</p>}
        </div>
      </div>
    </section>
  );
};
