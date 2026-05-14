import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError, sendPaginated, parsePagination } from '../utils/response';
import { VehicleInsert } from '../types';

// GET /api/vehicles
export const list = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, offset } = parsePagination(req.query as Record<string, string>);
  const { status, category_id } = req.query as Record<string, string>;

  let query = supabase
    .from('vehicles')
    .select('*, categories(*)', { count: 'exact' });

  if (status) query = query.eq('status', status);
  if (category_id) query = query.eq('category_id', category_id);

  const { data, count, error } = await query
    .order('registration_number', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) { sendError(res, error.message, 500); return; }
  sendPaginated(res, data ?? [], count ?? 0, page, limit);
};

// GET /api/vehicles/expiring  — GTP expiring within next 30 days OR already expired
// NOTE: This route must be registered BEFORE /:id to avoid "expiring" being parsed as an id.
export const getExpiring = async (req: Request, res: Response): Promise<void> => {
  const { days = '30' } = req.query as Record<string, string>;
  const daysAhead = Math.min(365, Math.max(1, parseInt(days, 10)));

  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('vehicles')
    .select('*, categories(*)')
    .lte('technical_inspection_date', cutoff.toISOString().split('T')[0])
    .neq('status', 'retired')
    .order('technical_inspection_date', { ascending: true });

  if (error) { sendError(res, error.message, 500); return; }

  // Tag each vehicle so the frontend can show "expired" vs "expiring soon"
  const todayStr = today.toISOString().split('T')[0];
  const tagged = (data ?? []).map(v => ({
    ...v,
    gtp_expired: v.technical_inspection_date < todayStr,
  }));

  sendSuccess(res, tagged);
};

// GET /api/vehicles/:id
export const getById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('vehicles').select('*, categories(*)').eq('id', id).single();

  if (error || !data) { sendError(res, 'Vehicle not found.', 404); return; }
  sendSuccess(res, data);
};

// POST /api/vehicles  (admin only)
export const create = async (req: Request, res: Response): Promise<void> => {
  const { registration_number, make, model, category_id, technical_inspection_date } = req.body;

  if (!registration_number || !make || !model || !category_id || !technical_inspection_date) {
    sendError(res, 'registration_number, make, model, category_id and technical_inspection_date are required.', 422);
    return;
  }

  const { data, error } = await supabase
    .from('vehicles')
    .insert({
      registration_number,
      make,
      model,
      category_id,
      technical_inspection_date,
      status: 'active',
    } satisfies VehicleInsert)
    .select('*, categories(*)')
    .single();

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data, 201);
};

// PATCH /api/vehicles/:id  (admin only)
export const update = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { registration_number, make, model, category_id, technical_inspection_date, status } = req.body;

  const updates: Record<string, unknown> = {};
  if (registration_number !== undefined) updates.registration_number = registration_number;
  if (make !== undefined) updates.make = make;
  if (model !== undefined) updates.model = model;
  if (category_id !== undefined) updates.category_id = category_id;
  if (technical_inspection_date !== undefined) updates.technical_inspection_date = technical_inspection_date;
  if (status !== undefined) updates.status = status;

  const { data, error } = await supabase
    .from('vehicles').update(updates).eq('id', id)
    .select('*, categories(*)').single();

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data);
};
