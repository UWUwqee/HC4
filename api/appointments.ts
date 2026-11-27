import 'dotenv/config';
import { createClient } from '@libsql/client';
import { randomBytes, randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { verifyToken } from '@clerk/backend';
import { ensureSiteContent, getContentDatabase } from './site-content-store.js';
import {
  APPOINTMENT_TIME_SLOTS,
  formatAppointmentTime,
  getLatestAppointmentDate,
  getAppointmentTimePeriod,
  getEarliestAppointmentDate,
  isAppointmentTimeAvailable,
} from '../src/appointmentSchedule.js';
import { COVERAGE_AREAS } from '../src/data/delfinSalongaClinicInfo.js';

type ApiRequest = IncomingMessage & { body?: unknown; headers: IncomingMessage['headers'] & { authorization?: string } };
type ApiResponse = ServerResponse & {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

const zones = new Set<string>(COVERAGE_AREAS);
const preferredTimes = new Set(APPOINTMENT_TIME_SLOTS);
const priorityCategoryOptions = new Set(['pwd', 'senior_citizen', 'pregnant_lactating']);
const guardianRelationships = new Set(['Parent', 'Legal guardian', 'Other guardian']);

let database: ReturnType<typeof createClient> | undefined;

function getDatabase() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return null;
  database ??= createClient({ url, authToken });
  return database;
}

function text(value: unknown, limit: number) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

async function authenticate(request: ApiRequest) {
  const authorization = text(request.headers.authorization, 2000);
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return null;
  try {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) throw new Error('CLERK_SECRET_KEY is not configured.');
    return await verifyToken(token, { secretKey });
  } catch (error) {
    console.error('Appointment API Clerk session verification failed:', error);
    return null;
  }
}

async function ensureAppointmentTable(db: ReturnType<typeof createClient>) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS appointment_requests (
      id TEXT PRIMARY KEY,
      owner_uid TEXT,
      reference_code TEXT NOT NULL UNIQUE,
      patient_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT NOT NULL,
      chief_complaint TEXT NOT NULL,
      age INTEGER NOT NULL,
      guardian_name TEXT,
      guardian_relationship TEXT,
      guardian_consent INTEGER NOT NULL DEFAULT 0,
      priority_categories TEXT NOT NULL DEFAULT '',
      attendance_consent INTEGER NOT NULL DEFAULT 0,
      early_arrival_consent INTEGER NOT NULL DEFAULT 0,
      zone TEXT NOT NULL,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      preferred_date TEXT NOT NULL,
      preferred_time TEXT NOT NULL,
      privacy_consent INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      chat_status TEXT NOT NULL DEFAULT 'closed',
      created_at TEXT NOT NULL,
      completed_at TEXT,
      missed_at TEXT
    )
  `);
  const columns = await db.execute('PRAGMA table_info(appointment_requests)');
  const columnNames = new Set(columns.rows.map((column) => String(column.name)));
  if (!columnNames.has('owner_uid')) {
    await db.execute('ALTER TABLE appointment_requests ADD COLUMN owner_uid TEXT');
  }
  if (!columnNames.has('chat_status')) {
    await db.execute("ALTER TABLE appointment_requests ADD COLUMN chat_status TEXT NOT NULL DEFAULT 'closed'");
  }
  if (!columnNames.has('completed_at')) {
    await db.execute('ALTER TABLE appointment_requests ADD COLUMN completed_at TEXT');
  }
  if (!columnNames.has('missed_at')) {
    await db.execute('ALTER TABLE appointment_requests ADD COLUMN missed_at TEXT');
  }
  if (!columnNames.has('address')) {
    await db.execute('ALTER TABLE appointment_requests ADD COLUMN address TEXT');
  }
  if (!columnNames.has('chief_complaint')) {
    await db.execute('ALTER TABLE appointment_requests ADD COLUMN chief_complaint TEXT');
  }
  if (!columnNames.has('attendance_consent')) {
    await db.execute('ALTER TABLE appointment_requests ADD COLUMN attendance_consent INTEGER NOT NULL DEFAULT 0');
  }
  if (!columnNames.has('age')) {
    await db.execute('ALTER TABLE appointment_requests ADD COLUMN age INTEGER');
  }
  if (!columnNames.has('guardian_name')) {
    await db.execute('ALTER TABLE appointment_requests ADD COLUMN guardian_name TEXT');
  }
  if (!columnNames.has('guardian_relationship')) {
    await db.execute('ALTER TABLE appointment_requests ADD COLUMN guardian_relationship TEXT');
  }
  if (!columnNames.has('guardian_consent')) {
    await db.execute('ALTER TABLE appointment_requests ADD COLUMN guardian_consent INTEGER NOT NULL DEFAULT 0');
  }
  if (!columnNames.has('early_arrival_consent')) {
    await db.execute('ALTER TABLE appointment_requests ADD COLUMN early_arrival_consent INTEGER NOT NULL DEFAULT 0');
  }
  if (!columnNames.has('priority_categories')) {
    await db.execute("ALTER TABLE appointment_requests ADD COLUMN priority_categories TEXT NOT NULL DEFAULT ''");
  }
  await db.execute(`
    CREATE TABLE IF NOT EXISTS appointment_slot_settings (
      appointment_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 0,
      blocked INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (appointment_date, time_slot)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS appointment_messages (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      sender_uid TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');

  if (request.method === 'GET') {
    const token = text(request.headers.authorization, 2000);
    const decoded = token ? await authenticate(request) : null;
    if (token && !decoded) return response.status(401).json({ error: 'Authentication is required.' });
    const db = getDatabase();
    if (!db) return response.status(503).json({ error: 'Schedule data is temporarily unavailable.' });

    try {
      await ensureAppointmentTable(db);
      const result = await db.execute(`
        SELECT preferred_date, preferred_time, COUNT(*) AS booked_count
        FROM appointment_requests
        WHERE status = 'confirmed'
        GROUP BY preferred_date, preferred_time
        ORDER BY preferred_date ASC
      `);
      const slots = result.rows.map((row) => ({
        date: String(row.preferred_date),
        time: String(row.preferred_time),
        bookedCount: Number(row.booked_count),
      }));
      const priorityResult = await db.execute(`
        SELECT preferred_date, preferred_time, COUNT(*) AS priority_count
        FROM appointment_requests
        WHERE status = 'confirmed' AND priority_categories != ''
        GROUP BY preferred_date, preferred_time
        ORDER BY preferred_date ASC, preferred_time ASC
      `);
      const prioritySlots = priorityResult.rows.map((row) => ({
        date: String(row.preferred_date),
        time: String(row.preferred_time),
        priorityCount: Number(row.priority_count),
      }));
      const serviceAppointments = await db.execute(`
        SELECT preferred_date, preferred_time, service_id, service_name, priority_categories
        FROM appointment_requests
        WHERE status = 'confirmed'
        ORDER BY preferred_date ASC, preferred_time ASC, service_name ASC
      `);
      const regularServicesBySlot = new Map<string, Array<{ id: string; name: string }>>();
      const priorityServicesBySlot = new Map<string, Array<{ id: string; name: string }>>();
      for (const appointment of serviceAppointments.rows) {
        const key = `${String(appointment.preferred_date)}:${String(appointment.preferred_time)}`;
        const isPriority = String(appointment.priority_categories ?? '').trim() !== '';
        const servicesBySlot = isPriority ? priorityServicesBySlot : regularServicesBySlot;
        const services = servicesBySlot.get(key) ?? [];
        const serviceId = String(appointment.service_id);
        if (!services.some((service) => service.id === serviceId)) {
          services.push({ id: serviceId, name: String(appointment.service_name) });
          servicesBySlot.set(key, services);
        }
      }
      const settingResult = await db.execute({
        sql: `SELECT appointment_date, time_slot, capacity, blocked
              FROM appointment_slot_settings
              WHERE appointment_date >= ?
              ORDER BY appointment_date ASC, time_slot ASC`,
        args: [new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())],
      });
      const slotSettings = settingResult.rows.map((row) => ({
        date: String(row.appointment_date),
        time: String(row.time_slot),
        capacity: Number(row.capacity),
        blocked: Number(row.blocked) === 1,
      }));
      const unavailableResult = await db.execute({
        sql: `SELECT preferred_date, preferred_time,
                     MAX(CASE WHEN priority_categories = '' THEN 1 ELSE 0 END) AS has_regular_booking,
                     MAX(CASE WHEN priority_categories != '' THEN 1 ELSE 0 END) AS has_priority_booking
              FROM appointment_requests
              WHERE status IN ('pending', 'confirmed') AND preferred_date >= ?
              GROUP BY preferred_date, preferred_time
              ORDER BY preferred_date ASC, preferred_time ASC`,
        args: [new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())],
      });
      const unavailableSlots = unavailableResult.rows.map((row) => ({
        date: String(row.preferred_date),
        time: String(row.preferred_time),
        hasRegularBooking: Number(row.has_regular_booking) === 1,
        hasPriorityBooking: Number(row.has_priority_booking) === 1,
      }));
      const slotsWithServices = slots.map((slot) => ({
        ...slot,
        services: regularServicesBySlot.get(`${slot.date}:${slot.time}`) ?? [],
      }));
      const prioritySlotsWithServices = prioritySlots.map((slot) => ({
        ...slot,
        services: priorityServicesBySlot.get(`${slot.date}:${slot.time}`) ?? [],
      }));

      if (decoded) {
        const appointments = await db.execute({
          sql: `SELECT * FROM appointment_requests WHERE owner_uid = ? ORDER BY preferred_date ASC, preferred_time ASC`,
          args: [decoded.sub],
        });
        return response.status(200).json({ slots: slotsWithServices, prioritySlots: prioritySlotsWithServices, slotSettings, unavailableSlots, appointments: appointments.rows });
      }
      return response.status(200).json({ slots: slotsWithServices, prioritySlots: prioritySlotsWithServices, slotSettings, unavailableSlots });
    } catch {
      return response.status(500).json({ error: 'Schedule data could not be loaded.' });
    }
  }

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const authorization = text(request.headers.authorization, 2000);
  if (!authorization.startsWith('Bearer ')) {
    return response.status(401).json({ error: 'Sign in before requesting an appointment.' });
  }
  const decoded = await authenticate(request);
  if (!decoded) {
    return response.status(401).json({ error: 'Your Clerk sign-in could not be verified.' });
  }

  const body = request.body && typeof request.body === 'object'
    ? request.body as Record<string, unknown>
    : {};
  const patientName = text(body.patientName, 120);
  const phone = text(body.phone, 32);
  const houseApartmentNumber = text(body.houseApartmentNumber, 100);
  const streetName = text(body.streetName, 150);
  const address = [houseApartmentNumber, streetName].filter(Boolean).join(', ').slice(0, 250);
  const chiefComplaint = text(body.chiefComplaint, 2000);
  const age = body.age;
  const guardianName = text(body.guardianName, 120);
  const guardianRelationship = text(body.guardianRelationship, 60);
  const priorityCategories = body.priorityCategories;
  const zone = text(body.zone, 40);
  const serviceId = text(body.serviceId, 40);
  const preferredDate = text(body.preferredDate, 10);
  const preferredTime = text(body.preferredTime, 30);
  const ownerUid = decoded.sub;

  if (body.action === 'cancel') {
    const referenceCode = text(body.referenceCode, 80);
    if (!referenceCode || !ownerUid) return response.status(400).json({ error: 'Reference code and signed-in user are required.' });
    const db = getDatabase();
    if (!db) return response.status(503).json({ error: 'Appointment requests are temporarily unavailable.' });
    try {
      await db.execute({ sql: "UPDATE appointment_requests SET status = 'cancelled' WHERE reference_code = ? AND owner_uid = ?", args: [referenceCode, ownerUid] });
      return response.status(200).json({ referenceCode, status: 'cancelled' });
    } catch {
      return response.status(500).json({ error: 'Appointment could not be cancelled.' });
    }
  }

  const dateIsValid = /^\d{4}-\d{2}-\d{2}$/.test(preferredDate)
    && !Number.isNaN(Date.parse(`${preferredDate}T00:00:00Z`))
    && new Date(`${preferredDate}T00:00:00Z`).toISOString().slice(0, 10) === preferredDate;
  const now = new Date();
  const earliestAppointmentDate = getEarliestAppointmentDate(now);
  const latestAppointmentDate = getLatestAppointmentDate(now);

  if (patientName.length < 2) return response.status(400).json({ error: 'Enter a valid full name.' });
  if (!/^\+639\d{9}$/.test(phone)) return response.status(400).json({ error: 'Enter a valid Philippine mobile number with +63 and 10 digits.' });
  if (!houseApartmentNumber || streetName.length < 2 || address.length < 5) {
    return response.status(400).json({ error: 'Enter a valid house/apartment number and street name.' });
  }
  if (chiefComplaint.length < 2) return response.status(400).json({ error: 'Describe your chief complaint or reason for the visit.' });
  if (typeof age !== 'number' || !Number.isInteger(age) || age < 0 || age > 110) {
    return response.status(400).json({ error: 'Enter a valid age from 0 to 110.' });
  }
  if (age <= 17 && (
    guardianName.length < 2
    || !guardianRelationships.has(guardianRelationship)
    || body.guardianConsent !== true
  )) {
    return response.status(400).json({ error: 'Patients aged 17 and younger must provide a parent or guardian and confirm they will attend.' });
  }
  if (!Array.isArray(priorityCategories)
    || priorityCategories.some((category) => typeof category !== 'string' || !priorityCategoryOptions.has(category))
    || new Set(priorityCategories).size !== priorityCategories.length) {
    return response.status(400).json({ error: 'Choose valid priority categories.' });
  }
  if (age < 60 && priorityCategories.includes('senior_citizen')) {
    return response.status(400).json({ error: 'Senior citizen priority is available to patients aged 60 and above.' });
  }
  if (age >= 60 && !priorityCategories.includes('senior_citizen')) {
    priorityCategories.push('senior_citizen');
  }
  if (age >= 60 && priorityCategories.includes('pregnant_lactating')) {
    return response.status(400).json({ error: 'Pregnant or lactating priority cannot be selected with senior citizen priority.' });
  }
  if (!zones.has(zone)) return response.status(400).json({ error: 'Select a valid zone or barangay.' });
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(serviceId)) return response.status(400).json({ error: 'Select a valid service.' });
  if (!dateIsValid || preferredDate < earliestAppointmentDate || preferredDate > latestAppointmentDate) {
    return response.status(400).json({ error: `Choose an appointment date between ${earliestAppointmentDate} and ${latestAppointmentDate} (Philippines time).` });
  }
  if (!preferredTimes.has(preferredTime)) return response.status(400).json({ error: 'Select a half-hour appointment time between 9:00 AM and 2:00 PM.' });
  if (!isAppointmentTimeAvailable(preferredDate, preferredTime, now)) {
    return response.status(400).json({ error: `Choose an appointment time that has not passed today. Today's date is available until 2:00 PM (Philippines time).` });
  }
  if (body.privacyConsent !== true) return response.status(400).json({ error: 'Please agree to the contact and privacy consent.' });
  if (body.attendanceConsent !== true) return response.status(400).json({ error: 'Please acknowledge the appointment attendance reminder.' });
  if (body.arrivalConsent !== true) return response.status(400).json({ error: 'Please confirm that you will arrive 30 minutes before your appointment.' });

  const db = getDatabase();
  if (!db) return response.status(503).json({ error: 'Appointment requests are temporarily unavailable.' });

  const id = randomUUID();
  const referenceCode = `MFHC-${randomBytes(4).toString('hex').toUpperCase()}`;
  const createdAt = new Date().toISOString();

  try {
    await ensureAppointmentTable(db);
    const contentDb = getContentDatabase();
    if (!contentDb) return response.status(503).json({ error: 'Appointment requests are temporarily unavailable.' });
    await ensureSiteContent(contentDb);
    const serviceResult = await contentDb.execute({
      sql: `SELECT content_json FROM public_site_content
            WHERE content_type = 'service' AND content_id = ? AND published = 1 AND deleted = 0`,
      args: [serviceId],
    });
    if (!serviceResult.rows[0]) {
      return response.status(400).json({ error: 'This service is no longer available for appointment requests.' });
    }
    const service = JSON.parse(String(serviceResult.rows[0].content_json)) as { title?: unknown; category?: unknown };
    const serviceName = typeof service.title === 'string' ? service.title.trim().slice(0, 160) : '';
    if (!serviceName) return response.status(400).json({ error: 'The selected service is not configured for appointment requests.' });
    const transaction = await db.transaction('write');
    try {
      const activeAppointment = await transaction.execute({
        sql: `SELECT reference_code, preferred_date, preferred_time, status
              FROM appointment_requests
              WHERE owner_uid = ? AND status IN ('pending', 'confirmed')
              ORDER BY created_at DESC LIMIT 1`,
        args: [ownerUid],
      });
      if (activeAppointment.rows[0]) {
        const existing = activeAppointment.rows[0];
        await transaction.commit();
        return response.status(409).json({
          error: String(existing.status) === 'confirmed'
            ? 'You already have an accepted appointment. Complete or cancel it before requesting another.'
            : 'You already have an appointment request waiting for review.',
          activeAppointment: {
            referenceCode: String(existing.reference_code),
            preferredDate: String(existing.preferred_date),
            preferredTime: String(existing.preferred_time),
            status: String(existing.status),
          },
        });
      }
      const prioritySlotFilter = priorityCategories.length > 0 ? "AND priority_categories != ''" : '';
      const occupiedSlot = await transaction.execute({
        sql: `SELECT 1 FROM appointment_requests
              WHERE preferred_date = ? AND preferred_time = ?
                AND status IN ('pending', 'confirmed')
                ${prioritySlotFilter}
              LIMIT 1`,
        args: [preferredDate, preferredTime],
      });
      if (occupiedSlot.rows[0]) {
        await transaction.commit();
        return response.status(409).json({ error: 'This appointment time has already been booked. Please choose another time.' });
      }
      const slotSettings = await transaction.execute({
        sql: `SELECT time_slot, blocked FROM appointment_slot_settings
              WHERE appointment_date = ? AND time_slot IN ('all_day', ?, ?)`,
        args: [preferredDate, preferredTime, getAppointmentTimePeriod(preferredTime)],
      });
      if (slotSettings.rows.some((setting) => Number(setting.blocked) === 1)) {
        await transaction.commit();
        return response.status(409).json({ error: 'The selected date or time slot is unavailable. Please choose another.' });
      }
      const status = 'confirmed';
      const appointmentTime = formatAppointmentTime(preferredTime);
      const message = `This is an automated message.\n\nYour appointment for ${serviceName} on ${preferredDate} at ${appointmentTime} has been automatically confirmed. You can view the schedule in your appointment chat.\n\nFilipino:\nAwtomatikong mensahe ito. Kumpirmado na ang iyong appointment para sa ${serviceName} sa ${preferredDate}, ganap na ${appointmentTime}. Maaari mong tingnan ang iskedyul sa chat ng iyong appointment.`;
      await transaction.execute({
        sql: `INSERT INTO appointment_requests (
          id, owner_uid, reference_code, patient_name, phone, address, chief_complaint, age,
          guardian_name, guardian_relationship, guardian_consent, priority_categories,
          zone, service_id, service_name, preferred_date, preferred_time, privacy_consent,
          attendance_consent, early_arrival_consent, status, chat_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 'open', ?)`,
        args: [
          id, ownerUid, referenceCode, patientName, phone, address, chiefComplaint, age,
          age <= 17 ? guardianName : null,
          age <= 17 ? guardianRelationship : null,
          age <= 17 && body.guardianConsent === true ? 1 : 0,
          priorityCategories.join(','), zone, serviceId, serviceName, preferredDate, preferredTime,
          body.attendanceConsent ? 1 : 0, body.arrivalConsent ? 1 : 0, status, createdAt,
        ],
      });
      await transaction.execute({
        sql: `INSERT INTO appointment_messages
              (id, appointment_id, sender_uid, sender_role, sender_name, message, created_at)
              VALUES (?, ?, 'clinic-system', 'admin', 'Health Center', ?, ?)`,
        args: [randomUUID(), id, message, createdAt],
      });
      await transaction.commit();
      return response.status(201).json({ referenceCode, status, createdAt });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch {
    return response.status(500).json({ error: 'We could not save your request. Please try again.' });
  }

}
