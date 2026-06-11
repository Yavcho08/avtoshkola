import { Request, Response } from 'express';
export declare const getRecipients: (_req: Request, res: Response) => Promise<void>;
export declare const send: (req: Request, res: Response) => Promise<void>;
