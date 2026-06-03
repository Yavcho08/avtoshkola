"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.confirmPayment = exports.createCheckoutSession = exports.create = exports.getSummary = exports.list = void 0;
const supabase_1 = require("../config/supabase");
const stripe_1 = require("../config/stripe");
const response_1 = require("../utils/response");
// GET /api/payments
const list = async (req, res) => {
    const user = req.user;
    const { page, limit, offset } = (0, response_1.parsePagination)(req.query);
    const { student_id, status, type } = req.query;
    let query = supabase_1.supabase
        .from('payments')
        .select('*, students(*, profiles(*))', { count: 'exact' });
    // Students see only their own payments
    if (user.role === 'student') {
        const { data: self } = await supabase_1.supabase
            .from('students').select('id').eq('profile_id', user.id).single();
        if (!self) {
            (0, response_1.sendError)(res, 'Student record not found.', 404);
            return;
        }
        query = query.eq('student_id', self.id);
    }
    else {
        if (student_id)
            query = query.eq('student_id', student_id);
    }
    if (status)
        query = query.eq('status', status);
    if (type)
        query = query.eq('type', type);
    const { data, count, error } = await query
        .order('due_date', { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendPaginated)(res, data ?? [], count ?? 0, page, limit);
};
exports.list = list;
// GET /api/payments/summary  (admin only)
// NOTE: Register this route before /:id.
const getSummary = async (_req, res) => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString().split('T')[0];
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString().split('T')[0];
    const [allPayments, monthlyPaid, expensesRes] = await Promise.all([
        supabase_1.supabase.from('payments').select('amount, status'),
        supabase_1.supabase.from('payments').select('amount').eq('status', 'paid')
            .gte('payment_date', startOfMonth).lte('payment_date', endOfMonth),
        supabase_1.supabase.from('expenses').select('amount')
            .gte('expense_date', startOfMonth).lte('expense_date', endOfMonth),
    ]);
    if (allPayments.error) {
        (0, response_1.sendError)(res, allPayments.error.message, 500);
        return;
    }
    const payments = allPayments.data ?? [];
    const totalRevenue = payments.filter(p => p.status === 'paid')
        .reduce((s, p) => s + Number(p.amount), 0);
    const pendingPayments = payments.filter(p => p.status === 'pending')
        .reduce((s, p) => s + Number(p.amount), 0);
    const overduePayments = payments.filter(p => p.status === 'overdue')
        .reduce((s, p) => s + Number(p.amount), 0);
    const monthlyRevenue = (monthlyPaid.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
    const monthlyExpenses = (expensesRes.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
    const summary = {
        totalRevenue,
        totalExpenses: monthlyExpenses,
        netProfit: monthlyRevenue - monthlyExpenses,
        pendingPayments,
        overduePayments,
        monthlyRevenue,
        monthlyExpenses,
    };
    (0, response_1.sendSuccess)(res, summary);
};
exports.getSummary = getSummary;
// POST /api/payments  (admin only)
const create = async (req, res) => {
    const { student_id, amount, type, due_date } = req.body;
    if (!student_id || !amount || !type || !due_date) {
        (0, response_1.sendError)(res, 'student_id, amount, type and due_date are required.', 422);
        return;
    }
    const { data, error } = await supabase_1.supabase
        .from('payments')
        .insert({
        student_id,
        amount: Number(amount),
        type,
        status: 'pending',
        due_date,
        payment_date: null,
        invoice_number: null,
    })
        .select('*, students(*, profiles(*))')
        .single();
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 201);
};
exports.create = create;
// POST /api/payments/create-checkout-session  (student for own, admin for any)
const createCheckoutSession = async (req, res) => {
    const { payment_id } = req.body;
    const user = req.user;
    if (!payment_id) {
        (0, response_1.sendError)(res, 'payment_id е задължително.', 422);
        return;
    }
    const { data: payment, error: paymentError } = await supabase_1.supabase
        .from('payments')
        .select('*, students(id, profile_id)')
        .eq('id', payment_id)
        .single();
    if (paymentError || !payment) {
        (0, response_1.sendError)(res, 'Плащането не е намерено.', 404);
        return;
    }
    // Students can only pay their own payments
    if (user.role === 'student' && payment.students?.profile_id !== user.id) {
        (0, response_1.sendError)(res, 'Нямате достъп до това плащане.', 403);
        return;
    }
    if (payment.status === 'paid') {
        (0, response_1.sendError)(res, 'Плащането вече е платено.', 400);
        return;
    }
    const TYPE_LABELS = {
        installment: 'Вноска за обучение',
        full_course: 'Пълен курс за обучение',
        extra_hours: 'Допълнителни учебни часове',
        state_exam_fee: 'Такса за изпит към ДАИ',
    };
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const session = await stripe_1.stripe.checkout.sessions.create({
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
        cancel_url: `${frontendUrl}/student/payments?cancelled=true`,
        metadata: { payment_id },
    });
    (0, response_1.sendSuccess)(res, { url: session.url, session_id: session.id });
};
exports.createCheckoutSession = createCheckoutSession;
// POST /api/payments/confirm-payment  (student for own, admin for any)
const confirmPayment = async (req, res) => {
    const { session_id, payment_id } = req.body;
    if (!session_id || !payment_id) {
        (0, response_1.sendError)(res, 'session_id и payment_id са задължителни.', 422);
        return;
    }
    let session;
    try {
        session = await stripe_1.stripe.checkout.sessions.retrieve(session_id);
    }
    catch {
        (0, response_1.sendError)(res, 'Невалидна сесия за плащане.', 400);
        return;
    }
    if (session.metadata?.payment_id !== payment_id) {
        (0, response_1.sendError)(res, 'Несъответствие на данните за плащане.', 400);
        return;
    }
    if (session.payment_status !== 'paid') {
        (0, response_1.sendError)(res, 'Плащането не е завършено.', 400);
        return;
    }
    // Idempotent — return existing data if already marked paid
    const { data: existing } = await supabase_1.supabase
        .from('payments').select('status').eq('id', payment_id).single();
    if (existing?.status === 'paid') {
        const { data } = await supabase_1.supabase
            .from('payments').select('*, students(*, profiles(*))').eq('id', payment_id).single();
        (0, response_1.sendSuccess)(res, data);
        return;
    }
    const { data, error } = await supabase_1.supabase
        .from('payments')
        .update({
        status: 'paid',
        payment_date: new Date().toISOString().split('T')[0],
        invoice_number: `STRIPE-${(session.payment_intent ?? session.id).slice(-12).toUpperCase()}`,
    })
        .eq('id', payment_id)
        .select('*, students(*, profiles(*))')
        .single();
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.confirmPayment = confirmPayment;
// PATCH /api/payments/:id  (admin only)
const update = async (req, res) => {
    const { id } = req.params;
    const { status, payment_date, invoice_number, amount, due_date } = req.body;
    const updates = {};
    if (status !== undefined)
        updates.status = status;
    if (payment_date !== undefined)
        updates.payment_date = payment_date;
    if (invoice_number !== undefined)
        updates.invoice_number = invoice_number;
    if (amount !== undefined)
        updates.amount = Number(amount);
    if (due_date !== undefined)
        updates.due_date = due_date;
    // Auto-set payment_date when marking as paid
    if (status === 'paid' && !payment_date) {
        updates.payment_date = new Date().toISOString().split('T')[0];
    }
    const { data, error } = await supabase_1.supabase
        .from('payments').update(updates).eq('id', id)
        .select('*, students(*, profiles(*))')
        .single();
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.update = update;
//# sourceMappingURL=payments.controller.js.map