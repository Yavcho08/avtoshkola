import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireInstructor: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireStudent: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdminOrInstructor: (req: Request, res: Response, next: NextFunction) => void;
