import { CLINIC_ADDRESS, MASIKAP_SERVICES } from './masikapClinicInfo.ts';
import type { ClinicPublicSettings, NewsUpdate, OutreachProgram, ServiceDetail } from '../types';

export const DEFAULT_CLINIC_PUBLIC_SETTINGS: ClinicPublicSettings = {
  clinicHours: 'Medical staff duty: 7am-4pm (8 hours)',
  clinicHoursFil: 'Duty ng medical staff: 7am-4pm (8 oras)',
  doctorHours: '',
  doctorHoursFil: '',
  xrayHours: '',
  xrayHoursFil: '',
  dentalHours: '',
  dentalHoursFil: '',
  clinicAddress: CLINIC_ADDRESS,
  clinicAddressFil: CLINIC_ADDRESS,
  contactPhone: '',
  contactEmail: '',
  emergencyPhone: '',
  emergencyPhoneFil: '',
  holidayAdvisory: 'Verify clinic operations before visiting on holidays.',
  holidayAdvisoryFil: 'Tiyakin ang operasyon ng klinika bago bumisita tuwing holiday.',
};

export const SERVICES_DATA: ServiceDetail[] = MASIKAP_SERVICES.map((service) => ({
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