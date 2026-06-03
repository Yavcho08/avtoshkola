import { Request, Response } from 'express';
export declare const list: (req: Request, res: Response) => Promise<void>;
export declare const create: (req: Request, res: Response) => Promise<void>;
export declare const update: (req: Request, res: Response) => Promise<void>;
export declare const cancel: (req: Request, res: Response) => Promise<void>;
