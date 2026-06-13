import { apiClient } from './client';

export interface ReferralEntry {
  id: string;
  referred_name: string;
  created_at: string;
}

export interface MyReferral {
  code: string;
  count: number;
  referrals: ReferralEntry[];
}

const d = (res: any) => res.data?.data ?? res.data;

export const referralsApi = {
  getMine: () => apiClient.get('/referrals/me').then(d) as Promise<MyReferral>,
};
