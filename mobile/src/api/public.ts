import { api } from './client';
import type { ChatMessage, Doctor, Partner, PublicReport, Thread } from '../types/models';

export const publicApi = {
  report: () => api.get<PublicReport>('/api/users/public-report'),
  doctors: () => api.get<Doctor[]>('/api/doctors'),
  partners: () => api.get<Partner[]>('/api/partners'),
  contact: (body: { fullName: string; email: string; phone?: string; subject: string; message: string; urgency?: string }) =>
    api.post<{ message: string }>('/api/contact', body),
};

// Donor <-> doctor chat. Donors use /thread, doctors use /inbox.
export const consultApi = {
  unread: () => api.get<{ count: number }>('/api/consult/unread-count'),
  donorThreads: () => api.get<Thread[]>('/api/consult/my-threads'),
  donorThread: (doctorId: string) =>
    api.get<{ doctor: { name: string; specialty?: string }; messages: ChatMessage[] }>(`/api/consult/thread/${doctorId}`),
  donorSend: (doctorId: string, text: string) => api.post<ChatMessage>(`/api/consult/thread/${doctorId}`, { text }),
  doctorInbox: () => api.get<Thread[]>('/api/consult/inbox'),
  doctorThread: (donorId: string) =>
    api.get<{ donor: { name: string; bloodType?: string }; messages: ChatMessage[] }>(`/api/consult/inbox/${donorId}`),
  doctorSend: (donorId: string, text: string) => api.post<ChatMessage>(`/api/consult/inbox/${donorId}`, { text }),
};
