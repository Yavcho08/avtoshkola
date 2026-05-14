import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError, sendPaginated, parsePagination } from '../utils/response';
import { PaymentInsert, FinancialSummary } from '../types';

// GET /api/payments
export const list = async (req: Request, res: Response): Promise<void> => {
  const user = req.user!;
  const { page, limit, offset } = parsePagination(req.query as Record<string, string>);
  const { student_id, status, type } = req.query as Record<string, string>;

  let query = supabase
    .from('payments')
    .select('*, students(*, profiles(*))', { count: 'exact' });

  // Students see only their own payments
  if (user.role === 'student') {
    const { data: self } = await supabase
      .from('students').select('id').eq('profile_id', user.id).single();
    if (!self) { sendError(res, 'Student record not found.', 404); return; }
    query = query.eq('student_id', self.id);
  } else {
    if (student_id) query = query.eq('student_id', student_id);
  }

  if (status) query = query.eq('status', status);
  if (type) query = query.eq('type', type);

  const { data, count, error } = await query
    .order('due_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) { sendError(res, error.message, 500); return; }
  sendPaginated(res, data ?? [], count ?? 0, page, limit);
};

// GET /api/payments/summary  (admin only)
// NOTE: Register this route before /:id.
export const getSummary = async (_req: Request, res: Response): Promise<void> => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().split('T')[0];
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString().split('T')[0];

  const [allPayments, monthlyPaid, expensesRes] = await Promise.all([
    supabase.from('payments').select('amount, status'),
    supabase.from('payments').select('amount').eq('status', 'paid')
      .gte('payment_date', startOfMonth).lte('payment_date', endOfMonth),
    supabase.from('expenses').select('amount')
      .gte('expense_date', startOfMonth).lte('expense_date', endOfMonth),
  ]);

  if (allPayments.error) { sendError(res, allPayments.error.message, 500); return; }

  const payments = allPayments.data ?? [];
  const totalRevenue = payments.filter(p => p.status === 'paid')
    .reduce((s, p) => s + Number(p.amount), 0);
  const pendingPayments = payments.filter(p => p.status === 'pending')
    .reduce((s, p) => s + Number(p.amount), 0);
  const overduePayments = payments.filter(p => p.status === 'overdue')
    .reduce((s, p) => s + Number(p.amount), 0);

  const monthlyRevenue = (monthlyPaid.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const monthlyExpenses = (expensesRes.data ?? []).reduce((s, e) => s + Number(e.amount), 0);

  const summary: FinancialSummary & { monthlyRevenue: number; monthlyExpenses: number } = {
    totalRevenue,
    totalExpenses: monthlyExpenses,
    netProfit: monthlyRevenue - monthlyExpenses,
    pendingPayments,
    overduePayments,
    monthlyRevenue,
    monthlyExpenses,
  };

  sendSuccess(res, summary);
};

// POST /api/payments  (admin only)
export const create = async (req: Request, res: Response): Promise<void> => {
  const { student_id, amount, type, due_date } = req.body;

  if (!student_id || !amount || !type || !due_date) {
    sendError(res, 'student_id, amount, type and due_date are required.', 422); return;
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      student_id,
      amount: Number(amount),
      type,
      status: 'pending',
      due_date,
      payment_date: null,
      invoice_number: null,
    } satisfies PaymentInsert)
    .select('*, students(*, profiles(*))')
    .single();

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data, 201);
};

// PATCH /api/payments/:id  (admin only)
export const update = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, payment_date, invoice_number, amount, due_date } = req.body;

  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (payment_date !== undefined) updates.payment_date = payment_date;
  if (invoice_number !== undefined) updates.invoice_number = invoice_number;
  if (amount !== undefined) updates.amount = Number(amount);
  if (due_date !== undefined) updates.due_date = due_date;

  // Auto-set payment_date when marking as paid
  if (status === 'paid' && !payment_date) {
    updates.payment_date = new Date().toISOString().split('T')[0];
  }

  const { data, error } = await supabase
    .from('payments').update(updates).eq('id', id)
    .select('*, students(*, profiles(*))')
    .single();

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data);
};
