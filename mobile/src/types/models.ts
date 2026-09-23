import type { BloodType, Role } from './index';

export type RequestStatus =
  | 'Pending'
  | 'Arrived'
  | 'Accepted'
  | 'Declined'
  | 'Completed'
  | 'Cancelled'
  | 'Expired';
export type Urgency = 'Routine' | 'Urgent' | 'Emergency';

export interface PartyRef {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  bloodType?: BloodType;
  gender?: string;
  age?: number;
  nationalId?: string;
}

export interface PatientInfo {
  name?: string;
  age?: number;
  phone?: string;
  diagnosis?: string;
  causeOfInjury?: string;
  notes?: string;
}

export interface DonorRequest {
  _id: string;
  hospitalId: PartyRef | null;
  donorId: PartyRef | null;
  bloodType: BloodType;
  urgency: Urgency;
  message?: string;
  patientInfo?: PatientInfo;
  status: RequestStatus;
  availabilityTime?: string;
  declineReason?: string;
  requestDate: string;
  pendingUntil?: string;
  remainingSeconds: number;
  batchId?: string;
}

export interface Donation {
  _id: string;
  donorId: PartyRef | string;
  hospitalId?: PartyRef | null;
  bloodType?: BloodType;
  donationDate: string;
  donationType?: string;
  volume?: number;
  status?: string;
}

export type DonorStatus = 'Available' | 'Pending' | 'Arrived' | 'Donated' | 'Unavailable';

export interface DonorRow extends PartyRef {
  status: DonorStatus;
  isAvailable?: boolean;
  lastDonationDate?: string;
  cooldownEndsAt?: string | null;
  remainingSeconds?: number;
}

export interface DonorStats {
  livesHelped: number;
  totalCompleted: number;
  totalPending: number;
  totalArrived: number;
  totalDeclined: number;
}

export interface LeaderboardEntry {
  donationCount: number;
  firstName: string;
  lastInitial: string;
  bloodType?: BloodType;
  location?: string;
}

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  title?: string;
  bio?: string;
  highlights?: string[];
  photo?: string;
  canChat: boolean;
  isActive?: boolean;
  order?: number;
}

export interface Partner {
  _id: string;
  name: string;
  logo: string;
  websiteUrl: string;
  isActive?: boolean;
  order?: number;
}

export interface ChatMessage {
  _id: string;
  sender: 'donor' | 'doctor';
  text: string;
  createdAt: string;
}

export interface Thread {
  doctorId?: string;
  donorId?: string;
  doctor?: { _id: string; name: string; specialty?: string; photo?: string };
  donor?: { _id?: string; name: string; bloodType?: BloodType; profileImage?: string };
  lastMessage: { text: string; sender: string; createdAt: string };
  unread: number;
}

export interface UserRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role: Role;
  bloodType?: BloodType;
  isApproved?: boolean;
  isAvailable?: boolean;
  createdAt?: string;
  hospitalLicense?: string;
  nationalId?: string;
  gender?: string;
  age?: number;
  totalRequests?: number;
  completedDonations?: number;
  activeRequests?: number;
}

export interface ContactMessage {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  urgency?: string;
  createdAt: string;
}

export interface PublicReport {
  bloodTypeStats: Record<string, { count: number; percentage: string | number }>;
  monthlyStats: { newDonorsThisMonth: number; percentageChange: number };
  activityStats: { totalDonors: number; totalHospitals: number; totalUsers: number; regionsCovered: number };
}

export interface ReportOverview {
  summary: Record<string, number>;
  urgencyCounts?: Record<string, number>;
  monthlyDonations?: { month: string; count: number }[];
  recentActivities?: { type?: string; message?: string; description?: string; timestamp: string }[];
}
