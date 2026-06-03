"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.create = exports.getById = exports.getExpiring = exports.list = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
// GET /api/vehicles
const list = async (req, res) => {
    const { page, limit, offset } = (0, response_1.parsePagination)(req.query);
    const { status, category_id } = req.query;
    let query = supabase_1.supabase
        .from('vehicles')
        .select('*, categories(*)', { count: 'exact' });
    if (status)
        query = query.eq('status', status);
    if (category_id)
        query = query.eq('category_id', category_id);
    const { data, count, error } = await query
        .order('registration_number', { ascending: true })
        .range(offset, offset + limit - 1);
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendPaginated)(res, data ?? [], count ?? 0, page, limit);
};
exports.list = list;
// GET /api/vehicles/expiring  — GTP expiring within next 30 days OR already expired
// NOTE: This route must be registered BEFORE /:id to avoid "expiring" being parsed as an id.
const getExpiring = async (req, res) => {
    const { days = '30' } = req.query;
    const daysAhead = Math.min(365, Math.max(1, parseInt(days, 10)));
    const today = new Date();
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() + daysAhead);
    const { data, error } = await supabase_1.supabase
        .from('vehicles')
        .select('*, categories(*)')
        .lte('technical_inspection_date', cutoff.toISOString().split('T')[0])
        .neq('status', 'retired')
        .order('technical_inspection_date', { ascending: true });
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    // Tag each vehicle so the frontend can show "expired" vs "expiring soon"
    const todayStr = today.toISOString().split('T')[0];
    const tagged = (data ?? []).map(v => ({
        ...v,
        gtp_expired: v.technical_inspection_date < todayStr,
    }));
    (0, response_1.sendSuccess)(res, tagged);
};
exports.getExpiring = getExpiring;
// GET /api/vehicles/:id
const getById = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase_1.supabase
        .from('vehicles').select('*, categories(*)').eq('id', id).single();
    if (error || !data) {
        (0, response_1.sendError)(res, 'Vehicle not found.', 404);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.getById = getById;
// POST /api/vehicles  (admin only)
const create = async (req, res) => {
    const { registration_number, make, model, category_id, technical_inspection_date } = req.body;
    if (!registration_number || !make || !model || !category_id || !technical_inspection_date) {
        (0, response_1.sendError)(res, 'registration_number, make, model, category_id and technical_inspection_date are required.', 422);
        return;
    }
    const { data, error } = await supabase_1.supabase
        .from('vehicles')
        .insert({
        registration_number,
        make,
        model,
        category_id,
        technical_inspection_date,
        status: 'active',
    })
        .select('*, categories(*)')
        .single();
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 201);
};
exports.create = create;
// PATCH /api/vehicles/:id  (admin only)
const update = async (req, res) => {
    const { id } = req.params;
    const { registration_number, make, model, category_id, technical_inspection_date, status } = req.body;
    const updates = {};
    if (registration_number !== undefined)
        updates.registration_number = registration_number;
    if (make !== undefined)
        updates.make = make;
    if (model !== undefined)
        updates.model = model;
    if (category_id !== undefined)
        updates.category_id = category_id;
    if (technical_inspection_date !== undefined)
        updates.technical_inspection_date = technical_inspection_date;
    if (status !== undefined)
        updates.status = status;
    const { data, error } = await supabase_1.supabase
        .from('vehicles').update(updates).eq('id', id)
        .select('*, categories(*)').single();
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.update = update;
//# sourceMappingURL=vehicles.controller.js.map