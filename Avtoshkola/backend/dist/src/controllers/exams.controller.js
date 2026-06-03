"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.create = exports.list = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
// GET /api/exams
const list = async (req, res) => {
    const user = req.user;
    const { page, limit, offset } = (0, response_1.parsePagination)(req.query);
    const { type, status, student_id, from, to } = req.query;
    let query = supabase_1.supabase
        .from('exams')
        .select('*, students(*, profiles(*))', { count: 'exact' });
    if (user.role === 'student') {
        const { data: self } = await supabase_1.supabase
            .from('students').select('id').eq('profile_id', user.id).single();
        if (!self) {
            (0, response_1.sendError)(res, 'Student record not found.', 404);
            return;
        }
        query = query.eq('student_id', self.id);
    }
    else if (user.role === 'instructor') {
        // Instructors see exams of students assigned to them
        const { data: instructor } = await supabase_1.supabase
            .from('instructors').select('id').eq('profile_id', user.id).single();
        if (!instructor) {
            (0, response_1.sendError)(res, 'Instructor record not found.', 404);
            return;
        }
        const { data: assignedStudents } = await supabase_1.supabase
            .from('student_categories').select('student_id').eq('instructor_id', instructor.id);
        const studentIds = assignedStudents?.map(s => s.student_id) ?? [];
        if (studentIds.length === 0) {
            (0, response_1.sendPaginated)(res, [], 0, page, limit);
            return;
        }
        query = query.in('student_id', studentIds);
    }
    else {
        if (student_id)
            query = query.eq('student_id', student_id);
    }
    if (type)
        query = query.eq('type', type);
    if (status)
        query = query.eq('status', status);
    if (from)
        query = query.gte('exam_date', from);
    if (to)
        query = query.lte('exam_date', to);
    const { data, count, error } = await query
        .order('exam_date', { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendPaginated)(res, data ?? [], count ?? 0, page, limit);
};
exports.list = list;
// POST /api/exams  (admin only)
const create = async (req, res) => {
    const { student_id, type, exam_date } = req.body;
    if (!student_id || !type || !exam_date) {
        (0, response_1.sendError)(res, 'student_id, type and exam_date are required.', 422);
        return;
    }
    const { data, error } = await supabase_1.supabase
        .from('exams')
        .insert({ student_id, type, exam_date, status: 'scheduled', score: null })
        .select('*, students(*, profiles(*))')
        .single();
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 201);
};
exports.create = create;
// PATCH /api/exams/:id  (admin only — records result after the exam)
const update = async (req, res) => {
    const { id } = req.params;
    const { status, score, exam_date } = req.body;
    const updates = {};
    if (status !== undefined)
        updates.status = status;
    if (score !== undefined)
        updates.score = score;
    if (exam_date !== undefined)
        updates.exam_date = exam_date;
    const { data, error } = await supabase_1.supabase
        .from('exams').update(updates).eq('id', id)
        .select('*, students(*, profiles(*))')
        .single();
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.update = update;
//# sourceMappingURL=exams.controller.js.map