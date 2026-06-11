import { Request, Response } from 'express';
export interface ExamQuestion {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
    pictureUrl?: string;
}
export declare const examSim: {
    generate(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    submit(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getHistory(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
