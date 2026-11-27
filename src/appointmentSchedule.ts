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

export function getLatestAppointmentDate(now = new Date()) {
  const { date } = getManilaAppointmentClock(now);
  const latestDate = new Date(`${date}T12:00:00Z`);
  latestDate.setUTCDate(latestDate.getUTCDate() + 30);
  return latestDate.toISOString().slice(0, 10);
}

export function getAppointmentTimeMinutes(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function isAppointmentTimeAvailable(date: string, time: string, now = new Date()) {
  const slotMinutes = getAppointmentTimeMinutes(time);
  if (!APPOINTMENT_TIME_SLOTS.includes(time)
    || slotMinutes === null
    || date < getEarliestAppointmentDate(now)
    || date > getLatestAppointmentDate(now)) return false;
  const clock = getManilaAppointmentClock(now);
  return date !== clock.date || slotMinutes > clock.minutes;
}

export function getAppointmentTimePeriod(value: string) {
  if (value === 'morning') return 'morning';
  if (value === 'afternoon' || value === 'no preference') return 'afternoon';
  const minutes = getAppointmentTimeMinutes(value);
  return minutes !== null && minutes < 12 * 60 ? 'morning' : 'afternoon';
}

export function formatAppointmentTime(value: string) {
  if (value === 'morning') return 'Morning';
  if (value === 'afternoon') return 'Afternoon';
  if (value === 'no preference') return 'Any time';
  const minutes = getAppointmentTimeMinutes(value);
  if (minutes === null) return value;
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}
