import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, InstructorWithProfile, LessonWithRelations } from '../types';

interface CreateInstructorPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  license_number: string;
}

interface UpdateInstructorPayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  license_number?: string;
  is_active?: boolean;
}

interface ScheduleParams { from?: string; to?: string; }

export const instructorsApi = {
  list: async (params: { page?: number; limit?: number; is_active?: boolean } = {}): Promise<PaginatedResponse<InstructorWithProfile>> => {
    const { data } = await apiClient.get<PaginatedResponse<InstructorWithProfile>>('/instructors', { params });
    return data;
  },

  getById: async (id: string): Promise<InstructorWithProfile> => {
    const { data } = await apiClient.get<ApiResponse<InstructorWithProfile>>(`/instructors/${id}`);
    return data.data!;
  },

  create: async (payload: CreateInstructorPayload): Promise<InstructorWithProfile> => {
    const { data } = await apiClient.post<ApiResponse<InstructorWithProfile>>('/instructors', payload);
    return data.data!;
  },

  update: async (id: string, payload: UpdateInstructorPayload): Promise<InstructorWithProfile> => {
    const { data } = await apiClient.patch<ApiResponse<InstructorWithProfile>>(`/instructors/${id}`, payload);
    return data.data!;
  },

  getSchedule: async (id: string, params: ScheduleParams = {}): Promise<LessonWithRelations[]> => {
    const { data } = await apiClient.get<ApiResponse<LessonWithRelations[]>>(`/instructors/${id}/schedule`, { params });
    return data.data!;
  },
};
