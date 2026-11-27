export type Language = 'en' | 'fil';

export type Department =
  | 'doctors'
  | 'nutrition_bns'
  | 'dental'
  | 'nursing_midwifery'
  | 'admin_support';

export interface StaffMember {
  id: string;
  name: string;
  title: string;
  role: string;
  roleFil: string;
  department: Department;
  departmentName: string;
  qualifications: string;
  schedule: string;
  scheduleFil: string;
  location: string;
  isHead?: boolean;
  avatarInitials: string;
}

export interface ServiceDetail {
  id: string;
  title: string;
  titleFil: string;
  shortDesc: string;
  shortDescFil: string;
  fullDesc: string;
  fullDescFil: string;
  category:
    | 'maternity'
    | 'dental'
    | 'checkup'
    | 'family_planning'
    | 'immunization'
    | 'tb_dots'
    | 'pen_meds'
    | 'pap_smear';
  schedule: string;
  scheduleFil: string;
  location: string;
  keyPersonnel: string[];
  requirements: string[];
  requirementsFil: string[];
  image?: string;
  badge?: string;
  badgeFil?: string;
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
  category: string;
}

export interface AppointmentBooking {
  id: string;
  referenceCode: string;
  programId: string;
  programTitle: string;
  patientName: string;
  dateOfBirth: string;
  contactNumber: string;
  email: string;
  zone: string;
  appointmentDate: string;
  timeSlot: string;
  philHealthNumber?: string;
  notes?: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' | 'Rejected';
  createdAt: string;
}

export interface NewsUpdate {
  id: string;
  imageUrl?: string;
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
}

export interface ClinicPublicSettings {
  clinicHours: string;
  clinicHoursFil: string;
  doctorHours: string;
  doctorHoursFil: string;
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
  content_type: 'service' | 'news' | 'outreach';
  content_id: string;
  content_json: string;
  published: number;
  deleted: number;
  updated_at: string;
}

export interface PatientRecord {
  id: string;
  patientNumber: string;
  fullName: string;
  birthDate: string;
  gender: string;
  zone: string;
  contactNumber: string;
  philHealthNo: string;
  category: 'general' | 'maternal' | 'pediatric' | 'tb_dots';
  vitalsHistory: Array<{
    date: string;
    bloodPressure: string;
    heartRate: number;
    weightKg: number;
    heightCm: number;
    bloodSugarFbs?: number;
    notes: string;
    recordedBy: string;
  }>;
  prescriptions: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    prescribedDate: string;
    nextRefillDate: string;
    status: 'Available for Pick-up' | 'Active Regimen' | 'Refill Due';
    prescribedBy: string;
  }>;
  radiologyReports: Array<{
    id: string;
    procedure: string;
    date: string;
    radiologist: string;
    technologist: string;
    findings: string;
    impression: string;
    status: 'Official Report Ready';
  }>;
}

export interface ChatMessage {
  id: string;
  sender: 'patient' | 'staff';
  senderName: string;
  senderRole?: string;
  text: string;
  timestamp: string;
  attachment?: string;
}

export interface ContactSubmission {
  id: string;
  ticketId: string;
  name: string;
  phone: string;
  email: string;
  zone: string;
  topic: string;
  message: string;
  submittedAt: string;
  status: 'Received' | 'Under Review';
}
