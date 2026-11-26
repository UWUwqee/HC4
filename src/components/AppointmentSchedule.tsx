import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock3, MapPin } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { CLINIC_ADDRESS } from '../data/delfinSalongaClinicInfo';
import { BackToHomeButton } from './BackToHomeButton';
import { formatAppointmentTime, getAppointmentTimeMinutes } from '../appointmentSchedule';

interface ScheduleSlot {
  date: string;
  time: string;
  category: 'regular' | 'priority';
  bookedCount: number;
  services: Array<{ id: string; name: string }>;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date(`${value}T12:00:00+08:00`));
}

export const AppointmentSchedule: React.FC = () => {
  const { language, siteContent } = useHealthCenter();
  const isFilipino = language === 'fil';
  const settings = siteContent.settings;
  const clinicAddress = (isFilipino ? settings.clinicAddressFil : settings.clinicAddress) || CLINIC_ADDRESS;
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const loadSchedule = () => {
      const controller = new AbortController();
      void fetch('/api/appointments', { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error('Schedule unavailable');
          return response.json() as Promise<{ slots: ScheduleSlot[] }>;
        })
        .then((data) => {
          setSlots(data.slots);
          setError('');
        })
        .catch((caught) => {
          if (caught instanceof DOMException && caught.name === 'AbortError') return;
          setError(isFilipino ? 'Hindi ma-load ang iskedyul.' : 'Schedule could not be loaded.');
        })
        .finally(() => setLoading(false));
      return controller;
    };
    let controller = loadSchedule();
    const timer = window.setInterval(() => {
      controller.abort();
      controller = loadSchedule();
    }, 15_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [isFilipino]);

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const visibleSlots = slots.filter((slot) => slot.date >= today
    && (!dateFilter || slot.date === dateFilter))
    .slice()
    .sort((first, second) => first.date.localeCompare(second.date)
      || (getAppointmentTimeMinutes(first.time) ?? 24 * 60) - (getAppointmentTimeMinutes(second.time) ?? 24 * 60));
  const categoryPanel = (category: ScheduleSlot['category']) => {
    const isPriority = category === 'priority';
    const categorySlots = visibleSlots.filter((slot) => slot.category === category);
    const heading = isPriority
      ? (isFilipino ? 'Mga priority appointment' : 'Priority Appointments')
      : (isFilipino ? 'Mga regular na appointment' : 'Regular Appointments');

    return (
      <section
        key={category}
        aria-labelledby={`${category}-schedule-title`}
        className={`flex min-h-[300px] flex-col overflow-hidden rounded-xl border-2 shadow-lg ${
          isPriority
            ? 'border-amber-400 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-amber-100/70'
            : 'border-[#dce7e1] bg-white shadow-sm'
        }`}
      >
        <header className={`border-b px-6 py-6 sm:px-7 ${
          isPriority ? 'border-amber-200 bg-amber-100/80' : 'border-[#dce7e1] bg-[#f2f7f4]'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white ${
              isPriority ? 'bg-amber-500 shadow-md shadow-amber-200' : 'bg-[#17645c]'
            }`}>
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h3 id={`${category}-schedule-title`} className={`text-2xl font-bold tracking-tight ${
                isPriority ? 'text-amber-950' : 'text-[#0f4d3c]'
              }`}>{heading}</h3>
              <p className={`mt-1 text-sm font-medium ${
                isPriority ? 'text-amber-900/80' : 'text-[#66736f]'
              }`}>
                {isPriority
                  ? (isFilipino ? 'Prayoridad na oras ng appointment' : 'Priority appointment times')
                  : (isFilipino ? 'Iba pang kumpirmadong appointment' : 'Other confirmed appointments')}
              </p>
            </div>
          </div>
        </header>
        <div className="grid flex-1 content-start gap-4 p-5 sm:p-6">
          {categorySlots.map((slot) => (
            <article
              key={`${category}-${slot.date}-${slot.time}`}
              className={`rounded-lg border bg-white p-5 ${
                isPriority ? 'border-amber-200 shadow-sm' : 'border-[#dce7e1]'
              }`}
            >
              <p className={`text-[11px] font-bold uppercase tracking-wide ${
                isPriority ? 'text-amber-800' : 'text-[#2c7a5f]'
              }`}>{dateLabel(slot.date)}</p>
              <p className={`mt-1 text-xs ${isPriority ? 'text-amber-700' : 'text-[#66736f]'}`}>{slot.date}</p>
              <div className={`mt-3 flex items-center gap-2 border-t pt-3 ${
                isPriority ? 'border-amber-100' : 'border-[#e7eee9]'
              }`}>
                <Clock3 className={`h-5 w-5 shrink-0 ${isPriority ? 'text-amber-600' : 'text-[#2c7a5f]'}`} />
                <span className={`text-base font-bold ${isPriority ? 'text-amber-950' : 'text-[#0f4d3c]'}`}>
                  {formatAppointmentTime(slot.time)}
                </span>
              </div>
              <div className={`mt-4 space-y-3 rounded-lg border p-3 ${
                isPriority ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'
              }`}>
                <p className={`text-xs font-bold uppercase tracking-wide ${
                  isPriority ? 'text-amber-900' : 'text-[#124d45]'
                }`}>
                  {isFilipino ? 'Mga serbisyo at itinalagang pangkat' : 'Services and care team'}
                </p>
                {slot.services.map((service) => {
                  const serviceDetails = siteContent.services.find((item) => item.id === service.id);
                  const careTeam = serviceDetails?.keyPersonnel ?? [];
                  return (
                    <div key={service.id} className={`border-t pt-2 ${
                      isPriority ? 'border-amber-200' : 'border-emerald-200'
                    }`}>
                      <p className={`text-sm font-bold ${isPriority ? 'text-amber-950' : 'text-[#124d45]'}`}>
                        {isFilipino && serviceDetails?.titleFil ? serviceDetails.titleFil : service.name}
                      </p>
                      <p className={`mt-1 text-xs leading-relaxed ${
                        isPriority ? 'text-amber-900' : 'text-[#315d53]'
                      }`}>
                        <span className="font-semibold">{isFilipino ? 'Pangkat:' : 'Care team:'}</span>{' '}
                        {careTeam.length > 0
                          ? careTeam.join(', ')
                          : (isFilipino ? 'Makipag-ugnayan sa health center para sa pagtatalaga.' : 'Contact the health center for the team assignment.')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
          {!loading && categorySlots.length === 0 && (
            <p className={`flex min-h-[120px] items-center justify-center rounded-lg border border-dashed px-5 py-10 text-center text-base ${
              isPriority
                ? 'border-amber-300 bg-white/70 text-amber-900'
                : 'border-[#cbd8d0] bg-[#f8faf9] text-[#66736f]'
            }`}>
              {error
                ? (isFilipino ? 'Hindi maipakita ang mga appointment.' : 'Appointments are unavailable.')
                : isPriority
                  ? (isFilipino ? 'Wala pang kumpirmadong priority appointment.' : 'No confirmed priority appointments yet.')
                  : (isFilipino ? 'Wala pang kumpirmadong regular na appointment.' : 'No confirmed regular appointments yet.')}
            </p>
          )}
        </div>
      </section>
    );
  };

  return (
    <section id="appointment-schedule" className="site-section-bg section-enter border-b border-[#dce7e1] py-8 sm:py-10">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <BackToHomeButton />
        <div className="breadcrumb">Home <span aria-hidden="true">/</span> <span className="font-semibold text-[#0f4d3c]">Schedule</span></div>
        <div className="mb-7">
          <div>
            <h2 className="text-2xl font-bold uppercase text-[#0f4d3c] sm:text-3xl">
              {isFilipino ? 'MGA NAKATAKDANG APPOINTMENT' : 'UPCOMING APPOINTMENTS'}
            </h2>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-end gap-3">
          <label htmlFor="schedule-date-filter" className="text-sm font-semibold text-[#52635b]">
            {isFilipino ? 'I-filter ayon sa petsa' : 'Filter by date'}
            <input
              id="schedule-date-filter"
              type="date"
              min={today}
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="mt-1 block min-h-11 border border-[#d9e1dc] bg-white px-3 text-sm text-[#17312e]"
            />
          </label>
          {dateFilter && (
            <button type="button" onClick={() => setDateFilter('')} className="min-h-11 px-3 text-sm font-semibold text-[#17645c] hover:bg-[#eaf3ee]">
              {isFilipino ? 'Ipakita lahat ng petsa' : 'Show all dates'}
            </button>
          )}
        </div>

        {loading && <p role="status" className="border-y border-[#dce7e1] py-5 text-sm text-[#6b7280]">{isFilipino ? 'Nilo-load ang mga kumpirmadong appointment...' : 'Loading accepted appointments...'}</p>}
        {error && <p role="alert" className="border-y border-[#dce7e1] py-5 text-sm text-rose-800">{error}</p>}

        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          {categoryPanel('priority')}
          {categoryPanel('regular')}
        </div>

        <div className="mt-6 grid gap-4 border-t border-[#dce7e1] pt-5 text-sm text-[#52635b] sm:grid-cols-2">
          <p className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7a5f]" /><span><strong className="text-[#0f4d3c]">{isFilipino ? 'Oras ng klinika: ' : 'Clinic hours: '}</strong>{isFilipino ? settings.clinicHoursFil : settings.clinicHours}</span></p>
          <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2c7a5f]" /><span><strong className="text-[#0f4d3c]">{isFilipino ? 'Lokasyon: ' : 'Location: '}</strong>{clinicAddress}</span></p>
        </div>
      </div>
    </section>
  );
};
