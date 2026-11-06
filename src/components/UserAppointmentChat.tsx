import React, { FormEvent, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { MessageCircle, Send, X } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';

interface ChatAppointment {
  id: string;
  reference_code: string;
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

async function chatRequest(user: User, body?: Record<string, unknown>) {
  const token = await user.getIdToken();
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

export const UserAppointmentChat: React.FC<{ user: User }> = ({ user }) => {
  const { language, messagesOpen, setMessagesOpen } = useHealthCenter();
  const isFilipino = language === 'fil';
  const [appointments, setAppointments] = useState<ChatAppointment[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [messageDraft, setMessageDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!messagesOpen) return;
    let active = true;
    setLoading(true);

    const loadMessages = async () => {
      try {
        const response = await chatRequest(user);
        if (!response.ok) throw new Error('Messages could not be loaded.');
        const data = await response.json() as ChatResponse;
        if (!active) return;
        setAppointments(data.appointments);
        setMessages(data.messages);
        setSelectedAppointmentId((current) => (
          current && data.appointments.some((appointment) => appointment.id === current)
            ? current
            : data.appointments[0]?.id ?? ''
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
  }, [messagesOpen, user]);

  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedAppointmentId);
  const selectedMessages = messages.filter((message) => message.appointment_id === selectedAppointmentId);
  const latestAdminMessage = [...selectedMessages].reverse().find((message) => message.sender_role === 'admin');

  useEffect(() => {
    if (!messagesOpen || !selectedAppointmentId || !latestAdminMessage) return;
    void chatRequest(user, { action: 'mark_chat_read', appointmentId: selectedAppointmentId });
  }, [messagesOpen, selectedAppointmentId, latestAdminMessage?.created_at, user]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = messageDraft.trim();
    if (!selectedAppointment || selectedAppointment.chat_status !== 'open' || !message || sending) return;

    setSending(true);
    setError('');
    try {
      const response = await chatRequest(user, {
        action: 'message',
        appointmentId: selectedAppointment.id,
        senderName: user.displayName || 'Patient',
        message,
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error || 'Message could not be sent.');
      }
      setMessageDraft('');
      const refresh = await chatRequest(user);
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setMessagesOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="patient-messages-title" className="flex max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-2xl flex-col bg-white shadow-2xl sm:max-h-[85dvh]">
        <header className="flex items-center justify-between gap-4 border-b border-[#dce7e1] px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-[#17645c]" aria-hidden="true" />
            <h2 id="patient-messages-title" className="text-lg font-bold text-[#17312e]">{isFilipino ? 'Mga mensahe sa appointment' : 'Appointment messages'}</h2>
          </div>
          <button type="button" onClick={() => setMessagesOpen(false)} aria-label={isFilipino ? 'Isara ang mga mensahe' : 'Close messages'} className="flex h-11 w-11 items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="border-b border-[#e7eee9] px-4 py-3 sm:px-6">
          {appointments.length > 0 ? (
            <select aria-label={isFilipino ? 'Piliin ang appointment' : 'Select appointment'} value={selectedAppointmentId} onChange={(event) => setSelectedAppointmentId(event.target.value)} className="min-h-11 w-full border border-slate-300 bg-white px-3 text-sm text-slate-800">
              {appointments.map((appointment) => (
                <option key={appointment.id} value={appointment.id}>
                  {appointment.reference_code} · {appointment.service_name} · {appointment.preferred_date}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-slate-600">{isFilipino ? 'Wala pang appointment conversation.' : 'No appointment conversations yet.'}</p>
          )}
        </div>

        <div className="min-h-48 flex-1 space-y-3 overflow-y-auto bg-[#f7faf8] px-4 py-4 sm:px-6" aria-live="polite">
          {loading && messages.length === 0 && <p role="status" className="text-sm text-slate-500">{isFilipino ? 'Naglo-load ng mga mensahe...' : 'Loading messages...'}</p>}
          {selectedMessages.map((message) => (
            <div key={message.id} className={`flex ${message.sender_role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <article className={`max-w-[85%] whitespace-pre-wrap break-words px-4 py-3 text-sm ${message.sender_role === 'user' ? 'bg-[#17645c] text-white' : 'border border-[#e0e8e2] bg-white text-[#17312e]'}`}>
                <p>{message.message}</p>
                <p className={`mt-2 text-[10px] ${message.sender_role === 'user' ? 'text-white/75' : 'text-slate-500'}`}>
                  {message.sender_name} · {new Intl.DateTimeFormat(isFilipino ? 'fil-PH' : 'en-PH', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(message.created_at))}
                </p>
              </article>
            </div>
          ))}
          {!loading && selectedAppointment && selectedMessages.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">{isFilipino ? 'Wala pang mensahe sa usapang ito.' : 'No messages in this conversation yet.'}</p>
          )}
          {error && <p role="alert" className="text-sm font-medium text-rose-700">{error}</p>}
        </div>

        {selectedAppointment?.chat_status === 'open' ? (
          <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#dce7e1] bg-white p-3 sm:p-4">
            <input value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} maxLength={2000} aria-label={isFilipino ? 'Isulat ang mensahe' : 'Write a message'} placeholder={isFilipino ? 'Isulat ang mensahe...' : 'Write a message...'} className="min-h-11 min-w-0 flex-1 border border-slate-300 px-3 text-sm outline-none focus:border-[#17645c] focus:ring-2 focus:ring-[#17645c]/15" />
            <button type="submit" disabled={sending || !messageDraft.trim()} aria-label={isFilipino ? 'Ipadala ang mensahe' : 'Send message'} className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#17645c] text-white hover:bg-[#104f49] disabled:cursor-not-allowed disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </form>
        ) : selectedAppointment ? (
          <p className="border-t border-[#dce7e1] px-4 py-4 text-center text-sm text-slate-600 sm:px-6">
            {isFilipino ? 'Nakasara ang chat na ito. Makipag-ugnayan sa clinic staff para sa tulong.' : 'This chat is closed. Contact clinic staff for assistance.'}
          </p>
        ) : null}
      </section>
    </div>
  );
};