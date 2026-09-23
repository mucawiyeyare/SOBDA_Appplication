import { api } from './client';
import type { BloodType } from '../types';

export interface SavedLocation {
  hasLocation: boolean;
  location?: { latitude: number; longitude: number; address: string };
}

export interface NearDonor {
  _id: string;
  name: string;
  phone: string;
  email: string;
  bloodType?: BloodType;
  location?: string;
  address?: string;
  distance: number;
  coordinates: { latitude: number; longitude: number };
}

export const geoApi = {
  myLocation: () => api.get<SavedLocation>('/api/geolocation/my-location'),
  setLocation: (body: { latitude: number; longitude: number; address?: string }) =>
    api.post<{ message: string }>('/api/geolocation/set-location', body),
  nearest: (body: { latitude: number; longitude: number; radius: number; bloodType?: string }) =>
    api.post<{ donors: NearDonor[] }>('/api/geolocation/nearest-donors', body),
};
