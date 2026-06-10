import { apiClient } from './client';

const d = (res: any) => res.data?.data ?? res.data;

export const aiApi = {
  ask: (question: string) =>
    apiClient.post('/ai/ask', { question }).then(d) as Promise<{ answer: string; remaining: number }>,
  getHistory: () =>
    apiClient.get('/ai/history').then((res: any) => ({
      chats: d(res) as AiChat[],
      remaining: res.data?.remaining ?? 10,
    })),
};

export interface AiChat {
  id: string;
  profile_id: string;
  question: string;
  answer: string;
  created_at: string;
}
