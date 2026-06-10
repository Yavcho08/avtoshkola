import { apiClient } from './client';

export interface ExamQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  pictureUrl?: string;
}

export interface ExamResult {
  id: string;
  score: number;
  total: number;
  feedback: string;
  wrongQuestions: (ExamQuestion & { chosen: number })[];
}

export interface ExamHistory {
  id: string;
  score: number;
  feedback: string;
  created_at: string;
}

const d = (res: any) => res.data?.data ?? res.data;

export const examSimApi = {
  generate: () =>
    apiClient.get('/exam-sim/generate').then(d) as Promise<{ questions: ExamQuestion[]; remaining: number }>,
  submit: (questions: ExamQuestion[], answers: number[]) =>
    apiClient.post('/exam-sim/submit', { questions, answers }).then(d) as Promise<ExamResult>,
  getHistory: () =>
    apiClient.get('/exam-sim/history').then((res: any) => ({
      history: d(res) as ExamHistory[],
      remaining: res.data?.remaining ?? 3,
    })),
};
