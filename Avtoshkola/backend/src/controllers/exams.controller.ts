import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError, sendPaginated, parsePagination } from '../utils/response';
import { ExamInsert } from '../types';

// GET /api/exams
export const list = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { page, limit, offset } = parsePagination(req.query as Record<string, string>);
  const { type, status, student_id, from, to } = req.query as Record<string, string>;

  let query = supabase
    .from('exams')
    .select('*, students(*, profiles(*))', { count: 'exact' });

  if (user.role === 'student') {
    const { data: self } = await supabase
      .from('students').select('id').eq('profile_id', user.id).single();
    if (!self) { sendError(res, 'Student record not found.', 404); return; }
    query = query.eq('student_id', self.id);
  } else if (user.role === 'instructor') {
    // Instructors see exams of students assigned to them
    const { data: instructor } = await supabase
      .from('instructors').select('id').eq('profile_id', user.id).single();
    if (!instructor) { sendError(res, 'Instructor record not found.', 404); return; }

    const { data: assignedStudents } = await supabase
      .from('student_categories').select('student_id').eq('instructor_id', instructor.id);

    const studentIds = assignedStudents?.map(s => s.student_id) ?? [];
    if (studentIds.length === 0) { sendPaginated(res, [], 0, page, limit); return; }
    query = query.in('student_id', studentIds);
  } else {
    if (student_id) query = query.eq('student_id', student_id);
  }

  if (type) query = query.eq('type', type);
  if (status) query = query.eq('status', status);
  if (from) query = query.gte('exam_date', from);
  if (to) query = query.lte('exam_date', to);

  const { data, count, error } = await query
    .order('exam_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) { sendError(res, error.message, 500); return; }
  sendPaginated(res, data ?? [], count ?? 0, page, limit);
};

// POST /api/exams  (admin only)
export const create = async (req: Request, res: Response): Promise<void> => {
  const { student_id, type, exam_date } = req.body;

  if (!student_id || !type || !exam_date) {
    sendError(res, 'student_id, type and exam_date are required.', 422); return;
  }

  const { data, error } = await supabase
    .from('exams')
    .insert({ student_id, type, exam_date, status: 'scheduled', score: null } satisfies ExamInsert)
    .select('*, students(*, profiles(*))')
    .single();

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data, 201);
};

// PATCH /api/exams/:id  (admin only — records result after the exam)
export const update = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, score, exam_date } = req.body;

  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (score !== undefined) updates.score = score;
  if (exam_date !== undefined) updates.exam_date = exam_date;

  const { data, error } = await supabase
    .from('exams').update(updates).eq('id', id)
    .select('*, students(*, profiles(*))')
    .single();

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data);
};
