"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchedule = exports.update = exports.create = exports.getById = exports.list = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
// GET /api/instructors  (admin only)
const list = async (req, res) => {
    const { page, limit, offset } = (0, response_1.parsePagination)(req.query);
    const { is_active } = req.query;
    let query = supabase_1.supabase
        .from('instructors')
        .select('*, profiles!inner(*)', { count: 'exact' });
    if (is_active !== undefined)
        query = query.eq('is_active', is_active === 'true');
    const { data, count, error } = await query
        .order('is_active', { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendPaginated)(res, data ?? [], count ?? 0, page, limit);
};
exports.list = list;
// GET /api/instructors/:id  (admin or self)
const getById = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const { data, error } = await supabase_1.supabase
        .from('instructors')
        .select('*, profiles(*), student_categories(*, students(*, profiles(*)), categories(*))')
        .eq('id', id)
        .single();
    if (error || !data) {
        (0, response_1.sendError)(res, 'Instructor not found.', 404);
        return;
    }
    // Instructors can only view their own record
    if (user.role === 'instructor' && data.profile_id !== user.id) {
        (0, response_1.sendError)(res, 'Access denied.', 403);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.getById = getById;
// POST /api/instructors  (admin only)
const create = async (req, res) => {
    const { email, password, first_name, last_name, phone, license_number } = req.body;
    if (!email || !password || !first_name || !last_name || !license_number) {
        (0, response_1.sendError)(res, 'email, password, first_name, last_name and license_number are required.', 422);
        return;
    }
    const { data: authData, error: authError } = await supabase_1.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });
    if (authError) {
        (0, response_1.sendError)(res, authError.message, 400);
        return;
    }
    const userId = authData.user.id;
    const { error: profileError } = await supabase_1.supabase.from('profiles').upsert({
        id: userId,
        role: 'instructor',
        first_name,
        last_name,
        phone: phone ?? null,
    });
    if (profileError) {
        await supabase_1.supabase.auth.admin.deleteUser(userId);
        (0, response_1.sendError)(res, profileError.message, 500);
        return;
    }
    const { data: instructor, error: instructorError } = await supabase_1.supabase
        .from('instructors')
        .insert({
        profile_id: userId,
        license_number,
        is_active: true,
    })
        .select('*, profiles(*)')
        .single();
    if (instructorError) {
        await supabase_1.supabase.auth.admin.deleteUser(userId);
        (0, response_1.sendError)(res, instructorError.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, instructor, 201, 'Instructor created successfully.');
};
exports.create = create;
// PATCH /api/instructors/:id  (admin only)
const update = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, phone, license_number, is_active } = req.body;
    const { data: existing, error: fetchError } = await supabase_1.supabase
        .from('instructors').select('profile_id').eq('id', id).single();
    if (fetchError || !existing) {
        (0, response_1.sendError)(res, 'Instructor not found.', 404);
        return;
    }
    const profileUpdates = {};
    if (first_name !== undefined)
        profileUpdates.first_name = first_name;
    if (last_name !== undefined)
        profileUpdates.last_name = last_name;
    if (phone !== undefined)
        profileUpdates.phone = phone;
    if (Object.keys(profileUpdates).length > 0) {
        const { error } = await supabase_1.supabase.from('profiles').update(profileUpdates).eq('id', existing.profile_id);
        if (error) {
            (0, response_1.sendError)(res, error.message, 500);
            return;
        }
    }
    const instructorUpdates = {};
    if (license_number !== undefined)
        instructorUpdates.license_number = license_number;
    if (is_active !== undefined)
        instructorUpdates.is_active = is_active;
    if (Object.keys(instructorUpdates).length > 0) {
        const { error } = await supabase_1.supabase.from('instructors').update(instructorUpdates).eq('id', id);
        if (error) {
            (0, response_1.sendError)(res, error.message, 500);
            return;
        }
    }
    const { data, error } = await supabase_1.supabase
        .from('instructors').select('*, profiles(*)').eq('id', id).single();
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.update = update;
// GET /api/instructors/:id/schedule  (admin or self)
const getSchedule = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const { from, to } = req.query;
    const { data: instructor, error: instructorError } = await supabase_1.supabase
        .from('instructors').select('id, profile_id').eq('id', id).single();
    if (instructorError || !instructor) {
        (0, response_1.sendError)(res, 'Instructor not found.', 404);
        return;
    }
    if (user.role === 'instructor' && instructor.profile_id !== user.id) {
        (0, response_1.sendError)(res, 'Access denied.', 403);
        return;
    }
    let query = supabase_1.supabase
        .from('lessons')
        .select('*, students(*, profiles(*)), vehicles(*)')
        .eq('instructor_id', id)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true });
    if (from)
        query = query.gte('start_time', from);
    if (to)
        query = query.lte('start_time', to);
    const { data, error } = await query;
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.getSchedule = getSchedule;
//# sourceMappingURL=instructors.controller.js.map