import { apiClient } from './client';
import { ApiResponse, PaginatedResponse, PaymentWithStudent, FinancialSummary } from '../types';

interface PaymentListParams { page?: number; limit?: number; student_id?: string; status?: string; type?: string; }

interface CreatePaymentPayload {
  student_id: string;
  amount: number;
  type: string;
  due_date: string;
}

interface UpdatePaymentPayload {
  status?: string;
  payment_date?: string;
  invoice_number?: string;
  amount?: number;
  due_date?: string;
}

interface FullFinancialSummary extends FinancialSummary {
  monthlyRevenue: number;
  monthlyExpenses: number;
}

interface CheckoutSessionResponse {
  url: string;
  session_id: string;
}

export const stripeApi = {
  createCheckoutSession: async (payment_id: string): Promise<CheckoutSessionResponse> => {
    const { data } = await apiClient.post<ApiResponse<CheckoutSessionResponse>>(
      '/payments/create-checkout-session',
      { payment_id }
    );
    return data.data!;
  },

  confirmPayment: async (session_id: string, payment_id: string): Promise<PaymentWithStudent> => {
    const { data } = await apiClient.post<ApiResponse<PaymentWithStudent>>(
      '/payments/confirm-payment',
      { session_id, payment_id }
    );
    return data.data!;
  },
};

export const paymentsApi = {
  list: async (params: PaymentListParams = {}): Promise<PaginatedResponse<PaymentWithStudent>> => {
    const { data } = await apiClient.get<PaginatedResponse<PaymentWithStudent>>('/payments', { params });
    return data;
  },

  getSummary: async (): Promise<FullFinancialSummary> => {
    const { data } = await apiClient.get<ApiResponse<FullFinancialSummary>>('/payments/summary');
    return data.data!;
  },

  create: async (payload: CreatePaymentPayload): Promise<PaymentWithStudent> => {
    const { data } = await apiClient.post<ApiResponse<PaymentWithStudent>>('/payments', payload);
    return data.data!;
  },

  update: async (id: string, payload: UpdatePaymentPayload): Promise<PaymentWithStudent> => {
    const { data } = await apiClient.patch<ApiResponse<PaymentWithStudent>>(`/payments/${id}`, payload);
    return data.data!;
  },
};
