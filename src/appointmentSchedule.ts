const APPOINTMENT_START_MINUTES = 9 * 60;
const APPOINTMENT_END_MINUTES = 14 * 60;
const APPOINTMENT_INTERVAL_MINUTES = 30;

export const APPOINTMENT_TIME_SLOTS = Array.from(
  { length: (APPOINTMENT_END_MINUTES - APPOINTMENT_START_MINUTES) / APPOINTMENT_INTERVAL_MINUTES + 1 },
  (_, index) => {
    const totalMinutes = APPOINTMENT_START_MINUTES + index * APPOINTMENT_INTERVAL_MINUTES;
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
  },
);

export const APPOINTMENT_TIME_ORDER: Readonly<Record<string, number>> = {
  morning: 0,
  afternoon: 12 * 60,
  'no preference': 24 * 60,
  ...Object.fromEntries(APPOINTMENT_TIME_SLOTS.map((time) => [time, getAppointmentTimeMinutes(time) ?? 0])),
};

export function getManilaAppointmentClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    minutes: Number(values.hour) * 60 + Number(values.minute),
  };
}

export function getEarliestAppointmentDate(now = new Date()) {
  const clock = getManilaAppointmentClock(now);
  if (clock.minutes < APPOINTMENT_END_MINUTES) return clock.date;
  const tomorrow = new Date(`${clock.date}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

export function getAppointmentTimeMinutes(value: string) {
  if (value === 'morning') return 9 * 60;
  if (value === 'afternoon') return 12 * 60;
  if (value === 'no preference') return 24 * 60;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function getAppointmentTimePeriod(value: string) {
  const minutes = getAppointmentTimeMinutes(value);
  return minutes !== null && minutes < 12 * 60 ? 'morning' : 'afternoon';
}

export function isAppointmentTimeAvailable(date: string, time: string, now = new Date()) {
  const slotMinutes = getAppointmentTimeMinutes(time);
  if (!APPOINTMENT_TIME_SLOTS.includes(time) || slotMinutes === null || date < getEarliestAppointmentDate(now)) return false;
  const clock = getManilaAppointmentClock(now);
  return date !== clock.date || slotMinutes > clock.minutes;
}

export function formatAppointmentTime(value: string) {
  const minutes = getAppointmentTimeMinutes(value);
  if (minutes === null) return value;
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}
