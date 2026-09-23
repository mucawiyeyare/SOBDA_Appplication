import { z } from 'zod';
import { BLOOD_TYPES } from '../types';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginForm = z.infer<typeof loginSchema>;

const base = {
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().trim().min(7, 'Enter a valid phone number'),
  region: z.string().min(1, 'Select a region'),
  district: z.string().min(1, 'Select a district'),
};

export const donorSchema = z.object({
  ...base,
  nationalId: z.string().trim().min(3, 'Government ID is required'),
  gender: z.enum(['Male', 'Female'], { message: 'Select gender' }),
  bloodType: z.enum(BLOOD_TYPES as [string, ...string[]], { message: 'Select blood type' }),
  age: z
    .string()
    .optional()
    .refine((v) => !v || (Number(v) >= 18 && Number(v) <= 65), 'Donors must be 18-65'),
});
export type DonorForm = z.infer<typeof donorSchema>;

export const hospitalSchema = z.object({
  ...base,
  hospitalLicense: z.string().trim().optional(),
  road: z.string().trim().optional(),
});
export type HospitalForm = z.infer<typeof hospitalSchema>;
