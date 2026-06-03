import { Request, Response, RequestHandler } from 'express';
export declare const sendSuccess: <T>(res: Response, data: T, status?: number, message?: string) => void;
export declare const sendError: (res: Response, error: string, status?: number) => void;
export declare const sendPaginated: <T>(res: Response, data: T[], total: number, page: number, limit: number) => void;
export declare const parsePagination: (query: Record<string, string | undefined>) => {
    page: number;
    limit: number;
    offset: number;
};
type AsyncFn = (req: Request, res: Response) => Promise<void>;
export declare const wrap: (fn: AsyncFn) => RequestHandler;
export {};
