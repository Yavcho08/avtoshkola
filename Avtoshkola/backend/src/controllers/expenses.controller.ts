import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError, sendPaginated, parsePagination } from '../utils/response';
import { ExpenseInsert, ExpenseCategory } from '../types';

// GET /api/expenses  (admin only)
export const list = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, offset } = parsePagination(req.query as Record<string, string>);
  const { category, from, to } = req.query as Record<string, string>;

  let query = supabase
    .from('expenses')
    .select('*', { count: 'exact' });

  if (category) query = query.eq('category', category);
  if (from) query = query.gte('expense_date', from);
  if (to) query = query.lte('expense_date', to);

  const { data, count, error } = await query
    .order('expense_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) { sendError(res, error.message, 500); return; }
  sendPaginated(res, data ?? [], count ?? 0, page, limit);
};

// GET /api/expenses/summary  (admin only)
// Returns total per category and grand total for a given date range.
export const getSummary = async (req: Request, res: Response): Promise<void> => {
  const { from, to } = req.query as Record<string, string>;

  let query = supabase.from('expenses').select('amount, category');
  if (from) query = query.gte('expense_date', from);
  if (to) query = query.lte('expense_date', to);

  const { data, error } = await query;
  if (error) { sendError(res, error.message, 500); return; }

  const categories: ExpenseCategory[] = [
    'vehicle_maintenance', 'fuel', 'salaries', 'rent', 'other',
  ];

  const byCategory = Object.fromEntries(
    categories.map(cat => [
      cat,
      (data ?? []).filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
    ])
  );

  const total = (data ?? []).reduce((s, e) => s + Number(e.amount), 0);

  sendSuccess(res, { byCategory, total });
};

// POST /api/expenses  (admin only)
export const create = async (req: Request, res: Response): Promise<void> => {
  const { description, amount, expense_date, category } = req.body;

  if (!description || !amount || !expense_date || !category) {
    sendError(res, 'description, amount, expense_date and category are required.', 422); return;
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      description,
      amount: Number(amount),
      expense_date,
      category,
    } satisfies ExpenseInsert)
    .select('*')
    .single();

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data, 201);
};

// PATCH /api/expenses/:id  (admin only)
export const update = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { description, amount, expense_date, category } = req.body;

  const updates: Record<string, unknown> = {};
  if (description !== undefined) updates.description = description;
  if (amount !== undefined) updates.amount = Number(amount);
  if (expense_date !== undefined) updates.expense_date = expense_date;
  if (category !== undefined) updates.category = category;

  const { data, error } = await supabase
    .from('expenses').update(updates).eq('id', id).select('*').single();

  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, data);
};

// DELETE /api/expenses/:id  (admin only)
export const remove = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) { sendError(res, error.message, 500); return; }
  sendSuccess(res, null, 200, 'Expense deleted.');
};
