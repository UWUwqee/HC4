import { CLINIC_ADDRESS, DELFIN_SALONGA_SERVICES } from './delfinSalongaClinicInfo.ts';
import type { ClinicPublicSettings, NewsUpdate, OutreachProgram, ServiceDetail } from '../types';

export const DEFAULT_CLINIC_PUBLIC_SETTINGS: ClinicPublicSettings = {
  clinicHours: 'Medical staff duty: 7:00 am - 4:00 pm, Mon-Fri',
  clinicHoursFil: 'Duty ng medical staff: 7:00 am - 4:00 pm, Lunes-Biyernes',
  doctorHours: '',
  doctorHoursFil: '',
  xrayHours: '',
  xrayHoursFil: '',
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

export const ANALYTICS_DATA = {
  monthlyConsultations: null as number | null,
  satisfactionRate: null as number | null,
  optScreeningProgress: null as number | null,
  freePrescriptionsDispensed: null as number | null,
  serviceBreakdown: [] as Array<{ service: string; patients: number; share: string }>,
  zoneDistribution: [] as Array<{ name: string; count: number; percentage: number }>,
  nutritionClassificationsJanMarch: [] as Array<{ status: string; count: number; percentage: number }>,
  medicineInventoryStatus: [] as Array<{ medication: string; healthScore: string; stock: number; threshold: number }>,
};

export const ZONES_COVERAGE: string[] = [];