import { api } from './client';
import type { AppNotification } from '../types/models';
import type { User } from '../types';

export interface ProfileUpdate {
  name?: string;
  phone?: string;
  location?: string;
  gender?: string;
  age?: number;
  bloodType?: string;
  profileImage?: string;
  allowPublicLeaderboard?: boolean;
}

export interface FullProfile extends User {
  _id: string;
  profileImage?: string;
  hospitalLicense?: string;
}

export const accountApi = {
  profile: () => api.get<FullProfile>('/api/users/profile'),
  updateProfile: (body: ProfileUpdate) =>
    api.put<{ message: string; user: FullProfile }>('/api/users/profile', body),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<{ message: string }>('/api/users/change-password', { currentPassword, newPassword }),
};

export const notificationsApi = {
  list: (limit = 50) =>
    api.get<{ unreadCount: number; notifications: AppNotification[] }>(`/api/notifications?limit=${limit}`),
  markRead: (id: string) => api.put(`/api/notifications/${id}/read`),
  markAllRead: () => api.put('/api/notifications/read-all'),
  remove: (id: string) => api.delete(`/api/notifications/${id}`),
};
