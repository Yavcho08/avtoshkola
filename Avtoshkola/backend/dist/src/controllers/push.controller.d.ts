import { Request, Response } from 'express';
export declare const getVapidPublicKey: (_req: Request, res: Response) => void;
export declare const subscribe: (req: Request, res: Response) => Promise<void>;
export declare const unsubscribe: (req: Request, res: Response) => Promise<void>;
