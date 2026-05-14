import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';

// GET /api/auth/me
// Returns the authenticated user's profile (already hydrated by authMiddleware).
export const me = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, req.user);
};
