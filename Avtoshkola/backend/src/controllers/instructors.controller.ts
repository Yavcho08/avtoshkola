import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError, sendPaginated, parsePagination } from '../utils/response';
import { ProfileInsert, InstructorInsert } from '../types';

// GET /api/instructors  (admin only)
export const list = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, offset } = parsePagination(req.query as Record<string, string>);
  const { is_active } = req.query as Record<string, string>;

  let query = supabase
    .from('instructors')
    .select('*, profiles!inner(*)', { count: 'exact' });

  if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');

  const { data, count, error } = await query
    .order('is_active', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) { sendError(res, error.message, 500); return; }
  sendPaginated(res, data ?? [], count ?? 0, page, limit);
};

// GET /api/instructors/:id  (admin or self)
export const getById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  const { data, error } = await supabase
    .from('instructors')
    .select('*, profiles(*), student_categories(*, students(*, profiles(*)), categories(*))')
    .eq('id', id)
    .single();

  if (error || !data) { sendError(res, 'Instructor not found.', 404); return; }

  // Instructors can only view their own record
  if (user.role === 'instructor' && data.profile_id !== user.id) {
    sendError(res, 'Access denied.', 403); return;
  }

  sendSuccess(res, data);
};

// POST /api/instructors  (admin only)
export const create = async (req: Request, res: Response): Promise<void> => {
  const { email, password, first_name, last_name, phone, license_number } = req.body;

  if (!email || !password || !first_name || !last_name || !license_number) {
    sendError(res, 'email, password, first_name, last_name and license_number are required.', 422); return;
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) { sendError(res, authError.message, 400); return; }

  const userId = authData.user.id;

  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    role: 'instructor',
    first_name,
    last_name,
    phone: phone ?? null,
  } satisfies ProfileInsert);

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    sendError(res, profileError.message, 500); return;
  }

  const { data: instructor, error: instructorError } = await supabase
    .from('instructors')
    .insert({
      profile_id: userId,
      license_number,
      is_active: true,
    } satisfies InstructorInsert)
    .select('*, profiles(*)')
    .single();

  if (instructorError) {
    await supabase.auth.admin.deleteUser(userId);
    sendError(res, instructorError.message, 500); return;
  }

  sendSuccess(res, instructor, 201, 'Instructor created successfully.');
};

// PATCH /api/instructors/:id  (admin only)
export const update = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { first_name, last_name, phone, license_number, is_active } = req.body;

  const { data: existing, error: fetchError } = await supabase
    .from('instructors').select('profile_id').eq('id', id).single();

  if (fetchError || !existing) { sendError(res, 'Instructor not found.', 404); return; }

  const profileUpdates: Record<string, unknown> = {};
  if (first_name !== undefined) profileUpdates.first_name = first_name;
  if (last_name !== undefined) profileUpdates.last_name = last_name;
  if (phone !== undefined) profileUpdates.phone = phone;

  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await supabase.from('profiles').update(profileUpdates).eq('id', existing.profile_id);
    if (error) { sendError(res, error.message, 500); return; }
  }

  const instructorUpdates: Record<string, unknown> = {};
  if (license_number !== undefined) instructorUpdates.license_number = license_number;
  if (is_active !== undefined) instructorUpdates.is_active = is_active;

  if (Object.keys(instructorUpdates).length > 0) {
    const { error } = await supabase.from('instructors').update(instructorUpdates).eq('id', id);
    if (error) { sendError(res, error.message, 500); return; }
  }

  const { data, error } = await supabase
    .from('instructors').select('*, profiles(*)').eq('id', id).single();

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data);
};

// GET /api/instructors/:id/schedule  (admin or self)
export const getSchedule = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;
  const { from, to } = req.query as Record<string, string>;

  const { data: instructor, error: instructorError } = await supabase
    .from('instructors').select('id, profile_id').eq('id', id).single();

  if (instructorError || !instructor) { sendError(res, 'Instructor not found.', 404); return; }

  if (user.role === 'instructor' && instructor.profile_id !== user.id) {
    sendError(res, 'Access denied.', 403); return;
  }

  let query = supabase
    .from('lessons')
    .select('*, students(*, profiles(*)), vehicles(*)')
    .eq('instructor_id', id)
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true });

  if (from) query = query.gte('start_time', from);
  if (to) query = query.lte('start_time', to);

  const { data, error } = await query;
  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data);
};
