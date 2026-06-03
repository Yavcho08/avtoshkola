import { Request, Response } from 'express';
export declare const adminStats: (_req: Request, res: Response) => Promise<void>;
export declare const instructorStats: (req: Request, res: Response) => Promise<void>;
export declare const studentStats: (req: Request, res: Response) => Promise<void>;
