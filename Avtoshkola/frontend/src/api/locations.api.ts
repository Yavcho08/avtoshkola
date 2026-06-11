import { apiClient } from './client';

export type LocationType = 'maneuvers' | 'intersection' | 'parking' | 'highway' | 'other';

export interface PracticeLocation {
  id: string;
  name: string;
  description: string;
  type: LocationType;
  lat: number;
  lng: number;
  created_by: string;
  created_at: string;
}

export interface NewLocation {
  name: string;
  description: string;
  type: LocationType;
  lat: number;
  lng: number;
}

const d = (res: any) => res.data?.data ?? res.data;

export const locationsApi = {
  list: () =>
    apiClient.get('/locations').then(d) as Promise<PracticeLocation[]>,
  create: (loc: NewLocation) =>
    apiClient.post('/locations', loc).then(d) as Promise<PracticeLocation>,
  remove: (id: string) =>
    apiClient.delete(`/locations/${id}`).then(d),
};
