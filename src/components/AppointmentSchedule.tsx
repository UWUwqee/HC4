import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock3 } from 'lucide-react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { BackToHomeButton } from './BackToHomeButton';
import { formatAppointmentTime, getAppointmentTimeMinutes } from '../appointmentSchedule';

interface ScheduleSlot {
  date: string;
  time: string;
  bookedCount: number;
  services: ScheduleService[];
}

interface PriorityScheduleSlot {
  date: string;
  time: string;
  priorityCount: number;
  services: ScheduleService[];
}

interface ScheduleService {
  id: string;
  name: string;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(new Date(`${value}T12:00:00+08:00`));
}

export const AppointmentSchedule: React.FC = () => {
  const { language, siteContent } = useHealthCenter();
  const isFilipino = language === 'fil';
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [prioritySlots, setPrioritySlots] = useState<PriorityScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const loadSchedule = () => {
    const controller = new AbortController();
    void fetch('/api/appointments', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Schedule unavailable');
        return response.json() as Promise<{ slots: ScheduleSlot[]; prioritySlots?: PriorityScheduleSlot[] }>;
      })
      .then((data) => {
        setSlots(data.slots);
        setPrioritySlots(data.prioritySlots ?? []);
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
  const priorityCounts = new Map(prioritySlots.map((slot) => [`${slot.date}:${slot.time}`, slot.priorityCount]));
  const regularSlots = slots
    .filter((slot) => slot.date >= today && (!dateFilter || slot.date === dateFilter))
    .map((slot) => ({
      ...slot,
      regularCount: Math.max(0, slot.bookedCount - (priorityCounts.get(`${slot.date}:${slot.time}`) ?? 0)),
    }))
    .filter((slot) => slot.regularCount > 0)
    .sort((first, second) => first.date.localeCompare(second.date)
      || (getAppointmentTimeMinutes(first.time) ?? 1440) - (getAppointmentTimeMinutes(second.time) ?? 1440));
  const upcomingPrioritySlots = prioritySlots
    .filter((slot) => slot.date >= today && (!dateFilter || slot.date === dateFilter) && slot.priorityCount > 0)
    .sort((first, second) => first.date.localeCompare(second.date)
      || (getAppointmentTimeMinutes(first.time) ?? 1440) - (getAppointmentTimeMinutes(second.time) ?? 1440));

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

        {loading && <p className="border-y border-[#dce7e1] py-5 text-sm text-[#6b7280]">{isFilipino ? 'Nilo-load ang mga kumpirmadong appointment...' : 'Loading accepted appointments...'}</p>}
        {error && <p role="alert" className="border-y border-[#dce7e1] py-5 text-sm text-rose-800">{error}</p>}

        {!loading && !error && (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <section aria-labelledby="priority-schedule-title" className="overflow-hidden rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-lg shadow-amber-100/70">
              <header className="border-b border-amber-200 bg-amber-100/80 px-6 py-6 sm:px-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-md shadow-amber-200">
                    <CalendarDays className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 id="priority-schedule-title" className="text-2xl font-extrabold tracking-tight text-amber-950">
                      {isFilipino ? 'Mga priority appointment' : 'Priority Appointments'}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-amber-900/80">
                      {isFilipino ? 'Prayoridad na oras ng appointment' : 'Priority appointment times'}
                    </p>
                  </div>
                </div>
              </header>
              <div className="grid content-start gap-4 p-5 sm:p-6">
                {upcomingPrioritySlots.map((slot) => (
                  <article key={`${slot.date}-${slot.time}`} className="rounded-lg border border-amber-200 bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-amber-800">{dateLabel(slot.date)}</p>
                    <p className="mt-1 text-xs text-amber-700">{slot.date}</p>
                    <div className="mt-3 flex items-center gap-2 border-t border-amber-100 pt-3">
                      <Clock3 className="h-5 w-5 shrink-0 text-amber-600" />
                      <span className="text-base font-extrabold text-amber-950">{formatAppointmentTime(slot.time)}</span>
                    </div>
                    <div className="mt-4 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-900">
                        {isFilipino ? 'Mga serbisyo at itinalagang pangkat' : 'Services and care team'}
                      </p>
                      {slot.services.map((service) => {
                        const serviceDetails = siteContent.services.find((item) => item.id === service.id);
                        const careTeam = serviceDetails?.keyPersonnel ?? [];
                        return (
                          <div key={service.id} className="border-t border-amber-200 pt-2">
                            <p className="text-sm font-bold text-amber-950">
                              {isFilipino && serviceDetails?.titleFil ? serviceDetails.titleFil : service.name}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-amber-900">
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
                {upcomingPrioritySlots.length === 0 && (
                  <p className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-amber-300 bg-white/70 px-5 py-10 text-center text-base text-amber-900">
                    {isFilipino ? 'Wala pang kumpirmadong priority appointment.' : 'No confirmed priority appointments yet.'}
                  </p>
                )}
              </div>
            </section>

            <section aria-labelledby="regular-schedule-title" className="overflow-hidden rounded-xl border-2 border-[#dce7e1] bg-white shadow-sm">
              <header className="border-b border-[#dce7e1] bg-[#f2f7f4] px-6 py-6 sm:px-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#17645c] text-white">
                    <CalendarDays className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 id="regular-schedule-title" className="text-2xl font-bold text-[#0f4d3c]">
                      {isFilipino ? 'Mga regular na appointment' : 'Regular Appointments'}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-[#66736f]">
                      {isFilipino ? 'Iba pang kumpirmadong appointment' : 'Other confirmed appointments'}
                    </p>
                  </div>
                </div>
              </header>
              <div className="grid content-start gap-4 p-5 sm:p-6">
                {regularSlots.map((slot) => (
                  <article key={`${slot.date}-${slot.time}`} className="rounded-lg border border-[#dce7e1] bg-white p-5">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#2c7a5f]">{dateLabel(slot.date)}</p>
                    <p className="mt-1 text-xs text-[#66736f]">{slot.date}</p>
                    <div className="mt-3 flex items-center gap-2 border-t border-[#e7eee9] pt-3">
                      <Clock3 className="h-5 w-5 shrink-0 text-[#2c7a5f]" />
                      <span className="text-base font-bold text-[#0f4d3c]">{formatAppointmentTime(slot.time)}</span>
                    </div>
                    <div className="mt-4 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#124d45]">
                        {isFilipino ? 'Mga serbisyo at itinalagang pangkat' : 'Services and care team'}
                      </p>
                      {slot.services.map((service) => {
                        const serviceDetails = siteContent.services.find((item) => item.id === service.id);
                        const careTeam = serviceDetails?.keyPersonnel ?? [];
                        return (
                          <div key={service.id} className="border-t border-emerald-200 pt-2">
                            <p className="text-sm font-bold text-[#124d45]">
                              {isFilipino && serviceDetails?.titleFil ? serviceDetails.titleFil : service.name}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-[#315d53]">
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
                {regularSlots.length === 0 && (
                  <p className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-[#cbd8d0] bg-[#f8faf9] px-5 py-10 text-center text-base text-[#66736f]">
                    {isFilipino ? 'Wala pang kumpirmadong regular na appointment.' : 'No confirmed regular appointments yet.'}
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  );
};
