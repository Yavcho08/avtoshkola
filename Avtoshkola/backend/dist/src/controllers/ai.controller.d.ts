import { Request, Response } from 'express';
export declare const ai: {
    ask(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getHistory(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
};
