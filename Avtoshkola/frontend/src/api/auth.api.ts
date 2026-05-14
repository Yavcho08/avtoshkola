import { apiClient } from './client';
import { AuthenticatedUser, ApiResponse } from '../types';

export const authApi = {
  me: async (): Promise<AuthenticatedUser> => {
    const { data } = await apiClient.get<ApiResponse<AuthenticatedUser>>('/auth/me');
    return data.data!;
  },
};
