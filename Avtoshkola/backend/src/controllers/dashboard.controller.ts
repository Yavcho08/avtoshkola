import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/dashboard/admin
export const adminStats = async (_req: Request, res: Response): Promise<void> => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().split('T')[0];
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString().split('T')[0];
  const todayIso = today.toISOString();

  const [
    totalStudents,
    activeStudents,
    activeInstructors,
    activeVehicles,
    revenueRes,
    expensesRes,
    upcomingExams,
    overduePayments,
  ] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact', head: true }),
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('instructors').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('payments').select('amount').eq('status', 'paid')
      .gte('payment_date', startOfMonth).lte('payment_date', endOfMonth),
    supabase.from('expenses').select('amount')
      .gte('expense_date', startOfMonth).lte('expense_date', endOfMonth),
    supabase.from('exams').select('id', { count: 'exact', head: true })
      .eq('status', 'scheduled').gte('exam_date', todayIso),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'overdue'),
  ]);

  if (revenueRes.error) { sendError(res, revenueRes.error.message, 500); return; }

  const monthlyRevenue = (revenueRes.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const monthlyExpenses = (expensesRes.data ?? []).reduce((s, e) => s + Number(e.amount), 0);

  sendSuccess(res, {
    totalStudents: totalStudents.count ?? 0,
    activeStudents: activeStudents.count ?? 0,
    activeInstructors: activeInstructors.count ?? 0,
    activeVehicles: activeVehicles.count ?? 0,
    monthlyRevenue,
    monthlyExpenses,
    netProfit: monthlyRevenue - monthlyExpenses,
    upcomingExams: upcomingExams.count ?? 0,
    overduePayments: overduePayments.count ?? 0,
  });
};

// GET /api/dashboard/instructor
export const instructorStats = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  const { data: instructor, error: instructorError } = await supabase
    .from('instructors').select('id').eq('profile_id', user.id).single();

  if (instructorError || !instructor) {
    sendError(res, 'Instructor record not found.', 404); return;
  }

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const [upcoming, completedThisMonth, assignedStudents] = await Promise.all([
    supabase.from('lessons').select('id', { count: 'exact', head: true })
      .eq('instructor_id', instructor.id)
      .eq('status', 'scheduled')
      .gte('start_time', today.toISOString()),
    supabase.from('lessons').select('id', { count: 'exact', head: true })
      .eq('instructor_id', instructor.id)
      .eq('status', 'completed')
      .gte('start_time', startOfMonth),
    supabase.from('student_categories').select('student_id', { count: 'exact', head: true })
      .eq('instructor_id', instructor.id),
  ]);

  // Next 5 upcoming lessons with student info
  const { data: nextLessons } = await supabase
    .from('lessons')
    .select('*, students(*, profiles(*)), vehicles(*)')
    .eq('instructor_id', instructor.id)
    .eq('status', 'scheduled')
    .gte('start_time', today.toISOString())
    .order('start_time', { ascending: true })
    .limit(5);

  sendSuccess(res, {
    upcomingLessons: upcoming.count ?? 0,
    completedThisMonth: completedThisMonth.count ?? 0,
    studentsCount: assignedStudents.count ?? 0,
    nextLessons: nextLessons ?? [],
  });
};

// GET /api/dashboard/student
export const studentStats = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;

  const { data: student, error: studentError } = await supabase
    .from('students').select('id, status').eq('profile_id', user.id).single();

  if (studentError || !student) {
    sendError(res, 'Student record not found.', 404); return;
  }

  const today = new Date().toISOString();

  const [lessonsRes, examsRes, paymentsRes, nextLessons, nextExams] = await Promise.all([
    supabase.from('lessons').select('type, start_time, end_time').eq('student_id', student.id).eq('status', 'completed'),
    supabase.from('exams').select('status').eq('student_id', student.id),
    supabase.from('payments').select('amount, status').eq('student_id', student.id),
    supabase.from('lessons')
      .select('*, instructors(*, profiles(*)), vehicles(*)')
      .eq('student_id', student.id).eq('status', 'scheduled')
      .gte('start_time', today).order('start_time', { ascending: true }).limit(3),
    supabase.from('exams')
      .select('*')
      .eq('student_id', student.id).eq('status', 'scheduled')
      .gte('exam_date', today).order('exam_date', { ascending: true }).limit(3),
  ]);

  const lessons = lessonsRes.data ?? [];
  const exams = examsRes.data ?? [];
  const payments = paymentsRes.data ?? [];

  const calcHours = (ls: Array<{ start_time: string; end_time: string }>) =>
    +ls.reduce((sum, l) => {
      return sum + (new Date(l.end_time).getTime() - new Date(l.start_time).getTime()) / 3_600_000;
    }, 0).toFixed(1);

  sendSuccess(res, {
    studentStatus: student.status,
    completedTheoryHours: calcHours(lessons.filter(l => (l as { type: string }).type === 'theory')),
    completedPracticeHours: calcHours(lessons.filter(l => (l as { type: string }).type === 'practice')),
    requiredTheoryHours: 9,
    requiredPracticeHours: 31,
    examsPassed: exams.filter(e => e.status === 'passed').length,
    examsFailed: exams.filter(e => e.status === 'failed').length,
    totalPaid: payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0),
    totalOwed: payments.filter(p => p.status !== 'paid').reduce((s, p) => s + Number(p.amount), 0),
    nextLessons: nextLessons.data ?? [],
    nextExams: nextExams.data ?? [],
  });
};
