import { api } from './client';
import type { ContactMessage, Doctor, Partner, ReportOverview, UserRecord } from '../types/models';
import type { Role } from '../types';

export interface AdminStats {
  totalUsers: number;
  totalDonors: number;
  totalHospitals: number;
  totalDonations: number;
  activeRequests: number;
}

export interface ActivityItem {
  _id: string;
  action: string;
  type: string;
  status: string;
  details?: string;
  createdAt: string;
  user?: { name: string; role: string } | null;
}

export interface NewUser {
  name: string;
  email: string;
  password: string;
  phone: string;
  location: string;
  role: Role;
  bloodType?: string;
  nationalId?: string;
  gender?: string;
  age?: number;
  hospitalLicense?: string;
}

export const adminApi = {
  stats: () => api.get<AdminStats>('/api/admin/stats'),
  recentActivity: (limit = 10) => api.get<ActivityItem[]>(`/api/activity?limit=${limit}`),

  users: (role?: Role) => api.get<UserRecord[]>('/api/admin/users', { params: role ? { role } : {} }),
  registerUser: (body: NewUser) => api.post<{ message: string }>('/api/admin/register-user', body),
  updateUser: (id: string, body: Partial<UserRecord>) => api.put(`/api/admin/update-user/${id}`, body),
  deleteUser: (id: string) => api.delete(`/api/admin/delete-user/${id}`),

  hospitals: () => api.get<UserRecord[]>('/api/admin/hospitals'),
  approveHospital: (id: string, isApproved: boolean) => api.put(`/api/admin/approve-hospital/${id}`, { isApproved }),

  partners: () => api.get<Partner[]>('/api/admin/partners'),
  savePartner: (id: string | null, body: Partial<Partner>) =>
    id ? api.put(`/api/admin/partners/${id}`, body) : api.post('/api/admin/partners', body),
  deletePartner: (id: string) => api.delete(`/api/admin/partners/${id}`),

  doctors: () => api.get<Doctor[]>('/api/admin/doctors'),
  saveDoctor: (id: string | null, body: Record<string, unknown>) =>
    id ? api.put(`/api/admin/doctors/${id}`, body) : api.post('/api/admin/doctors', body),
  deleteDoctor: (id: string) => api.delete(`/api/admin/doctors/${id}`),

  contactMessages: () => api.get<ContactMessage[]>('/api/contact'),
  deleteContactMessage: (id: string) => api.delete(`/api/contact/${id}`),

  reportOverview: () => api.get<ReportOverview>('/api/reports/overview'),
};
