import { apiClient } from './client';
import { ApiResponse, Category } from '../types';

export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<ApiResponse<Category[]>>('/categories');
    return data.data!;
  },
};
