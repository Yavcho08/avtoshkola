import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, Expense, ExpenseCategory } from '../types';

interface ExpenseListParams { page?: number; limit?: number; category?: string; from?: string; to?: string; }
interface CreateExpensePayload { description: string; amount: number; expense_date: string; category: ExpenseCategory; }
interface UpdateExpensePayload { description?: string; amount?: number; expense_date?: string; category?: ExpenseCategory; }

interface ExpenseSummary {
  byCategory: Record<ExpenseCategory, number>;
  total: number;
}

export const expensesApi = {
  list: async (params: ExpenseListParams = {}): Promise<PaginatedResponse<Expense>> => {
    const { data } = await apiClient.get<PaginatedResponse<Expense>>('/expenses', { params });
    return data;
  },

  getSummary: async (params: { from?: string; to?: string } = {}): Promise<ExpenseSummary> => {
    const { data } = await apiClient.get<ApiResponse<ExpenseSummary>>('/expenses/summary', { params });
    return data.data!;
  },

  create: async (payload: CreateExpensePayload): Promise<Expense> => {
    const { data } = await apiClient.post<ApiResponse<Expense>>('/expenses', payload);
    return data.data!;
  },

  update: async (id: string, payload: UpdateExpensePayload): Promise<Expense> => {
    const { data } = await apiClient.patch<ApiResponse<Expense>>(`/expenses/${id}`, payload);
    return data.data!;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
  },
};
