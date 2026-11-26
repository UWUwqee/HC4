import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/react';
import { useHealthCenter } from '../context/HealthCenterContext';
import { AlertCircle, CalendarDays, CheckCircle2, X } from 'lucide-react';
import { COVERAGE_AREAS, DELFIN_SALONGA_SERVICES } from '../data/delfinSalongaClinicInfo';
import {
  APPOINTMENT_TIME_SLOTS,
  formatAppointmentTime,
  getAppointmentTimePeriod,
  getEarliestAppointmentDate,
  isAppointmentTimeAvailable,
} from '../appointmentSchedule';

interface AppointmentReceipt {
  referenceCode: string;
  status: 'pending' | 'confirmed';
  createdAt: string;
}

interface PublicSlotSetting {
  date: string;
  time: string;
  blocked: boolean;
}

interface PendingAppointmentRequest {
  referenceCode: string;
  preferredDate: string;
  preferredTime: string;
  status: 'pending' | 'confirmed';
}

interface UnavailableAppointmentSlot {
  date: string;
  time: string;
  hasRegularBooking: boolean;
  hasPriorityBooking: boolean;
}

function appointmentServiceLabel(service: { id: string; title: string; titleFil: string }, isFilipino: boolean) {
  return isFilipino ? service.titleFil : service.title;
}

const priorityOptions = [
  { value: 'pwd', label: 'Person with disability (PWD)', labelFil: 'Taong may kapansanan (PWD)' },
  { value: 'senior_citizen', label: 'Senior citizen (60+)', labelFil: 'Senior citizen (60 pataas)' },
  { value: 'pregnant_lactating', label: 'Pregnant or lactating', labelFil: 'Buntis o nagpapasuso' },
] as const;

export const OutreachBookingModal: React.FC = () => {
  const { getToken } = useAuth();
  const {
    t,
    language,
    bookingModalOpen,
    setBookingModalOpen,
    markAppointmentRequestStatus,
    selectedProgramForBooking,
    siteContent,
  } = useHealthCenter();
  const services = siteContent.services;
  const isFilipino = language === 'fil';
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const formRef = useRef<HTMLFormElement>(null);
  const [serviceId, setServiceId] = useState('checkup');
  const selectedService = services.find((service) => service.id === serviceId);
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zone, setZone] = useState(COVERAGE_AREAS[0]);
  const [address, setAddress] = useState('');
  const [healthConcern, setHealthConcern] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [priorityCategories, setPriorityCategories] = useState<string[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [preferredDate, setPreferredDate] = useState(() => getEarliestAppointmentDate());
  const [preferredTime, setPreferredTime] = useState('09:00');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [attendanceConsent, setAttendanceConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const [receipt, setReceipt] = useState<AppointmentReceipt | null>(null);
  const [slotSettings, setSlotSettings] = useState<PublicSlotSetting[]>([]);
  const [unavailableSlots, setUnavailableSlots] = useState<UnavailableAppointmentSlot[]>([]);
  const [pendingRequest, setPendingRequest] = useState<PendingAppointmentRequest | null>(null);
  const [pendingRequestLoaded, setPendingRequestLoaded] = useState(false);
  const earliestDate = getEarliestAppointmentDate(now);
  const dateBlocked = slotSettings.some((setting) => setting.date === preferredDate && setting.time === 'all_day' && setting.blocked);
  const isTimeBlocked = (time: string) => {
    const period = getAppointmentTimePeriod(time);
    return slotSettings.some((setting) => setting.date === preferredDate
      && setting.blocked
      && (setting.time === time || setting.time === period));
  };
  const isTimeTaken = (time: string) => unavailableSlots.some((slot) => (
    slot.date === preferredDate
    && slot.time === time
    && (priorityCategories.length > 0
      ? slot.hasPriorityBooking
      : slot.hasRegularBooking || slot.hasPriorityBooking)
  ));
  const slotUnavailable = dateBlocked
    || isTimeBlocked(preferredTime)
    || isTimeTaken(preferredTime)
    || !isAppointmentTimeAvailable(preferredDate, preferredTime, now);
  const priorityReason = priorityCategories
    .map((category) => priorityOptions.find((option) => option.value === category)?.[isFilipino ? 'labelFil' : 'label'])
    .filter(Boolean)
    .join(', ');

  useEffect(() => {
    if (selectedProgramForBooking && services.some((service) => service.id === selectedProgramForBooking)) {
      setServiceId(selectedProgramForBooking);
    }
  }, [selectedProgramForBooking, services]);

  useEffect(() => {
    if (services.length > 0 && !services.some((service) => service.id === serviceId)) {
      setServiceId(services[0].id);
    }
  }, [services, serviceId]);

  useEffect(() => {
    if (!bookingModalOpen) return;
    const timer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, [bookingModalOpen]);

  useEffect(() => {
    setPreferredDate((current) => current < earliestDate ? earliestDate : current);
  }, [earliestDate]);

  useEffect(() => {
    const isMaternityService = selectedService?.category === 'maternity';
    setPriorityCategories((current) => {
      const next = current.filter((category) => (
        category !== 'senior_citizen' && category !== 'pregnant_lactating'
      ));
      if (Number(patientAge) >= 60) next.push('senior_citizen');
      if (isMaternityService) next.push('pregnant_lactating');
      return next.sort();
    });
  }, [patientAge, selectedService?.category]);

  useEffect(() => {
    if (!dateBlocked
      && isAppointmentTimeAvailable(preferredDate, preferredTime, now)
      && !isTimeBlocked(preferredTime)
      && !isTimeTaken(preferredTime)) return;
    const nextAvailableTime = APPOINTMENT_TIME_SLOTS.find((time) => (
      !dateBlocked
      && isAppointmentTimeAvailable(preferredDate, time, now)
      && !isTimeBlocked(time)
      && !isTimeTaken(time)
    ));
    if (nextAvailableTime) setPreferredTime(nextAvailableTime);
  }, [dateBlocked, preferredDate, preferredTime, now, slotSettings, unavailableSlots, priorityCategories]);

  useEffect(() => {
    if (!bookingModalOpen) {
      setFormStep(1);
      setReceipt(null);
      setError('');
      setPatientName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setHealthConcern('');
      setPatientAge('');
      setPriorityCategories([]);
      setPrivacyConsent(false);
      setAttendanceConsent(false);
    }
  }, [bookingModalOpen]);

  useEffect(() => {
    if (!bookingModalOpen) {
      setPendingRequestLoaded(false);
      return;
    }
    let active = true;
    const loadAvailability = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('Your Clerk sign-in session could not be verified.');
        const response = await fetch('/api/appointments', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const result = await response.json() as {
          slotSettings?: PublicSlotSetting[];
          unavailableSlots?: UnavailableAppointmentSlot[];
          appointments?: Array<{ reference_code: string; preferred_date: string; preferred_time: string; status: string }>;
          error?: string;
        };
        if (!response.ok || !Array.isArray(result.slotSettings) || !Array.isArray(result.unavailableSlots)) {
          throw new Error(result.error || 'Appointment availability could not be loaded.');
        }
        if (active) {
          setSlotSettings(result.slotSettings);
          setUnavailableSlots(result.unavailableSlots);
          const activeAppointment = result.appointments?.find((appointment) => ['pending', 'confirmed'].includes(appointment.status.toLowerCase()));
          const status = activeAppointment?.status.toLowerCase() === 'confirmed' ? 'confirmed' : 'pending';
          setPendingRequest(activeAppointment ? {
            referenceCode: activeAppointment.reference_code,
            preferredDate: activeAppointment.preferred_date,
            preferredTime: activeAppointment.preferred_time,
            status,
          } : null);
          if (activeAppointment) markAppointmentRequestStatus(status);
          setPendingRequestLoaded(true);
          setAvailabilityError('');
        }
      } catch (caught) {
        if (active) {
          setAvailabilityError(caught instanceof Error ? caught.message : 'Appointment availability could not be loaded.');
          setPendingRequestLoaded(false);
        }
      }
    };
    void loadAvailability();
    const timer = window.setInterval(() => void loadAvailability(), 10_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [bookingModalOpen, getToken, markAppointmentRequestStatus]);

  if (!bookingModalOpen) return null;

  const handleClose = () => setBookingModalOpen(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!pendingRequestLoaded) {
      setError(isFilipino ? 'Sinusuri muna kung may nakabinbing request. Subukan muli sandali.' : 'Checking for a pending request. Please try again in a moment.');
      return;
    }
    if (pendingRequest) return;
    if (!selectedService) {
      setError(isFilipino ? 'Walang available na serbisyo para sa appointment request.' : 'No services are currently available for appointment requests.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 7) {
      setError(isFilipino ? 'Maglagay ng wastong contact number na may hindi bababa sa 7 digit.' : 'Enter a valid contact number with at least 7 digits.');
      return;
    }
    if (slotUnavailable) {
      setError(isFilipino ? 'Hindi available ang napiling petsa o oras. Pumili ng ibang schedule.' : 'The selected date or time is unavailable. Please choose another schedule.');
      return;
    }
    setSubmitting(true);

    try {
      const token = await getToken();
      if (!token) throw new Error('Your Clerk sign-in session could not be verified.');
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patientName,
          phone,
          email,
          zone,
          address,
          healthConcern,
          age: Number(patientAge),
          priorityCategories,
          serviceId,
          preferredDate,
          preferredTime,
          privacyConsent,
          attendanceConsent,
        }),
      });
      const responseBody = await response.text();
      let result: AppointmentReceipt & {
        error?: string;
        activeAppointment?: PendingAppointmentRequest;
      };
      try {
        result = JSON.parse(responseBody) as AppointmentReceipt & { error?: string; activeAppointment?: PendingAppointmentRequest };
      } catch {
        throw new Error(isFilipino
          ? 'Pansamantalang hindi magamit ang serbisyo ng appointment. Subukan muli mamaya.'
          : `Appointment service is temporarily unavailable (HTTP ${response.status}). Please try again later.`);
      }
      if (!response.ok) {
        if (response.status === 409 && result.activeAppointment) {
          setPendingRequest(result.activeAppointment);
          setPendingRequestLoaded(true);
          markAppointmentRequestStatus(result.activeAppointment.status);
        }
        const message = response.status === 401
          ? 'Your sign-in could not be verified by Clerk. Check the Clerk configuration in Vercel, then redeploy.'
          : result.error || 'Could not submit your appointment request.';
        throw new Error(message);
      }
      setPendingRequest({
        referenceCode: result.referenceCode,
        preferredDate,
        preferredTime,
        status: result.status,
      });
      markAppointmentRequestStatus(result.status);
      setReceipt(result);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not submit your appointment request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueToSchedule = () => {
    if (!formRef.current?.reportValidity()) return;
    if (!selectedService) {
      setError(isFilipino ? 'Walang available na serbisyo para sa appointment request.' : 'No services are currently available for appointment requests.');
      return;
    }
    setError('');
    setFormStep(2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) handleClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="appointment-title" className="my-0 max-h-[calc(100dvh-1rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-2xl overflow-y-auto bg-white shadow-2xl sm:my-5 sm:max-h-[92vh]">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:gap-5 sm:px-7 sm:py-5">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-800">Delfin Salonga Health Center</div>
            <h2 id="appointment-title" className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">{receipt ? (receipt.status === 'confirmed' ? (isFilipino ? 'Kumpirmado ang appointment' : 'Appointment confirmed') : (isFilipino ? 'Natanggap ang request' : 'Request received')) : (isFilipino ? 'Online appointment request' : 'REQUEST AN APPOINTMENT')}</h2>
            {!receipt && <p className="mt-1 text-sm text-slate-600">{isFilipino ? 'Pumili ng 30-minutong schedule. Awtomatikong kinukumpirma ang mga available na oras.' : 'Choose a 30-minute schedule. Available time slots are confirmed automatically.'}</p>}
          </div>
          <button onClick={handleClose} aria-label="Close appointment form" className="flex h-11 w-11 shrink-0 items-center justify-center text-slate-500 hover:text-slate-900"><X className="w-5 h-5" /></button>
        </header>

        {receipt ? (
          <div className="px-5 sm:px-7 py-8" aria-live="polite">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-7 h-7 text-teal-800 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-slate-950">{receipt.status === 'confirmed'
                  ? (isFilipino ? 'Awtomatikong nakumpirma ang iyong appointment.' : 'Your appointment was automatically confirmed.')
                  : (isFilipino ? 'Nakatala ang iyong appointment request.' : 'Your appointment request is recorded.')}</h3>
                <p className="mt-2 text-sm text-slate-600">{receipt.status === 'confirmed'
                  ? (isFilipino ? 'Makikita ang kumpirmasyon sa iyong appointment chat.' : 'The confirmation is available in your appointment chat.')
                  : (isFilipino ? 'Naghihintay ito ng pagsusuri ng kawani.' : 'It is waiting for staff review.')}</p>
                <p className="mt-4 text-sm text-slate-700">{selectedService && appointmentServiceLabel(selectedService, isFilipino)}</p>
                <p className="mt-1 text-sm text-slate-600">{preferredDate} · {formatAppointmentTime(preferredTime)} · {zone}</p>
                <p className="mt-4 text-xs text-slate-500">{isFilipino ? 'Reference number' : 'Request reference'}: <strong className="font-mono text-slate-900">{receipt.referenceCode}</strong></p>
                <button onClick={handleClose} className="mt-6 px-4 py-2.5 bg-teal-900 text-white text-sm font-bold rounded-md hover:bg-teal-950">{isFilipino ? 'Isara' : 'Done'}</button>
              </div>
            </div>
          </div>
        ) : pendingRequest ? (
          <div className="space-y-4 px-4 py-6 sm:px-7 sm:py-8" role="status" aria-live="polite">
            <div className="border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <h3 className="text-base font-bold">{pendingRequest.status === 'confirmed'
                ? (isFilipino ? 'May aktibo ka pang kumpirmadong appointment' : 'You already have an active confirmed appointment')
                : (isFilipino ? 'May request ka pang sinusuri' : 'You already have a request under review')}</h3>
              <p className="mt-2 text-sm leading-relaxed">
                {pendingRequest.status === 'confirmed'
                  ? (isFilipino
                    ? 'Kumpletuhin o kanselahin muna ang appointment na ito bago magpadala ng panibagong request.'
                    : 'Complete or cancel this appointment before submitting another request.')
                  : (isFilipino
                    ? 'Maghintay ng aksyon ng clinic staff bago magpadala ng panibagong appointment request.'
                    : 'Please wait for clinic staff to review this request before sending another appointment request.')}
              </p>
            </div>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-semibold text-slate-500">{isFilipino ? 'Reference number' : 'Request reference'}</dt><dd className="break-all font-mono font-bold text-slate-900">{pendingRequest.referenceCode}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-500">{isFilipino ? 'Petsa at oras' : 'Appointment schedule'}</dt><dd className="font-semibold text-slate-900">{pendingRequest.preferredDate} · {formatAppointmentTime(pendingRequest.preferredTime)}</dd></div>
            </dl>
            <p className="text-xs text-slate-500">{isFilipino ? 'Awtomatikong susuriin muli ang status habang bukas ang pahinang ito.' : 'This page will automatically check again while it is open.'}</p>
          </div>
        ) : !pendingRequestLoaded ? (
          <p className="px-4 py-8 text-center text-sm text-slate-600 sm:px-7" role="status">
            {availabilityError || (isFilipino
              ? 'Sinusuri ang mga nakabinbing appointment request...'
              : 'Checking for pending appointment requests...')}
          </p>
        ) : (
          <form
            ref={formRef}
            onSubmit={(event) => {
              if (formStep === 1) {
                event.preventDefault();
                handleContinueToSchedule();
              } else {
                void handleSubmit(event);
              }
            }}
            className="space-y-5 px-4 py-5 sm:px-7 sm:py-6"
          >
            <div aria-label={isFilipino ? 'Hakbang sa appointment' : 'Appointment request steps'} className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>{isFilipino ? `Hakbang ${formStep} ng 2` : `Step ${formStep} of 2`}</span>
                <span>{formStep === 1
                  ? (isFilipino ? 'Iyong detalye' : 'Your details')
                  : 'Schedule'}</span>
              </div>
              <div role="progressbar" aria-valuemin={1} aria-valuemax={2} aria-valuenow={formStep} aria-label={isFilipino ? 'Pag-usad ng form' : 'Form progress'} className="h-1.5 overflow-hidden bg-slate-100">
                <div className={`h-full bg-teal-800 transition-all ${formStep === 1 ? 'w-1/2' : 'w-full'}`} />
              </div>
            </div>

            {formStep === 1 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="appointment-service" className="block text-sm font-semibold text-slate-800 mb-1.5">{isFilipino ? 'Serbisyo' : 'Service'}</label>
                <select id="appointment-service" required value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700">
                  {services.map((service) => <option key={service.id} value={service.id}>{appointmentServiceLabel(service, isFilipino)}</option>)}
                </select>
                {services.length === 0 && <p role="status" className="mt-2 text-xs text-amber-800">{isFilipino ? 'Walang kasalukuyang nailathalang serbisyo para sa appointment request.' : 'There are no published services available for appointment requests.'}</p>}
              </div>
              <div>
                <label htmlFor="appointment-name" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formFullName} *</label>
                <input id="appointment-name" required minLength={2} maxLength={120} autoComplete="name" value={patientName} onChange={(event) => setPatientName(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700" />
              </div>
              <div>
                <label htmlFor="appointment-phone" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formPhone} *</label>
                <input id="appointment-phone" required type="tel" inputMode="tel" autoComplete="tel" minLength={7} maxLength={32} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="09XX XXX XXXX" className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700" />
              </div>
              <div>
                <label htmlFor="appointment-email" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formEmail}</label>
                <input id="appointment-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700" />
              </div>
              <div>
                <label htmlFor="appointment-address" className="block text-sm font-semibold text-slate-800 mb-1.5">{isFilipino ? 'Tirahan' : 'Street address'} *</label>
                <input id="appointment-address" required minLength={5} maxLength={250} autoComplete="street-address" value={address} onChange={(event) => setAddress(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700" />
              </div>
              <div>
                <label htmlFor="appointment-zone" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formZone} *</label>
                <select id="appointment-zone" required value={zone} onChange={(event) => setZone(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700">
                  {COVERAGE_AREAS.map((area) => <option key={area} value={area}>{area}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="appointment-age" className="block text-sm font-semibold text-slate-800 mb-1.5">{isFilipino ? 'Edad' : 'Age'} *</label>
                <input id="appointment-age" required type="number" min={0} max={120} step={1} inputMode="numeric" value={patientAge} onChange={(event) => setPatientAge(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700" />
              </div>
              <fieldset className="sm:col-span-2 rounded-md border border-slate-300 p-3">
                <legend className="px-1 text-sm font-semibold text-slate-800">{isFilipino ? 'Priority category (opsyonal; piliin lahat ng naaangkop)' : 'Priority category (optional; select all that apply)'}</legend>
                <div className="grid gap-2 sm:grid-cols-3">
                  {priorityOptions.map((option) => {
                    const automatic = (option.value === 'senior_citizen' && Number(patientAge) >= 60)
                      || (option.value === 'pregnant_lactating' && selectedService?.category === 'maternity');
                    return (
                      <label key={option.value} className="flex min-h-11 items-start gap-2 border border-slate-200 px-3 py-2 text-xs leading-relaxed text-slate-700">
                        <input
                          type="checkbox"
                          checked={priorityCategories.includes(option.value)}
                          disabled={automatic}
                          onChange={(event) => setPriorityCategories((current) => event.target.checked
                            ? [...new Set([...current, option.value])]
                            : current.filter((category) => category !== option.value))}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-teal-800"
                        />
                        <span>{isFilipino ? option.labelFil : option.label}{automatic && <span className="block text-[10px] text-teal-800">{isFilipino ? 'Awtomatikong pinili' : 'Automatically selected'}</span>}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div className="sm:col-span-2">
                <label htmlFor="appointment-concern" className="block text-sm font-semibold text-slate-800 mb-1.5">{isFilipino ? 'Pangunahing reklamo o dahilan ng pagbisita' : 'Health Concern:'} *</label>
                <textarea id="appointment-concern" required minLength={2} maxLength={2000} rows={4} value={healthConcern} onChange={(event) => setHealthConcern(event.target.value)} className="w-full resize-y border border-slate-300 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700" />
                <p className="mt-1 text-xs text-slate-500">{isFilipino ? 'Ibahagi lamang ang impormasyong kailangan upang maihanda ang iyong pagbisita.' : 'Share only information needed to arrange your visit.'}</p>
              </div>
              {priorityReason && (
                <p className="sm:col-span-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  {isFilipino
                    ? `Awtomatikong ilalagay ang appointment sa priority schedule batay sa ${priorityReason}.`
                    : `This appointment will be included in the priority schedule based on ${priorityReason}.`}
                </p>
              )}
              <label className="sm:col-span-2 flex items-start gap-3 border border-amber-300 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950">
                <input type="checkbox" required checked={attendanceConsent} onChange={(event) => setAttendanceConsent(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-teal-800" />
                <span><strong className="font-bold">{isFilipino ? 'Mahalagang paalala: ' : 'Important reminder: '}</strong>{isFilipino ? 'Nauunawaan kong makakansela ang appointment ko kapag hindi ako dumating sa takdang oras, at kailangan kong magsumite muli ng request.' : 'I understand that missing my appointment will cancel it, and I’ll need to submit a new request.'}</span>
              </label>
              <div className="sm:col-span-2">
                <button type="button" onClick={handleContinueToSchedule} disabled={!attendanceConsent || !selectedService} className="mt-1 min-h-12 w-full rounded-sm bg-[#0f4d3c] px-4 py-3 text-base font-bold text-white hover:bg-[#2c7a5f] disabled:cursor-not-allowed disabled:opacity-60">
                  {isFilipino ? 'Magpatuloy sa schedule' : 'Continue to schedule'}
                </button>
              </div>
            </div>
            ) : (
            <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="appointment-date" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formDate} *</label>
                <input id="appointment-date" required type="date" min={earliestDate} value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700" />
              </div>
              <div>
                <label htmlFor="appointment-time" className="block text-sm font-semibold text-slate-800 mb-1.5">{t.formTimeSlot} *</label>
                <select id="appointment-time" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} className="w-full px-3.5 py-3 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-700">
                  {APPOINTMENT_TIME_SLOTS.map((time) => {
                    const unavailable = dateBlocked
                      || !isAppointmentTimeAvailable(preferredDate, time, now)
                      || isTimeBlocked(time)
                      || isTimeTaken(time);
                    return (
                      <option key={time} value={time} disabled={unavailable}>
                        {formatAppointmentTime(time)}{unavailable ? (isFilipino ? ' — Hindi available' : ' — Unavailable') : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {slotUnavailable && <p role="status" className="text-sm font-semibold text-rose-800">{dateBlocked || isTimeBlocked(preferredTime)
              ? (isFilipino ? 'Sarado ang napiling petsa o oras. Pumili ng ibang schedule.' : 'The selected date or time is blocked. Choose a different schedule.')
              : isTimeTaken(preferredTime)
                ? (isFilipino ? 'May naka-book na sa oras na ito. Pumili ng ibang schedule.' : 'This time is already booked. Choose another slot.')
                : (isFilipino ? 'Lumipas na ang oras na ito. Pumili ng ibang schedule.' : 'This time has passed. Choose another slot.')}</p>}
            {availabilityError && <p role="status" className="text-xs text-amber-800">{isFilipino ? 'Hindi ma-check ang availability. Susuriin muli ang napiling schedule kapag ipinadala.' : 'Availability could not be checked. The server will verify your selected schedule when you submit.'}</p>}

            <label className="flex items-start gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600">
              <input type="checkbox" required checked={privacyConsent} onChange={(event) => setPrivacyConsent(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-teal-800" />
              <span>{isFilipino ? 'Pumapayag akong gamitin ng kawani ng health center ang aking personal at pangkalusugang impormasyon, kabilang ang detalye ng appointment at pangunahing dahilan ng pagbisita, upang suriin at tugunan ang request na ito.' : 'I agree that health center staff may use my personal and health information, including appointment details and health concern, to review and respond to this request.'}</span>
            </label>
            </>
            )}

            {error && <p role="alert" className="flex items-start gap-2 text-sm text-rose-800"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</p>}

            {formStep === 2 && (
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setError(''); setFormStep(1); }} className="min-h-11 flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:flex-none">{isFilipino ? 'Bumalik' : 'Back'}</button>
                  <button type="button" onClick={handleClose} className="min-h-11 flex-1 rounded-md px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:flex-none">{isFilipino ? 'Kanselahin' : 'Cancel'}</button>
                </div>
                <button type="submit" disabled={submitting || slotUnavailable || !selectedService || !privacyConsent || !attendanceConsent} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-[#0f4d3c] px-5 py-2.5 text-base font-bold text-white hover:bg-[#2c7a5f] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"><CalendarDays className="h-4 w-4" />{submitting ? (isFilipino ? 'Ipinapadala...' : 'Sending...') : (isFilipino ? 'Ipadala ang request' : 'Send request')}</button>
              </div>
            )}
          </form>
        )}
      </section>
    </div>
  );
};
