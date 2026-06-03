"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayments = exports.getExams = exports.getProgress = exports.update = exports.create = exports.getById = exports.list = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
// GET /api/students
const list = async (req, res) => {
    const { page, limit, offset } = (0, response_1.parsePagination)(req.query);
    const { status, search } = req.query;
    let query = supabase_1.supabase
        .from('students')
        .select('*, profiles!inner(*)', { count: 'exact' });
    if (status)
        query = query.eq('status', status);
    if (search) {
        query = query.or(`egn.ilike.%${search}%,profiles.first_name.ilike.%${search}%,profiles.last_name.ilike.%${search}%`);
    }
    const { data, count, error } = await query
        .order('registration_date', { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendPaginated)(res, data ?? [], count ?? 0, page, limit);
};
exports.list = list;
// GET /api/students/:id
const getById = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const { data: student, error } = await supabase_1.supabase
        .from('students')
        .select('*, profiles(*), student_categories(*, categories(*), instructors(*, profiles(*)))')
        .eq('id', id)
        .single();
    if (error || !student) {
        (0, response_1.sendError)(res, 'Student not found.', 404);
        return;
    }
    if (user.role === 'student' && student.profile_id !== user.id) {
        (0, response_1.sendError)(res, 'Access denied.', 403);
        return;
    }
    if (user.role === 'instructor') {
        const { data: instructor } = await supabase_1.supabase
            .from('instructors').select('id').eq('profile_id', user.id).single();
        const isAssigned = student.student_categories
            ?.some(sc => sc.instructor_id === instructor?.id);
        if (!isAssigned) {
            (0, response_1.sendError)(res, 'Access denied.', 403);
            return;
        }
    }
    (0, response_1.sendSuccess)(res, student);
};
exports.getById = getById;
// POST /api/students  (admin only)
const create = async (req, res) => {
    const { email, password, first_name, last_name, phone, egn, registration_date } = req.body;
    if (!email || !password || !first_name || !last_name || !egn) {
        (0, response_1.sendError)(res, 'email, password, first_name, last_name and egn are required.', 422);
        return;
    }
    if (!/^\d{10}$/.test(egn)) {
        (0, response_1.sendError)(res, 'EGN must be exactly 10 digits.', 422);
        return;
    }
    // 1 — Create auth user
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
    // 2 — Create profile
    const { error: profileError } = await supabase_1.supabase.from('profiles').upsert({
        id: userId,
        role: 'student',
        first_name,
        last_name,
        phone: phone ?? null,
    });
    if (profileError) {
        await supabase_1.supabase.auth.admin.deleteUser(userId);
        (0, response_1.sendError)(res, profileError.message, 500);
        return;
    }
    // 3 — Create student record
    const { data: student, error: studentError } = await supabase_1.supabase
        .from('students')
        .insert({
        profile_id: userId,
        egn,
        registration_date: registration_date ?? new Date().toISOString().split('T')[0],
        status: 'active',
    })
        .select('*, profiles(*)')
        .single();
    if (studentError) {
        await supabase_1.supabase.auth.admin.deleteUser(userId);
        (0, response_1.sendError)(res, studentError.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, student, 201, 'Student created successfully.');
};
exports.create = create;
// PATCH /api/students/:id  (admin only)
const update = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, phone, status, egn } = req.body;
    const { data: existing, error: fetchError } = await supabase_1.supabase
        .from('students').select('profile_id').eq('id', id).single();
    if (fetchError || !existing) {
        (0, response_1.sendError)(res, 'Student not found.', 404);
        return;
    }
    if (egn !== undefined && !/^\d{10}$/.test(egn)) {
        (0, response_1.sendError)(res, 'EGN must be exactly 10 digits.', 422);
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
    const studentUpdates = {};
    if (status !== undefined)
        studentUpdates.status = status;
    if (egn !== undefined)
        studentUpdates.egn = egn;
    if (Object.keys(studentUpdates).length > 0) {
        const { error } = await supabase_1.supabase.from('students').update(studentUpdates).eq('id', id);
        if (error) {
            (0, response_1.sendError)(res, error.message, 500);
            return;
        }
    }
    const { data, error } = await supabase_1.supabase
        .from('students').select('*, profiles(*)').eq('id', id).single();
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.update = update;
// GET /api/students/:id/progress
const getProgress = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    // Students can only see their own progress
    if (user.role === 'student') {
        const { data: self } = await supabase_1.supabase
            .from('students').select('id').eq('profile_id', user.id).single();
        if (self?.id !== id) {
            (0, response_1.sendError)(res, 'Access denied.', 403);
            return;
        }
    }
    const [lessonsRes, examsRes, paymentsRes] = await Promise.all([
        supabase_1.supabase.from('lessons').select('type, start_time, end_time').eq('student_id', id).eq('status', 'completed'),
        supabase_1.supabase.from('exams').select('status').eq('student_id', id),
        supabase_1.supabase.from('payments').select('amount, status').eq('student_id', id),
    ]);
    if (lessonsRes.error) {
        (0, response_1.sendError)(res, lessonsRes.error.message, 500);
        return;
    }
    const calcHours = (ls) => ls.reduce((sum, l) => {
        const hrs = (new Date(l.end_time).getTime() - new Date(l.start_time).getTime()) / 3600000;
        return sum + hrs;
    }, 0);
    const lessons = lessonsRes.data ?? [];
    const exams = examsRes.data ?? [];
    const payments = paymentsRes.data ?? [];
    (0, response_1.sendSuccess)(res, {
        completedTheoryHours: +calcHours(lessons.filter(l => l.type === 'theory')).toFixed(1),
        completedPracticeHours: +calcHours(lessons.filter(l => l.type === 'practice')).toFixed(1),
        requiredTheoryHours: 9, // Bulgarian Наредба № 37 minimum
        requiredPracticeHours: 31, // Bulgarian Наредба № 37 minimum
        examsPassed: exams.filter(e => e.status === 'passed').length,
        examsFailed: exams.filter(e => e.status === 'failed').length,
        totalPaid: payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0),
        totalOwed: payments.filter(p => p.status !== 'paid').reduce((s, p) => s + Number(p.amount), 0),
    });
};
exports.getProgress = getProgress;
// GET /api/students/:id/exams
const getExams = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase_1.supabase
        .from('exams').select('*').eq('student_id', id).order('exam_date', { ascending: false });
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.getExams = getExams;
// GET /api/students/:id/payments
const getPayments = async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase_1.supabase
        .from('payments').select('*').eq('student_id', id).order('due_date', { ascending: false });
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.getPayments = getPayments;
//# sourceMappingURL=students.controller.js.map