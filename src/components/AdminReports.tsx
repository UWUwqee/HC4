import React, { useMemo, useState } from 'react';
import { formatAppointmentTime, getAppointmentTimeMinutes } from '../appointmentSchedule';

interface ReportAppointment {
  reference_code: string;
  patient_name: string;
  phone: string;
  email: string;
  zone: string;
  address: string;
  health_concern: string;
  patient_age: number;
  service_name: string;
  preferred_date: string;
  preferred_time: string;
  priority_type: string;
  priority_reason: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

function csvCell(value: string) {
  const safeValue = /^[\s]*[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export const AdminReports: React.FC<{ appointments: ReportAppointment[] }> = ({ appointments }) => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [service, setService] = useState('all');

  const services = useMemo(() => [...new Set(appointments.map((item) => item.service_name))].sort(), [appointments]);
  const filtered = useMemo(() => appointments.filter((item) => (
    (!fromDate || item.preferred_date >= fromDate)
    && (!toDate || item.preferred_date <= toDate)
    && (service === 'all' || item.service_name === service)
  )).sort((first, second) =>
    first.preferred_date.localeCompare(second.preferred_date)
    || (getAppointmentTimeMinutes(first.preferred_time) ?? 24 * 60) - (getAppointmentTimeMinutes(second.preferred_time) ?? 24 * 60)
    || first.created_at.localeCompare(second.created_at)), [appointments, fromDate, toDate, service]);

  const exportCsv = () => {
    const columns: Array<keyof ReportAppointment> = [
      'reference_code', 'patient_name', 'phone', 'email', 'address', 'health_concern',
      'patient_age', 'zone', 'service_name', 'preferred_date', 'preferred_time',
      'priority_type', 'priority_reason', 'status', 'created_at', 'completed_at',
    ];
    const rows = [
      columns.map((column) => csvCell(column.replaceAll('_', ' '))).join(','),
      ...filtered.map((appointment) => columns.map((column) => csvCell(String(appointment[column] ?? ''))).join(',')),
    ];
    const blob = new Blob([`\uFEFF${rows.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `completed-appointment-records-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4">
      <div className="rounded-md border border-[#dce7e1] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-base font-bold">Completed appointment records</h2><p className="mt-1 text-xs text-[#66736f]">Review records by date and service. Only completed appointments can be included in the admin-only export.</p></div>
          <button type="button" onClick={exportCsv} disabled={filtered.length === 0} className="min-h-11 rounded-sm bg-[#0f4d3c] px-4 text-xs font-bold text-white hover:bg-[#2c7a5f] disabled:cursor-not-allowed disabled:opacity-50">Export completed records ({filtered.length})</button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-semibold text-[#66736f]">Appointment from<input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} className="mt-1 block min-h-11 w-full border border-[#d9e1dc] px-3 text-sm text-[#17312e]" /></label>
          <label className="text-xs font-semibold text-[#66736f]">Appointment to<input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} className="mt-1 block min-h-11 w-full border border-[#d9e1dc] px-3 text-sm text-[#17312e]" /></label>
          <label className="text-xs font-semibold text-[#66736f]">Service<select value={service} onChange={(event) => setService(event.target.value)} className="mt-1 block min-h-11 w-full border border-[#d9e1dc] bg-white px-3 text-sm text-[#17312e]"><option value="all">All services</option>{services.map((name) => <option key={name}>{name}</option>)}</select></label>
        </div>
      </div>

      <div aria-label="Filtered appointment summary" className="grid grid-cols-2 gap-2">
        {[
          ['Matching completed records', filtered.length],
          ['Services represented', new Set(filtered.map((item) => item.service_name)).size],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-md border border-[#dce7e1] bg-white p-3 shadow-sm sm:p-4"><div className="text-2xl font-bold">{value}</div><div className="mt-1 text-xs text-[#66736f]">{label}</div></div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border border-[#dce7e1] bg-white shadow-sm">
        <table className="w-full min-w-[860px] border-collapse text-left text-xs">
          <thead className="bg-[#f2f6f2] text-[10px] uppercase tracking-wide text-[#66736f]"><tr>{['Appointment date', 'Patient', 'Service', 'Status', 'Reference', 'Completed'].map((heading) => <th key={heading} className="px-3 py-3 font-bold">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#edf1ee]">
            {filtered.map((item) => <tr key={item.reference_code}><td className="px-3 py-3">{item.preferred_date} · {formatAppointmentTime(item.preferred_time)}</td><td className="px-3 py-3 font-semibold">{item.patient_name}</td><td className="px-3 py-3">{item.service_name}</td><td className="px-3 py-3 capitalize">{item.status}</td><td className="px-3 py-3 font-mono">{item.reference_code}</td><td className="px-3 py-3">{item.completed_at ? new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.completed_at)) : '—'}</td></tr>)}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-[#87938c]">No appointment records match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
};
