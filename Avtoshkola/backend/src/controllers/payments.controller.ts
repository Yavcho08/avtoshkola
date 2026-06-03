import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { stripe } from '../config/stripe';
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

// POST /api/payments/create-checkout-session
export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  const { payment_id } = req.body;
  const user = req.user!;

  if (!payment_id) {
    sendError(res, 'payment_id е задължително.', 422);
    return;
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*, students(id, profile_id)')
    .eq('id', payment_id)
    .single();

  if (paymentError || !payment) {
    sendError(res, 'Плащането не е намерено.', 404);
    return;
  }

  if (user.role === 'student' && (payment as any).students?.profile_id !== user.id) {
    sendError(res, 'Нямате достъп до това плащане.', 403);
    return;
  }

  if (payment.status === 'paid') {
    sendError(res, 'Плащането вече е платено.', 400);
    return;
  }

  const TYPE_LABELS: Record<string, string> = {
    installment:    'Вноска за обучение',
    full_course:    'Пълен курс за обучение',
    extra_hours:    'Допълнителни учебни часове',
    state_exam_fee: 'Такса за изпит към ДАИ',
  };

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: TYPE_LABELS[payment.type] ?? payment.type,
          description: 'Автошкола — онлайн плащане',
        },
        unit_amount: Math.round(Number(payment.amount) * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${frontendUrl}/student/payments?success=true&session_id={CHECKOUT_SESSION_ID}&payment_id=${payment_id}`,
    cancel_url:  `${frontendUrl}/student/payments?cancelled=true`,
    metadata: { payment_id },
  });

  sendSuccess(res, { url: session.url, session_id: session.id });
};

// POST /api/payments/confirm-payment
export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
  const { session_id, payment_id } = req.body;

  if (!session_id || !payment_id) {
    sendError(res, 'session_id и payment_id са задължителни.', 422);
    return;
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    sendError(res, 'Невалидна сесия за плащане.', 400);
    return;
  }

  if (session.metadata?.payment_id !== payment_id) {
    sendError(res, 'Несъответствие на данните за плащане.', 400);
    return;
  }

  if (session.payment_status !== 'paid') {
    sendError(res, 'Плащането не е завършено.', 400);
    return;
  }

  const { data: existing } = await supabase
    .from('payments').select('status').eq('id', payment_id).single();

  if (existing?.status === 'paid') {
    const { data } = await supabase
      .from('payments').select('*, students(*, profiles(*))').eq('id', payment_id).single();
    sendSuccess(res, data);
    return;
  }

  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'paid',
      payment_date: new Date().toISOString().split('T')[0],
      invoice_number: `STRIPE-${(session.payment_intent as string ?? session.id).slice(-12).toUpperCase()}`,
    })
    .eq('id', payment_id)
    .select('*, students(*, profiles(*))')
    .single();

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data);
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
