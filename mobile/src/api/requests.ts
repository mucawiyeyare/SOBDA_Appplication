import { api } from './client';
import type { BloodType } from '../types';
import type {
  Donation,
  DonorRequest,
  DonorRow,
  DonorStats,
  LeaderboardEntry,
  PatientInfo,
  RequestStatus,
  Urgency,
} from '../types/models';

export interface DonorFilters {
  search?: string;
  bloodType?: BloodType | '';
  status?: string;
  gender?: string;
}

const clean = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== undefined));

export const requestsApi = {
  // donor
  donorRequests: (status?: RequestStatus) => api.get<DonorRequest[]>('/api/requests/donor', { params: clean({ status }) }),
  respond: (id: string, body: { response: 'accept' | 'decline'; availabilityTime?: string; declineReason?: string }) =>
    api.put(`/api/requests/${id}/respond`, body),
  donorDonations: () => api.get<Donation[]>('/api/requests/donor-donations'),
  myStats: () => api.get<DonorStats>('/api/requests/my-stats'),

  // hospital / admin
  hospitalRequests: (status?: RequestStatus) =>
    api.get<DonorRequest[]>('/api/requests/hospital', { params: clean({ status }) }),
  markArrived: (id: string) => api.put(`/api/requests/${id}/arrived`),
  markCompleted: (id: string, body: { volume: number; notes?: string }) => api.put(`/api/requests/${id}/complete`, body),
  cancel: (id: string) => api.delete(`/api/requests/${id}`),
  cancelBatch: (batchId: string) => api.delete(`/api/requests/batch/${batchId}`),
  create: (body: {
    donorId: string;
    bloodType: BloodType;
    urgency: Urgency;
    message?: string;
    patientInfo?: PatientInfo;
  }) => api.post<{ message: string }>('/api/requests/create', body),
  createBatch: (body: { donorIds: string[]; bloodType: BloodType; urgency: Urgency; message?: string }) =>
    api.post<{ message: string; count: number; skipped: { reason: string }[] }>('/api/requests/create-batch', body),
  hospitalDonations: () => api.get<Donation[]>('/api/requests/hospital-donations'),
  donors: (f: DonorFilters = {}) => api.get<DonorRow[]>('/api/users/donors', { params: clean({ ...f }) }),

  // public
  leaderboard: () => api.get<LeaderboardEntry[]>('/api/requests/leaderboard'),
};
