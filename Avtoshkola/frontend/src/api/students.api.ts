import { apiClient } from './client';
import {
  ApiResponse,
  PaginatedResponse,
  StudentWithProfile,
  StudentProgressSummary,
  Exam,
  Payment,
} from '../types';

interface StudentListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

interface CreateStudentPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  egn: string;
  registration_date?: string;
}

interface UpdateStudentPayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  status?: string;
  egn?: string;
}

export const studentsApi = {
  list: async (params: StudentListParams = {}): Promise<PaginatedResponse<StudentWithProfile>> => {
    const { data } = await apiClient.get<PaginatedResponse<StudentWithProfile>>('/students', { params });
    return data;
  },

  getById: async (id: string): Promise<StudentWithProfile> => {
    const { data } = await apiClient.get<ApiResponse<StudentWithProfile>>(`/students/${id}`);
    return data.data!;
  },

  create: async (payload: CreateStudentPayload): Promise<StudentWithProfile> => {
    const { data } = await apiClient.post<ApiResponse<StudentWithProfile>>('/students', payload);
    return data.data!;
  },

  update: async (id: string, payload: UpdateStudentPayload): Promise<StudentWithProfile> => {
    const { data } = await apiClient.patch<ApiResponse<StudentWithProfile>>(`/students/${id}`, payload);
    return data.data!;
  },

  getProgress: async (id: string): Promise<StudentProgressSummary> => {
    const { data } = await apiClient.get<ApiResponse<StudentProgressSummary>>(`/students/${id}/progress`);
    return data.data!;
  },

  getExams: async (id: string): Promise<Exam[]> => {
    const { data } = await apiClient.get<ApiResponse<Exam[]>>(`/students/${id}/exams`);
    return data.data!;
  },

  getPayments: async (id: string): Promise<Payment[]> => {
    const { data } = await apiClient.get<ApiResponse<Payment[]>>(`/students/${id}/payments`);
    return data.data!;
  },
};
