import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, LessonWithRelations } from '../types';

interface LessonListParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
  student_id?: string;
  instructor_id?: string;
}

interface CreateLessonPayload {
  student_id: string;
  instructor_id: string;
  vehicle_id?: string | null;
  type: string;
  start_time: string;
  end_time: string;
}

interface UpdateLessonPayload {
  status?: string;
  instructor_notes?: string;
  grade?: number | null;
  start_time?: string;
  end_time?: string;
  vehicle_id?: string | null;
}

export const lessonsApi = {
  list: async (params: LessonListParams = {}): Promise<PaginatedResponse<LessonWithRelations>> => {
    const { data } = await apiClient.get<PaginatedResponse<LessonWithRelations>>('/lessons', { params });
    return data;
  },

  create: async (payload: CreateLessonPayload): Promise<LessonWithRelations> => {
    const { data } = await apiClient.post<ApiResponse<LessonWithRelations>>('/lessons', payload);
    return data.data!;
  },

  update: async (id: string, payload: UpdateLessonPayload): Promise<LessonWithRelations> => {
    const { data } = await apiClient.patch<ApiResponse<LessonWithRelations>>(`/lessons/${id}`, payload);
    return data.data!;
  },

  cancel: async (id: string): Promise<void> => {
    await apiClient.delete(`/lessons/${id}`);
  },
};
