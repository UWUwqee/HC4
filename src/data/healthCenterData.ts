import { CLINIC_ADDRESS, DELFIN_SALONGA_SERVICES } from './delfinSalongaClinicInfo.ts';
import type { ClinicPublicSettings, NewsUpdate, OutreachProgram, ServiceDetail } from '../types';

export const DEFAULT_CLINIC_PUBLIC_SETTINGS: ClinicPublicSettings = {
  clinicHours: 'Medical staff duty: 7:00 am - 4:00 pm, Mon-Fri',
  clinicHoursFil: 'Duty ng medical staff: 7:00 am - 4:00 pm, Lunes-Biyernes',
  doctorHours: '',
  doctorHoursFil: '',
  dentalHours: 'Dental: Thursday and Friday, 7:00 am - 4:00 pm',
  dentalHoursFil: 'Dental: Huwebes at Biyernes, 7:00 am - 4:00 pm',
  clinicAddress: CLINIC_ADDRESS,
  clinicAddressFil: CLINIC_ADDRESS,
  contactPhone: '',
  contactEmail: '',
  emergencyPhone: '',
  emergencyPhoneFil: '',
  holidayAdvisory: 'Verify clinic operations before visiting on holidays.',
  holidayAdvisoryFil: 'Tiyakin ang operasyon ng klinika bago bumisita tuwing holiday.',
};

export const SERVICES_DATA: ServiceDetail[] = DELFIN_SALONGA_SERVICES.map((service) => ({
  ...service,
  keyPersonnel: [...service.keyPersonnel],
  requirements: [...service.requirements],
  requirementsFil: [...service.requirementsFil],
}));

export const NEWS_UPDATES: NewsUpdate[] = [];
export const OUTREACH_PROGRAMS: OutreachProgram[] = [];