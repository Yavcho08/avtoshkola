import { Request, Response } from 'express';
export declare const getContacts: (req: Request, res: Response) => Promise<void>;
export declare const getMessages: (req: Request, res: Response) => Promise<void>;
export declare const sendMessage: (req: Request, res: Response) => Promise<void>;
export declare const markRead: (req: Request, res: Response) => Promise<void>;
export declare const unreadCount: (req: Request, res: Response) => Promise<void>;
