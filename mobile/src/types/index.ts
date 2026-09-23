export type Role = 'donor' | 'hospital' | 'admin' | 'health_institution' | 'doctor';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role: Role;
  bloodType?: BloodType;
  nationalId?: string;
  gender?: 'Male' | 'Female' | 'Other';
  age?: number;
  isAvailable?: boolean;
  isApproved?: boolean;
  lastDonationDate?: string;
  allowPublicLeaderboard?: boolean;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user: User;
  isPendingApproval?: boolean;
}
