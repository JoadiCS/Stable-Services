import type { Timestamp } from 'firebase/firestore';

export type ServiceType = 'pool' | 'lawn' | 'pressure' | 'window';
export type PlanTier = 'essential' | 'standard' | 'plus' | 'custom';
export type CustomerStatus = 'active' | 'paused' | 'cancelled';
export type StaffRole = 'owner' | 'admin' | 'tech' | 'lead_tech';
export type VisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'missed';
export type ServiceWindow = 'AM' | 'PM';
export type PhotoType = 'before' | 'after' | 'issue' | 'other';

export interface Customer {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  serviceType: ServiceType;
  plan: PlanTier;
  assignedTechId?: string;
  /** 0 = Sunday, 6 = Saturday (matches JS Date.getDay()). */
  serviceDayOfWeek: number;
  serviceTimeWindow: ServiceWindow;
  notes?: string;
  status: CustomerStatus;
  /** Firestore Timestamp on read, server-resolved on write. */
  createdAt?: Timestamp;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  /** Firestore Timestamp on read, server-resolved on write. */
  completedAt?: Timestamp | null;
}

export interface ChemicalReadings {
  ph?: number;
  chlorineFree?: number;
  chlorineTotal?: number;
  alkalinity?: number;
  calciumHardness?: number;
  cyanuricAcid?: number;
  salt?: number;
  tds?: number;
  recordedAt?: Timestamp;
}

export interface ChemicalAddition {
  name: string;
  amount: string;
  reason: string;
}

export interface VisitPhoto {
  publicId: string;
  secureUrl: string;
  type: PhotoType;
  caption?: string;
  uploadedAt?: Timestamp;
}

export interface Visit {
  visitId: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  techId: string;
  techName: string;
  serviceType: ServiceType;
  /** YYYY-MM-DD. */
  scheduledDate: string;
  scheduledWindow: ServiceWindow;
  status: VisitStatus;
  startedAt?: Timestamp | null;
  completedAt?: Timestamp | null;
  checklist: ChecklistItem[];
  chemicalReadings?: ChemicalReadings;
  chemicalsAdded?: ChemicalAddition[];
  photos: VisitPhoto[];
  customerNotes?: string;
  techNotes?: string;
  reportGenerated?: boolean;
}

export interface StaffMember {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  phone?: string;
  active: boolean;
  createdAt?: Timestamp;
}
