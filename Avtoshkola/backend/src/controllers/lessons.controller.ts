import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError, sendPaginated, parsePagination } from '../utils/response';
import { LessonInsert } from '../types';

// Overlap: [a_start, a_end) ∩ [b_start, b_end) ≠ ∅  ⟺  a_start < b_end AND a_end > b_start
const detectConflict = async (
  instructorId: string,
  studentId: string,
  startTime: string,
  endTime: string,
  vehicleId?: string | null,
  excludeId?: string
): Promise<string | null> => {
  const orParts = [
    `instructor_id.eq.${instructorId}`,
    `student_id.eq.${studentId}`,
    ...(vehicleId ? [`vehicle_id.eq.${vehicleId}`] : []),
  ];

  let query = supabase
    .from('lessons')
    .select('id, instructor_id, student_id, vehicle_id')
    .neq('status', 'cancelled')
    .lt('start_time', endTime)
    .gt('end_time', startTime)
    .or(orParts.join(','));

  if (excludeId) query = query.neq('id', excludeId);

  const { data, error } = await query;
  if (error) return 'Error checking schedule conflicts.';
  if (!data?.length) return null;

  if (data.some(l => l.instructor_id === instructorId)) return 'Instructor already has a lesson at this time.';
  if (data.some(l => l.student_id === studentId)) return 'Student already has a lesson at this time.';
  if (vehicleId && data.some(l => l.vehicle_id === vehicleId)) return 'Vehicle is already booked at this time.';

  return 'Scheduling conflict detected.';
};

// GET /api/lessons
export const list = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { page, limit, offset } = parsePagination(req.query as Record<string, string>);
  const { type, status, from, to, student_id, instructor_id } = req.query as Record<string, string>;

  let query = supabase
    .from('lessons')
    .select('*, students(*, profiles(*)), instructors(*, profiles(*)), vehicles(*)', { count: 'exact' });

  // Role-based scope enforcement
  if (user.role === 'instructor') {
    const { data: instructor } = await supabase
      .from('instructors').select('id').eq('profile_id', user.id).single();
    if (!instructor) { sendError(res, 'Instructor record not found.', 404); return; }
    query = query.eq('instructor_id', instructor.id);
  } else if (user.role === 'student') {
    const { data: student } = await supabase
      .from('students').select('id').eq('profile_id', user.id).single();
    if (!student) { sendError(res, 'Student record not found.', 404); return; }
    query = query.eq('student_id', student.id);
  } else {
    // Admin: optional filters
    if (student_id) query = query.eq('student_id', student_id);
    if (instructor_id) query = query.eq('instructor_id', instructor_id);
  }

  if (type) query = query.eq('type', type);
  if (status) query = query.eq('status', status);
  if (from) query = query.gte('start_time', from);
  if (to) query = query.lte('start_time', to);

  const { data, count, error } = await query
    .order('start_time', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) { sendError(res, error.message, 500); return; }
  sendPaginated(res, data ?? [], count ?? 0, page, limit);
};

// POST /api/lessons  (admin, instructor, or student self-booking)
export const create = async (req: Request, res: Response): Promise<void> => {
  let { student_id, instructor_id, vehicle_id, type, start_time, end_time, location } = req.body;

  // Instructors can only create lessons for themselves
  if (req.user!.role === 'instructor') {
    const { data: self } = await supabase
      .from('instructors').select('id').eq('profile_id', req.user!.id).single();
    if (!instructor_id && self) {
      instructor_id = self.id;
    } else if (self?.id !== instructor_id) {
      sendError(res, 'Instructors can only schedule their own lessons.', 403); return;
    }
  }

  // Students always book for themselves
  if (req.user!.role === 'student') {
    const { data: self } = await supabase
      .from('students').select('id').eq('profile_id', req.user!.id).single();
    if (!self) { sendError(res, 'Записът за курсист не е намерен.', 404); return; }
    student_id = self.id;
  }

  if (!student_id || !instructor_id || !type || !start_time || !end_time) {
    sendError(res, 'student_id, instructor_id, type, start_time and end_time are required.', 422); return;
  }
  if (new Date(end_time) <= new Date(start_time)) {
    sendError(res, 'end_time must be after start_time.', 422); return;
  }

  const conflict = await detectConflict(instructor_id, student_id, start_time, end_time, vehicle_id);
  if (conflict) { sendError(res, conflict, 409); return; }

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      student_id,
      instructor_id,
      vehicle_id: vehicle_id ?? null,
      type,
      start_time,
      end_time,
      location: location?.trim() || null,
      status: 'scheduled',
      instructor_notes: null,
      grade: null,
    } satisfies LessonInsert)
    .select('*, students(*, profiles(*)), instructors(*, profiles(*)), vehicles(*)')
    .single();

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data, 201);
};

// PATCH /api/lessons/:id  (admin or instructor)
export const update = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, instructor_notes, grade, start_time, end_time, vehicle_id, location } = req.body;
  const user = req.user!;

  const { data: existing, error: fetchError } = await supabase
    .from('lessons').select('*').eq('id', id).single();

  if (fetchError || !existing) { sendError(res, 'Lesson not found.', 404); return; }

  // Instructors can only update their own lessons
  if (user.role === 'instructor') {
    const { data: self } = await supabase
      .from('instructors').select('id').eq('profile_id', user.id).single();
    if (self?.id !== existing.instructor_id) {
      sendError(res, 'Access denied.', 403); return;
    }
  }

  // If rescheduling, check for conflicts again (exclude current lesson)
  if (start_time || end_time) {
    const newStart = start_time ?? existing.start_time;
    const newEnd = end_time ?? existing.end_time;
    if (new Date(newEnd) <= new Date(newStart)) {
      sendError(res, 'end_time must be after start_time.', 422); return;
    }
    const conflict = await detectConflict(
      existing.instructor_id,
      existing.student_id,
      newStart,
      newEnd,
      vehicle_id ?? existing.vehicle_id,
      id
    );
    if (conflict) { sendError(res, conflict, 409); return; }
  }

  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (instructor_notes !== undefined) updates.instructor_notes = instructor_notes;
  if (grade !== undefined) updates.grade = grade;
  if (start_time !== undefined) updates.start_time = start_time;
  if (end_time !== undefined) updates.end_time = end_time;
  if (vehicle_id !== undefined) updates.vehicle_id = vehicle_id;
  if (location !== undefined) updates.location = location?.trim() || null;

  const { data, error } = await supabase
    .from('lessons').update(updates).eq('id', id)
    .select('*, students(*, profiles(*)), instructors(*, profiles(*)), vehicles(*)')
    .single();

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data);
};

// DELETE /api/lessons/:id  — soft cancel  (admin or instructor)
export const cancel = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  const { data: existing, error: fetchError } = await supabase
    .from('lessons').select('instructor_id, status').eq('id', id).single();

  if (fetchError || !existing) { sendError(res, 'Lesson not found.', 404); return; }
  if (existing.status === 'cancelled') { sendError(res, 'Lesson is already cancelled.', 400); return; }

  if (user.role === 'instructor') {
    const { data: self } = await supabase
      .from('instructors').select('id').eq('profile_id', user.id).single();
    if (self?.id !== existing.instructor_id) {
      sendError(res, 'Access denied.', 403); return;
    }
  }

  const { error } = await supabase.from('lessons').update({ status: 'cancelled' }).eq('id', id);
  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, null, 200, 'Lesson cancelled.');
};
