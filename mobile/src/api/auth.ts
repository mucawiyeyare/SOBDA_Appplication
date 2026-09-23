import { api } from './client';
import type { AuthResponse, BloodType } from '../types';

export interface DonorRegistration {
  role: 'donor';
  nationalId: string;
  gender: 'Male' | 'Female';
  name: string;
  email: string;
  password: string;
  phone: string;
  location: string;
  bloodType: BloodType;
  age?: number;
}

export interface HospitalRegistration {
  role: 'hospital';
  name: string;
  email: string;
  password: string;
  phone: string;
  location: string;
  hospitalLicense?: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/api/users/login', { email: email.trim().toLowerCase(), password }),
  register: (data: DonorRegistration | HospitalRegistration) =>
    api.post<AuthResponse>('/api/users/register', data),
};
