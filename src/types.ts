export type ServiceCategory = 'checkup' | 'maternity' | 'family_planning' | 'vaccination';
export type ContentType = 'service' | 'news' | 'outreach';

export interface ServiceDetail {
  id: string;
  title: string;
  titleFil: string;
  shortDesc: string;
  shortDescFil: string;
  fullDesc: string;
  fullDescFil: string;
  category: ServiceCategory;
  schedule: string;
  scheduleFil: string;
  location: string;
  keyPersonnel: string[];
  requirements: string[];
  requirementsFil: string[];
  badge: string;
  badgeFil: string;
}

export interface NewsUpdate {
  id: string;
  title: string;
  titleFil: string;
  summary: string;
  summaryFil: string;
  content: string;
  contentFil: string;
  date: string;
  category: 'Schedule' | 'Advisory' | 'Campaign' | 'Meds';
  categoryFil: string;
  author: string;
  readTime: string;
  imageUrl?: string;
}

export interface OutreachProgram {
  id: string;
  title: string;
  titleFil: string;
  description: string;
  descriptionFil: string;
  targetBarangay: string;
  scheduleDate: string;
  timeWindow: string;
  location: string;
  capacity: number;
  slotsRemaining: number;
  eligibility: string;
  eligibilityFil: string;
  category: 'opt' | 'dental' | 'xray_tb' | 'maintenance_refill' | 'maternal' | 'rabies';
}

export interface ClinicPublicSettings {
  clinicHours: string;
  clinicHoursFil: string;
  doctorHours: string;
  doctorHoursFil: string;
  xrayHours: string;
  xrayHoursFil: string;
  dentalHours: string;
  dentalHoursFil: string;
  clinicAddress: string;
  clinicAddressFil: string;
  contactPhone: string;
  contactEmail: string;
  emergencyPhone: string;
  emergencyPhoneFil: string;
  holidayAdvisory: string;
  holidayAdvisoryFil: string;
}

export interface PublicSiteContent {
  services: ServiceDetail[];
  news: NewsUpdate[];
  outreach: OutreachProgram[];
  settings: ClinicPublicSettings;
}

export interface AdminSiteContentItem {
  content_type: ContentType;
  content_id: string;
  content_json: string;
  published: number;
  deleted?: number;
  updated_at: string;
}