import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, ExamWithStudent } from '../types';

interface ExamListParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  student_id?: string;
  from?: string;
  to?: string;
}

interface CreateExamPayload { student_id: string; type: string; exam_date: string; }
interface UpdateExamPayload { status?: string; score?: number | null; exam_date?: string; }

export const examsApi = {
  list: async (params: ExamListParams = {}): Promise<PaginatedResponse<ExamWithStudent>> => {
    const { data } = await apiClient.get<PaginatedResponse<ExamWithStudent>>('/exams', { params });
    return data;
  },

  create: async (payload: CreateExamPayload): Promise<ExamWithStudent> => {
    const { data } = await apiClient.post<ApiResponse<ExamWithStudent>>('/exams', payload);
    return data.data!;
  },

  update: async (id: string, payload: UpdateExamPayload): Promise<ExamWithStudent> => {
    const { data } = await apiClient.patch<ApiResponse<ExamWithStudent>>(`/exams/${id}`, payload);
    return data.data!;
  },
};
