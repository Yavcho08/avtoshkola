import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  status = 200,
  message?: string
): void => {
  const body: ApiResponse<T> = { data, error: null, ...(message !== undefined && { message }) };
  res.status(status).json(body);
};

export const sendError = (res: Response, error: string, status = 400): void => {
  const body: ApiResponse<null> = { data: null, error };
  res.status(status).json(body);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
): void => {
  const body: PaginatedResponse<T> = { data, total, page, limit, error: null };
  res.json(body);
};

export const parsePagination = (
  query: Record<string, string | undefined>
): { page: number; limit: number; offset: number } => {
  const page = Math.max(1, parseInt((query.page as string) ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt((query.limit as string) ?? '20', 10)));
  return { page, limit, offset: (page - 1) * limit };
};

// Wraps an async controller so unhandled rejections reach Express's error handler.
type AsyncFn = (req: Request, res: Response) => Promise<void>;
export const wrap = (fn: AsyncFn): RequestHandler =>
  (req, res, next) => fn(req, res).catch(next);
