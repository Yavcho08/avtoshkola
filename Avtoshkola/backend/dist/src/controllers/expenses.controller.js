"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.create = exports.getSummary = exports.list = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
// GET /api/expenses  (admin only)
const list = async (req, res) => {
    const { page, limit, offset } = (0, response_1.parsePagination)(req.query);
    const { category, from, to } = req.query;
    let query = supabase_1.supabase
        .from('expenses')
        .select('*', { count: 'exact' });
    if (category)
        query = query.eq('category', category);
    if (from)
        query = query.gte('expense_date', from);
    if (to)
        query = query.lte('expense_date', to);
    const { data, count, error } = await query
        .order('expense_date', { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendPaginated)(res, data ?? [], count ?? 0, page, limit);
};
exports.list = list;
// GET /api/expenses/summary  (admin only)
// Returns total per category and grand total for a given date range.
const getSummary = async (req, res) => {
    const { from, to } = req.query;
    let query = supabase_1.supabase.from('expenses').select('amount, category');
    if (from)
        query = query.gte('expense_date', from);
    if (to)
        query = query.lte('expense_date', to);
    const { data, error } = await query;
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    const categories = [
        'vehicle_maintenance', 'fuel', 'salaries', 'rent', 'other',
    ];
    const byCategory = Object.fromEntries(categories.map(cat => [
        cat,
        (data ?? []).filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
    ]));
    const total = (data ?? []).reduce((s, e) => s + Number(e.amount), 0);
    (0, response_1.sendSuccess)(res, { byCategory, total });
};
exports.getSummary = getSummary;
// POST /api/expenses  (admin only)
const create = async (req, res) => {
    const { description, amount, expense_date, category } = req.body;
    if (!description || !amount || !expense_date || !category) {
        (0, response_1.sendError)(res, 'description, amount, expense_date and category are required.', 422);
        return;
    }
    const { data, error } = await supabase_1.supabase
        .from('expenses')
        .insert({
        description,
        amount: Number(amount),
        expense_date,
        category,
    })
        .select('*')
        .single();
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 201);
};
exports.create = create;
// PATCH /api/expenses/:id  (admin only)
const update = async (req, res) => {
    const { id } = req.params;
    const { description, amount, expense_date, category } = req.body;
    const updates = {};
    if (description !== undefined)
        updates.description = description;
    if (amount !== undefined)
        updates.amount = Number(amount);
    if (expense_date !== undefined)
        updates.expense_date = expense_date;
    if (category !== undefined)
        updates.category = category;
    const { data, error } = await supabase_1.supabase
        .from('expenses').update(updates).eq('id', id).select('*').single();
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.update = update;
// DELETE /api/expenses/:id  (admin only)
const remove = async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase_1.supabase.from('expenses').delete().eq('id', id);
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, null, 200, 'Expense deleted.');
};
exports.remove = remove;
//# sourceMappingURL=expenses.controller.js.map