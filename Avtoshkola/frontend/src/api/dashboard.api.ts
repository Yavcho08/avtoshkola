import { apiClient } from './client';
import { ApiResponse, AdminDashboardStats, StudentProgressSummary } from '../types';

interface InstructorDashboardStats {
  upcomingLessons: number;
  completedThisMonth: number;
  studentsCount: number;
  nextLessons: unknown[];
}

interface StudentDashboardStats extends StudentProgressSummary {
  studentStatus: string;
  nextLessons: unknown[];
  nextExams: unknown[];
}

export const dashboardApi = {
  admin: async (): Promise<AdminDashboardStats & { netProfit: number; overduePayments: number }> => {
    const { data } = await apiClient.get<ApiResponse<AdminDashboardStats & { netProfit: number; overduePayments: number }>>('/dashboard/admin');
    return data.data!;
  },

  instructor: async (): Promise<InstructorDashboardStats> => {
    const { data } = await apiClient.get<ApiResponse<InstructorDashboardStats>>('/dashboard/instructor');
    return data.data!;
  },

  student: async (): Promise<StudentDashboardStats> => {
    const { data } = await apiClient.get<ApiResponse<StudentDashboardStats>>('/dashboard/student');
    return data.data!;
  },
};
