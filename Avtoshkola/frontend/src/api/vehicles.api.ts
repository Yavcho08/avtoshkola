import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, VehicleWithCategory } from '../types';

interface VehicleListParams { page?: number; limit?: number; status?: string; category_id?: string; }

interface CreateVehiclePayload {
  registration_number: string;
  make: string;
  model: string;
  category_id: string;
  technical_inspection_date: string;
}

interface UpdateVehiclePayload {
  registration_number?: string;
  make?: string;
  model?: string;
  category_id?: string;
  technical_inspection_date?: string;
  status?: string;
}

type ExpiringVehicle = VehicleWithCategory & { gtp_expired: boolean };

export const vehiclesApi = {
  list: async (params: VehicleListParams = {}): Promise<PaginatedResponse<VehicleWithCategory>> => {
    const { data } = await apiClient.get<PaginatedResponse<VehicleWithCategory>>('/vehicles', { params });
    return data;
  },

  getExpiring: async (days = 30): Promise<ExpiringVehicle[]> => {
    const { data } = await apiClient.get<ApiResponse<ExpiringVehicle[]>>('/vehicles/expiring', { params: { days } });
    return data.data!;
  },

  getById: async (id: string): Promise<VehicleWithCategory> => {
    const { data } = await apiClient.get<ApiResponse<VehicleWithCategory>>(`/vehicles/${id}`);
    return data.data!;
  },

  create: async (payload: CreateVehiclePayload): Promise<VehicleWithCategory> => {
    const { data } = await apiClient.post<ApiResponse<VehicleWithCategory>>('/vehicles', payload);
    return data.data!;
  },

  update: async (id: string, payload: UpdateVehiclePayload): Promise<VehicleWithCategory> => {
    const { data } = await apiClient.patch<ApiResponse<VehicleWithCategory>>(`/vehicles/${id}`, payload);
    return data.data!;
  },
};
