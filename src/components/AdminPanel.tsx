import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/react';
import { AlertCircle, CalendarDays, Check, CheckCircle2, ChevronLeft, Clock3, LockKeyhole, MessageCircle, Search, Send, Trash2 } from 'lucide-react';
import { AdminCalendar, SlotSetting, SlotSettingsForm } from './AdminCalendar';
import { AdminContentManager } from './AdminContentManager';
import { formatAppointmentTime, getAppointmentTimeMinutes } from '../appointmentSchedule';
import centerPhoto from '../assets/images/MR FLORES.png';

interface AppointmentRow {
  id: string;
  owner_uid: string;
  reference_code: string;
  patient_name: string;
  phone: string;
  email: string;
  address: string | null;
  chief_complaint: string | null;
  age: number | null;
  guardian_name: string | null;
  guardian_relationship: string | null;
  priority_categories: string;
  attendance_consent: number;
  zone: string;
  service_name: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  chat_status: string;
  created_at: string;
  completed_at: string | null;
  missed_at: string | null;
}

interface ChatMessage {
  id: string;
  appointment_id: string;
  sender_uid: string;
  sender_role: string;
  sender_name: string;
  message: string;
  created_at: string;
}

const priorityCategoryLabels = {
  pwd: 'Person with disability (PWD)',
  senior_citizen: 'Senior citizen',
  pregnant_lactating: 'Pregnant or lactating',
  animal_bite: 'Animal Bite (urgent rabies vaccination)',
};

function getPriorityCategoryLabels(value: string) {
  return value.split(',')
    .filter((category): category is keyof typeof priorityCategoryLabels => (
      Object.prototype.hasOwnProperty.call(priorityCategoryLabels, category)
    ))
    .map((category) => priorityCategoryLabels[category]);
}

function exportCompletedAppointments(appointments: AppointmentRow[]) {
  const columns: Array<keyof AppointmentRow> = [
    'reference_code', 'patient_name', 'phone', 'email', 'address', 'chief_complaint', 'age', 'priority_categories',
    'zone', 'service_name', 'preferred_date', 'preferred_time', 'status', 'created_at', 'completed_at',
  ];
  const csvCell = (value: string) => {
    const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
    return `"${safeValue.replaceAll('"', '""')}"`;
  };
  const rows = [
    columns.map((column) => csvCell(column.replaceAll('_', ' '))).join(','),
    ...appointments.map((appointment) => columns.map((column) => csvCell(String(appointment[column] ?? ''))).join(',')),
  ];
  const blob = new Blob([`\uFEFF${rows.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `completed-medical-history-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export const AdminPanel: React.FC = () => {
  const { getToken, signOut } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [slotSettings, setSlotSettings] = useState<SlotSetting[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'priority' | 'completed' | 'missed' | 'calendar' | 'content'>('requests');
  const [selectedId, setSelectedId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [appointmentDateFilter, setAppointmentDateFilter] = useState('');
  const [search, setSearch] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWorkspace = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in to continue.");
      const response = await fetch('/api/admin', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(response.status === 403 ? 'This account is not an admin.' : 'Admin workspace could not be loaded.');
      const data = await response.json() as {
        role: string;
        appointments: AppointmentRow[];
        messages: ChatMessage[];
        slotSettings?: SlotSetting[];
      };
      if (data.role !== 'admin') throw new Error('This account is not an admin.');
      setAppointments(data.appointments
        .filter((appointment) => appointment.status !== 'rejected')
        .slice()
        .sort((first, second) => first.preferred_date.localeCompare(second.preferred_date)
          || (getAppointmentTimeMinutes(first.preferred_time) ?? 1440) - (getAppointmentTimeMinutes(second.preferred_time) ?? 1440)
          || first.patient_name.localeCompare(second.patient_name)));
      setMessages(data.messages);
      setSlotSettings(data.slotSettings ?? []);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Admin workspace could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkspace();
    const timer = window.setInterval(() => void loadWorkspace(), 3000);
    return () => window.clearInterval(timer);
  }, []);

  const selected = useMemo(() => appointments.find((appointment) => appointment.id === selectedId), [appointments, selectedId]);
  const selectedMessages = useMemo(() => messages.filter((message) => message.appointment_id === selectedId), [messages, selectedId]);
  const counts = useMemo(() => ({
    pending: appointments.filter((appointment) => appointment.status === 'pending').length,
    confirmed: appointments.filter((appointment) => appointment.status === 'confirmed').length,
    completed: appointments.filter((appointment) => appointment.status === 'completed').length,
    missed: appointments.filter((appointment) => appointment.status === 'missed').length,
  }), [appointments]);
  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const inSelectedSection = activeTab === 'completed'
        ? appointment.status === 'completed'
        : activeTab === 'missed'
          ? appointment.status === 'missed'
          : appointment.status !== 'completed' && appointment.status !== 'missed';
      const matchesStatus = activeTab === 'completed' || activeTab === 'missed'
        || statusFilter === 'all'
        || (statusFilter === 'history' ? appointment.status === 'cancelled' : appointment.status === statusFilter);
      const matchesDate = !appointmentDateFilter || appointment.preferred_date === appointmentDateFilter;
      const matchesSearch = !query || [
        appointment.patient_name,
        appointment.reference_code,
        appointment.service_name,
        appointment.phone,
        appointment.address ?? '',
        appointment.chief_complaint ?? '',
        String(appointment.age ?? ''),
        getPriorityCategoryLabels(appointment.priority_categories ?? '').join(' '),
      ].some((value) => value.toLowerCase().includes(query));
      return inSelectedSection && matchesStatus && matchesDate && matchesSearch;
    }).sort((first, second) => first.preferred_date.localeCompare(second.preferred_date)
      || (getAppointmentTimeMinutes(first.preferred_time) ?? 1440) - (getAppointmentTimeMinutes(second.preferred_time) ?? 1440)
      || first.patient_name.localeCompare(second.patient_name));
  }, [activeTab, appointmentDateFilter, appointments, search, statusFilter]);
  const displayedAppointments = useMemo(() => activeTab === 'priority'
    ? filteredAppointments.filter((appointment) => getPriorityCategoryLabels(appointment.priority_categories ?? '').length > 0)
    : filteredAppointments, [activeTab, filteredAppointments]);

  const performAction = async (action: string, appointment: AppointmentRow) => {
    if (action === 'delete_chat' && !window.confirm('Archive this conversation for the patient? Messages will remain available in admin records, and the appointment request will be kept.')) return;
    if (action === 'complete' && !window.confirm('Mark this appointment as completed? The patient chat will close, and the request will move to Completed appointments.')) return;
    if (action === 'missed' && !window.confirm('Mark this appointment as missed? The appointment and patient chat will close, and the patient will be notified that they can request a new appointment.')) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in to continue.");
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, appointmentId: appointment.id }),
      });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error || 'The action could not be completed.');
      }
      if (action === 'delete_chat') {
        setAppointments((current) => current.map((item) => item.id === appointment.id ? { ...item, chat_status: 'deleted' } : item));
        setMessages((current) => current.filter((message) => message.appointment_id !== appointment.id));
        setChatInput('');
      }
      if (action === 'complete') setActiveTab('completed');
      if (action === 'missed') setActiveTab('missed');
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The action could not be completed.');
    }
  };

  const saveSlotSettings = async (date: string, settings: SlotSettingsForm) => {
    const token = await getToken();
      if (!token) throw new Error("Sign in to continue.");
    const response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ action: 'save_slot_settings', date, ...settings }),
    });
    const result = await response.json() as { slotSettings?: SlotSetting[]; error?: string };
    const updatedSettings = result.slotSettings;
    if (!response.ok || !Array.isArray(updatedSettings)) {
      throw new Error(result.error || 'Slot settings could not be saved.');
    }
    setSlotSettings((current) => [
      ...current.filter((item) => item.appointment_date !== date),
      ...updatedSettings,
    ]);
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !chatInput.trim()) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in to continue.");
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'message', appointmentId: selected.id, message: chatInput.trim(), senderName: 'ADMIN' }),
      });
      if (!response.ok) throw new Error('Message could not be sent.');
      setChatInput('');
      await loadWorkspace();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Message could not be sent.');
    }
  };

  return (
    <main className="admin-panel-enter min-h-screen bg-[#f3f7f4] text-[#17312e]">
      <header className="border-b border-[#0b3f32] bg-[#0f4d3c] px-4 py-4 text-white sm:px-8 sm:py-5">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-2 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img src={centerPhoto} alt="" className="h-10 w-10 shrink-0 rounded-full border border-white/25 object-cover sm:h-12 sm:w-12" />
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/70 sm:text-[11px] sm:tracking-[0.16em]">Health center staff</span><span className="border border-white/30 bg-white/10 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wider text-white sm:px-2 sm:text-[10px]">ADMIN</span></div><h1 className="mt-0.5 truncate text-sm font-bold text-white sm:text-lg">Appointment management</h1></div>
          </div>
          <button type="button" onClick={() => void signOut()} className="min-h-11 shrink-0 border border-white/30 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 sm:px-4 sm:text-sm">Sign out</button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-8 sm:py-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><p className="text-sm font-medium text-[#52635b]">Manage appointment requests and patient follow-up.</p><p className="mt-1 text-xs text-[#7b8982]">Online requests are available 24/7. Appointment times are 9:00 AM–2:00 PM in half-hour intervals, with no count limit.</p></div>
        </div>

        <section aria-label="Appointment summary" className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: 'Awaiting review', value: counts.pending, icon: Clock3, color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-l-amber-400' },
            { label: 'Accepted', value: counts.confirmed, icon: Check, color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-l-emerald-500' },
            { label: 'Completed', value: counts.completed, icon: CheckCircle2, color: 'text-sky-800', bg: 'bg-sky-50', border: 'border-l-sky-500' },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className={`flex min-w-0 items-center gap-2 border border-[#dce7e1] border-l-4 bg-white p-3 shadow-sm sm:gap-4 sm:p-4 ${border}`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center ${bg} ${color} sm:h-10 sm:w-10`}><Icon className="h-5 w-5" /></div>
              <div className="min-w-0"><div className="text-2xl font-bold leading-none">{value}</div><div className="mt-1.5 text-[11px] font-medium leading-tight text-[#66736f] sm:text-xs">{label}</div></div>
            </div>
          ))}
        </section>

        <nav aria-label="Admin sections" className="mb-5 flex gap-1 overflow-x-auto rounded-md border border-[#dce7e1] bg-white p-1 shadow-sm">
          {[
            { id: 'requests', label: 'Appointment requests' },
            { id: 'priority', label: `Priority appointments (${appointments.filter((appointment) => !['completed', 'missed'].includes(appointment.status) && getPriorityCategoryLabels(appointment.priority_categories ?? '').length > 0).length})` },
            { id: 'completed', label: `Completed appointments (${counts.completed})` },
            { id: 'missed', label: `Missed appointments (${counts.missed})` },
            { id: 'calendar', label: 'Calendar & availability' },
            { id: 'content', label: 'Website content' },
          ].map(({ id, label }) => (
            <button key={id} type="button" onClick={() => { setActiveTab(id as 'requests' | 'priority' | 'completed' | 'missed' | 'calendar' | 'content'); setSelectedId(''); }} className={`min-h-11 min-w-max flex-1 whitespace-nowrap rounded-sm px-3 py-2.5 text-center text-xs font-bold sm:px-4 sm:text-sm ${activeTab === id ? 'bg-[#0f4d3c] text-white' : 'text-[#66736f] hover:bg-[#f2f7f4] hover:text-[#0f4d3c]'}`}>{label}</button>
          ))}
        </nav>

        <div key={activeTab} className="admin-tab-enter">
        {activeTab === 'calendar' ? (
          <AdminCalendar
            appointments={appointments}
            slotSettings={slotSettings}
            onSaveSettings={saveSlotSettings}
            onSelectAppointment={(id) => { setSelectedId(id); setActiveTab('requests'); }}
          />
        ) : activeTab === 'content' ? (
          <AdminContentManager />
        ) : (
        <section className="grid min-w-0 overflow-hidden rounded-md border border-[#dce7e1] bg-white shadow-sm lg:min-h-[640px] lg:grid-cols-[350px_minmax(0,1fr)]">
          <aside className={`${selected ? 'hidden lg:block' : ''} min-w-0 border-b border-[#dce7e1] lg:border-b-0 lg:border-r`}>
            <div className="border-b border-[#edf1ee] p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">{activeTab === 'priority' ? 'Priority appointments' : activeTab === 'completed' ? 'Completed appointment requests' : activeTab === 'missed' ? 'Missed appointments' : 'Appointment requests'}</h2><span className="text-xs text-[#66736f]">{displayedAppointments.length} shown</span></div>
              {activeTab === 'priority' && <p className="mb-3 text-xs leading-relaxed text-[#66736f]">Requests marked PWD, senior citizen, or pregnant/lactating are listed here for staff attention.</p>}
              {activeTab === 'completed' && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs leading-relaxed text-[#66736f]">Completed requests are archived here and removed from the appointment request and priority lists.</p>
                  <button type="button" onClick={() => exportCompletedAppointments(displayedAppointments)} disabled={displayedAppointments.length === 0} className="min-h-11 rounded-sm bg-[#0f4d3c] px-4 text-xs font-bold text-white hover:bg-[#2c7a5f] disabled:cursor-not-allowed disabled:opacity-50">Export completed records ({displayedAppointments.length})</button>
                </div>
              )}
              {activeTab === 'missed' && <p className="mb-3 text-xs leading-relaxed text-[#66736f]">Appointments marked as missed are closed and kept here for staff reference. Patients are notified that they may submit a new request.</p>}
              <label className="flex h-10 items-center gap-2 border border-[#d9e1dc] px-3 text-[#66736f] focus-within:border-[#17645c]">
                <Search className="h-4 w-4 shrink-0" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient or reference" className="min-w-0 flex-1 text-xs text-[#17312e] outline-none" />
              </label>
              <label className="mt-3 block text-xs font-semibold text-[#66736f]">
                Filter by appointment date
                <input type="date" value={appointmentDateFilter} onChange={(event) => setAppointmentDateFilter(event.target.value)} className="mt-1 block min-h-11 w-full border border-[#d9e1dc] bg-white px-3 text-sm text-[#17312e]" />
              </label>
              {appointmentDateFilter && <button type="button" onClick={() => setAppointmentDateFilter('')} className="mt-2 min-h-11 px-3 text-xs font-semibold text-[#17645c] hover:bg-[#eaf3ee]">Show all dates</button>}
              {activeTab !== 'completed' && activeTab !== 'missed' && (
                <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
                  {[
                    ['all', 'All'],
                    ['confirmed', 'Accepted'],
                    ['history', 'Cancelled'],
                  ].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`min-h-11 shrink-0 whitespace-nowrap px-3 text-xs font-bold ${statusFilter === value ? 'bg-[#173a37] text-white' : 'bg-[#f1f4f1] text-[#66736f] hover:bg-[#e7ede8]'}`}>{label}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto lg:max-h-[calc(100vh-360px)]">
              {loading ? <p className="p-5 text-sm text-[#66736f]">Loading requests...</p> : displayedAppointments.map((appointment) => (
                <button key={appointment.id} type="button" onClick={() => setSelectedId(appointment.id)} className={`w-full border-b border-[#edf1ee] border-l-2 px-4 py-4 text-left transition-colors hover:bg-[#f5f8f5] ${selectedId === appointment.id ? 'border-l-[#17645c] bg-[#f0f5f1]' : 'border-l-transparent'}`}>
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-bold">{appointment.patient_name}</div><div className="mt-1 truncate text-xs text-[#66736f]">{appointment.service_name}</div></div><span className={`shrink-0 px-2 py-1 text-[10px] font-bold uppercase ${appointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : appointment.status === 'completed' ? 'bg-sky-100 text-sky-800' : appointment.status === 'missed' || appointment.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{appointment.status}</span></div>
                  <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-[#66736f]"><span>{appointment.preferred_date} · {formatAppointmentTime(appointment.preferred_time)}</span><span className="break-all font-mono">{appointment.reference_code}</span></div>
                  {getPriorityCategoryLabels(appointment.priority_categories ?? '').length > 0 && <div className="mt-2 text-[10px] font-semibold text-[#17645c]">{getPriorityCategoryLabels(appointment.priority_categories ?? '').join(' · ')}</div>}
                </button>
              ))}
              {!loading && displayedAppointments.length === 0 && <p className="p-5 text-sm text-[#66736f]">{activeTab === 'priority' ? 'No priority appointments match these filters.' : activeTab === 'completed' ? 'No completed appointment requests yet.' : activeTab === 'missed' ? 'No missed appointments yet.' : appointments.length ? 'No requests match these filters.' : 'No appointment requests yet.'}</p>}
            </div>
          </aside>

          <section className={`${selected ? '' : 'hidden lg:block'} min-w-0 bg-[#f8faf9]`}>
            {!selected ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                <CalendarDays className="h-9 w-9 text-[#9aaba0]" />
                <h2 className="mt-4 text-base font-bold">Select an appointment request</h2>
                <p className="mt-1 max-w-sm text-sm text-[#66736f]">Patient details, review actions, and messages will appear here.</p>
              </div>
            ) : (
              <div className="grid min-h-0 xl:min-h-[640px] xl:grid-cols-[minmax(230px,0.7fr)_minmax(320px,1.3fr)]">
                <div className="min-w-0 border-b border-[#dfe6e1] bg-white p-4 sm:p-5 xl:border-b-0 xl:border-r">
                  <button type="button" onClick={() => setSelectedId('')} className="mb-4 flex items-center gap-1 text-xs font-bold text-[#17645c] lg:hidden"><ChevronLeft className="h-4 w-4" />Back to requests</button>
                  <div className="flex items-start justify-between gap-3"><div><div className="text-[11px] font-bold uppercase tracking-wide text-[#17645c]">{['completed', 'missed', 'cancelled'].includes(selected.status) ? 'Appointment history' : 'Request details'}</div><div className="mt-1 font-mono text-xs text-[#66736f]">{selected.reference_code}</div></div><span className={`px-2 py-1 text-[10px] font-bold uppercase ${selected.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : selected.status === 'completed' ? 'bg-sky-100 text-sky-800' : selected.status === 'missed' || selected.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{selected.status}</span></div>
                  <h2 className="mt-5 break-words text-xl font-bold">{selected.patient_name}</h2>
                  <p className="mt-1 break-words text-sm text-[#66736f]">{selected.service_name}</p>
                  <dl className="mt-6 space-y-4 border-y border-[#edf1ee] py-5 text-sm">
                    <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Preferred appointment</dt><dd className="mt-1 font-medium">{selected.preferred_date} · {formatAppointmentTime(selected.preferred_time)}</dd></div>
                    {selected.age !== null && <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Age</dt><dd className="mt-1 font-medium">{selected.age}</dd></div>}
                    {selected.guardian_name && <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Parent / guardian</dt><dd className="mt-1 font-medium">{selected.guardian_name}{selected.guardian_relationship ? ` (${selected.guardian_relationship})` : ''}</dd></div>}
                    {getPriorityCategoryLabels(selected.priority_categories ?? '').length > 0 && <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Priority categories</dt><dd className="mt-1 font-medium">{getPriorityCategoryLabels(selected.priority_categories ?? '').join(', ')}</dd></div>}
                    {selected.completed_at && <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Marked completed</dt><dd className="mt-1 font-medium">{new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selected.completed_at))}</dd></div>}
                    {selected.missed_at && <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Marked missed</dt><dd className="mt-1 font-medium">{new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selected.missed_at))}</dd></div>}
                    <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Barangay</dt><dd className="mt-1 font-medium">{selected.zone}</dd></div>
                    <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Contact number</dt><dd className="mt-1 font-medium">{selected.phone}</dd></div>
                    {selected.address && <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Address</dt><dd className="mt-1 break-words font-medium">{selected.address}</dd></div>}
                    {selected.chief_complaint && <div><dt className="text-[11px] font-bold uppercase tracking-wide text-[#87938c]">Chief complaint</dt><dd className="mt-1 whitespace-pre-wrap break-words font-medium">{selected.chief_complaint}</dd></div>}
                  </dl>
                  <div className="mt-5 grid gap-2">
                    {selected.status === 'confirmed' && <button type="button" onClick={() => void performAction('complete', selected)} className="flex min-h-11 items-center justify-center gap-2 border border-sky-200 px-2 text-sm font-bold text-sky-800 hover:bg-sky-50"><CheckCircle2 className="h-4 w-4 shrink-0" />Mark completed</button>}
                    {selected.status === 'confirmed' && <button type="button" onClick={() => void performAction('missed', selected)} className="flex min-h-11 items-center justify-center gap-2 border border-rose-200 px-2 text-sm font-bold text-rose-800 hover:bg-rose-50"><AlertCircle className="h-4 w-4 shrink-0" />Mark as missed appointment</button>}
                    {!['completed', 'missed'].includes(selected.status) && selected.chat_status !== 'deleted' && <button type="button" onClick={() => void performAction(selected.chat_status === 'closed' ? 'chat_open' : 'chat_close', selected)} className="flex min-h-11 items-center justify-center gap-2 border border-[#d9e1dc] px-2 text-sm font-bold hover:bg-[#f4f6f3]"><LockKeyhole className="h-4 w-4 shrink-0" />{selected.chat_status === 'closed' ? 'Open patient chat' : 'Close patient chat'}</button>}
                  </div>
                </div>

                <div className="flex min-h-[380px] min-w-0 flex-col sm:min-h-[520px]">
                  <div className="flex min-w-0 items-center gap-2 border-b border-[#dfe6e1] bg-white px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
                    <div className="flex h-9 w-9 items-center justify-center bg-[#edf3ef] text-[#17645c]"><MessageCircle className="h-4 w-4" /></div>
                    <div className="min-w-0"><h3 className="text-sm font-bold">Patient conversation</h3><p className="mt-0.5 text-[11px] text-[#66736f]">{selected.chat_status === 'deleted' ? 'Deleted for both accounts' : selected.status === 'completed' ? 'Chat closed for completed appointment' : selected.status === 'missed' ? 'Chat closed for missed appointment' : selected.chat_status === 'closed' ? 'Open chat to send messages' : 'Chat is open with the patient'}</p></div>
                    {selected.chat_status !== 'deleted' && <button type="button" onClick={() => void performAction('delete_chat', selected)} className="ml-auto inline-flex items-center gap-1.5 border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50" title="Delete this chat for both accounts"><Trash2 className="h-4 w-4" /><span className="hidden sm:inline">Delete chat</span></button>}
                  </div>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
                    {selectedMessages.map((message) => (
                      <div key={message.id} className={`flex ${message.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.sender_role === 'admin' ? 'rounded-br-sm bg-[#17645c] text-white' : 'rounded-bl-sm border border-[#e5ebe6] bg-white text-[#17312e]'}`}><div className="whitespace-pre-wrap break-words">{message.message}</div><div className={`mt-1.5 text-[10px] ${message.sender_role === 'admin' ? 'text-white/70' : 'text-[#66736f]'}`}>{message.sender_name}</div></div></div>
                    ))}
                    {selectedMessages.length === 0 && <div className="flex h-full min-h-40 items-center justify-center text-center text-xs text-[#87938c]">{selected.chat_status === 'deleted' ? 'This conversation was deleted for both accounts.' : 'No messages for this request yet.'}</div>}
                  </div>
                  {selected.chat_status === 'open' ? (
                    <form onSubmit={sendMessage} className="flex shrink-0 gap-2 border-t border-[#dfe6e1] bg-white p-2.5 sm:p-4"><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} maxLength={2000} placeholder="Write a message to the patient..." className="h-11 min-w-0 flex-1 border border-[#d9e1dc] px-3 text-sm outline-none focus:border-[#17645c] sm:px-4" /><button type="submit" disabled={!chatInput.trim()} aria-label="Send message" className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#17645c] text-white hover:bg-[#104f49] disabled:opacity-50"><Send className="h-4 w-4" /></button></form>
                  ) : <div className="border-t border-[#dfe6e1] bg-white px-5 py-4 text-center text-xs text-[#66736f]">{selected.chat_status === 'deleted' ? 'This conversation has been deleted and cannot be reopened.' : 'This conversation is closed. Open patient chat to reply.'}</div>}
                </div>
              </div>
            )}
          </section>
        </section>
        )}
        </div>
      </div>
      {error && <div role="alert" className="fixed bottom-4 left-3 right-3 z-50 mx-auto w-fit max-w-lg border border-rose-200 bg-white px-4 py-3 text-sm text-rose-800 shadow-lg sm:left-1/2 sm:right-auto sm:-translate-x-1/2">{error}</div>}
    </main>
  );
};
