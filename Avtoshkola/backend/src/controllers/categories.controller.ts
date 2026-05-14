import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

export const list = async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });

  if (error) {
    sendError(res, error.message, 500);
    return;
  }
  sendSuccess(res, data);
};
