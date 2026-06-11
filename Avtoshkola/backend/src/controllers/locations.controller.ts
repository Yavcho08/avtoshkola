import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

const VALID_TYPES = ['maneuvers', 'intersection', 'parking', 'highway', 'other'];

// GET /api/locations — всеки автентикиран потребител вижда местата
export const list = async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('practice_locations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data ?? []);
};

// POST /api/locations — само admin/instructor добавя
export const create = async (req: Request, res: Response): Promise<void> => {
  const { name, description, type, lat, lng } = req.body as {
    name?: string; description?: string; type?: string; lat?: number; lng?: number;
  };

  if (!name?.trim()) { sendError(res, 'Името е задължително.'); return; }
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    sendError(res, 'Невалидни координати.'); return;
  }
  const safeType = VALID_TYPES.includes(type ?? '') ? type : 'other';

  const { data, error } = await supabase
    .from('practice_locations')
    .insert({
      name: name.trim(),
      description: description?.trim() ?? '',
      type: safeType,
      lat,
      lng,
      created_by: req.user!.id,
    })
    .select()
    .single();

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data, 201);
};

// DELETE /api/locations/:id — само admin/instructor трие
export const remove = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { error } = await supabase
    .from('practice_locations')
    .delete()
    .eq('id', id);

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, { id });
};
