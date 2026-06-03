import { Request, Response } from 'express';
export declare const list: (req: Request, res: Response) => Promise<void>;
export declare const getById: (req: Request, res: Response) => Promise<void>;
export declare const create: (req: Request, res: Response) => Promise<void>;
export declare const update: (req: Request, res: Response) => Promise<void>;
export declare const getProgress: (req: Request, res: Response) => Promise<void>;
export declare const getExams: (req: Request, res: Response) => Promise<void>;
export declare const getPayments: (req: Request, res: Response) => Promise<void>;
