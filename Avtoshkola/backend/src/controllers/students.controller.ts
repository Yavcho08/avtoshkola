import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError, sendPaginated, parsePagination } from '../utils/response';
import { StudentInsert, ProfileInsert } from '../types';

// GET /api/students
export const list = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, offset } = parsePagination(req.query as Record<string, string>);
  const { status, search } = req.query as Record<string, string>;

  let query = supabase
    .from('students')
    .select('*, profiles!inner(*)', { count: 'exact' });

  if (status) query = query.eq('status', status);

  if (search) {
    query = query.or(
      `egn.ilike.%${search}%,profiles.first_name.ilike.%${search}%,profiles.last_name.ilike.%${search}%`
    );
  }

  const { data, count, error } = await query
    .order('registration_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) { sendError(res, error.message, 500); return; }

  sendPaginated(res, data ?? [], count ?? 0, page, limit);
};

// GET /api/students/:id
export const getById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  const { data: student, error } = await supabase
    .from('students')
    .select('*, profiles(*), student_categories(*, categories(*), instructors(*, profiles(*)))')
    .eq('id', id)
    .single();

  if (error || !student) { sendError(res, 'Student not found.', 404); return; }

  if (user.role === 'student' && student.profile_id !== user.id) {
    sendError(res, 'Access denied.', 403); return;
  }

  if (user.role === 'instructor') {
    const { data: instructor } = await supabase
      .from('instructors').select('id').eq('profile_id', user.id).single();

    const isAssigned = (student.student_categories as Array<{ instructor_id: string }>)
      ?.some(sc => sc.instructor_id === instructor?.id);

    if (!isAssigned) { sendError(res, 'Access denied.', 403); return; }
  }

  sendSuccess(res, student);
};

// POST /api/students  (admin only)
export const create = async (req: Request, res: Response): Promise<void> => {
  const { email, password, first_name, last_name, phone, egn, registration_date } = req.body;

  if (!email || !password || !first_name || !last_name || !egn) {
    sendError(res, 'email, password, first_name, last_name and egn are required.', 422); return;
  }
  if (!/^\d{10}$/.test(egn)) {
    sendError(res, 'EGN must be exactly 10 digits.', 422); return;
  }

  // 1 — Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) { sendError(res, authError.message, 400); return; }

  const userId = authData.user.id;

  // 2 — Create profile
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    role: 'student',
    first_name,
    last_name,
    phone: phone ?? null,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    sendError(res, profileError.message, 500); return;
  }

  // 3 — Create student record
  const { data: student, error: studentError } = await supabase
    .from('students')
    .insert({
      profile_id: userId,
      egn,
      registration_date: registration_date ?? new Date().toISOString().split('T')[0],
      status: 'active',
    } satisfies StudentInsert)
    .select('*, profiles(*)')
    .single();

  if (studentError) {
    await supabase.auth.admin.deleteUser(userId);
    sendError(res, studentError.message, 500); return;
  }

  sendSuccess(res, student, 201, 'Student created successfully.');
};

// PATCH /api/students/:id  (admin only)
export const update = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { first_name, last_name, phone, status, egn } = req.body;

  const { data: existing, error: fetchError } = await supabase
    .from('students').select('profile_id').eq('id', id).single();

  if (fetchError || !existing) { sendError(res, 'Student not found.', 404); return; }

  if (egn !== undefined && !/^\d{10}$/.test(egn)) {
    sendError(res, 'EGN must be exactly 10 digits.', 422); return;
  }

  const profileUpdates: Record<string, unknown> = {};
  if (first_name !== undefined) profileUpdates.first_name = first_name;
  if (last_name !== undefined) profileUpdates.last_name = last_name;
  if (phone !== undefined) profileUpdates.phone = phone;

  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await supabase.from('profiles').update(profileUpdates).eq('id', existing.profile_id);
    if (error) { sendError(res, error.message, 500); return; }
  }

  const studentUpdates: Record<string, unknown> = {};
  if (status !== undefined) studentUpdates.status = status;
  if (egn !== undefined) studentUpdates.egn = egn;

  if (Object.keys(studentUpdates).length > 0) {
    const { error } = await supabase.from('students').update(studentUpdates).eq('id', id);
    if (error) { sendError(res, error.message, 500); return; }
  }

  const { data, error } = await supabase
    .from('students').select('*, profiles(*)').eq('id', id).single();

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data);
};

// GET /api/students/:id/progress
export const getProgress = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  // Students can only see their own progress
  if (user.role === 'student') {
    const { data: self } = await supabase
      .from('students').select('id').eq('profile_id', user.id).single();
    if (self?.id !== id) { sendError(res, 'Access denied.', 403); return; }
  }

  const [lessonsRes, examsRes, paymentsRes] = await Promise.all([
    supabase.from('lessons').select('type, start_time, end_time').eq('student_id', id).eq('status', 'completed'),
    supabase.from('exams').select('status').eq('student_id', id),
    supabase.from('payments').select('amount, status').eq('student_id', id),
  ]);

  if (lessonsRes.error) { sendError(res, lessonsRes.error.message, 500); return; }

  const calcHours = (ls: Array<{ start_time: string; end_time: string }>) =>
    ls.reduce((sum, l) => {
      const hrs = (new Date(l.end_time).getTime() - new Date(l.start_time).getTime()) / 3_600_000;
      return sum + hrs;
    }, 0);

  const lessons = lessonsRes.data ?? [];
  const exams = examsRes.data ?? [];
  const payments = paymentsRes.data ?? [];

  sendSuccess(res, {
    completedTheoryHours: +calcHours(lessons.filter(l => (l as { type: string }).type === 'theory')).toFixed(1),
    completedPracticeHours: +calcHours(lessons.filter(l => (l as { type: string }).type === 'practice')).toFixed(1),
    requiredTheoryHours: 9,   // Bulgarian Наредба № 37 minimum
    requiredPracticeHours: 31, // Bulgarian Наредба № 37 minimum
    examsPassed: exams.filter(e => e.status === 'passed').length,
    examsFailed: exams.filter(e => e.status === 'failed').length,
    totalPaid: payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0),
    totalOwed: payments.filter(p => p.status !== 'paid').reduce((s, p) => s + Number(p.amount), 0),
  });
};

// GET /api/students/:id/exams
export const getExams = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('exams').select('*').eq('student_id', id).order('exam_date', { ascending: false });

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data);
};

// GET /api/students/:id/payments
export const getPayments = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('payments').select('*').eq('student_id', id).order('due_date', { ascending: false });

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data);
};
