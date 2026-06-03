"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancel = exports.update = exports.create = exports.list = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
// Overlap: [a_start, a_end) ∩ [b_start, b_end) ≠ ∅  ⟺  a_start < b_end AND a_end > b_start
const detectConflict = async (instructorId, studentId, startTime, endTime, vehicleId, excludeId) => {
    const orParts = [
        `instructor_id.eq.${instructorId}`,
        `student_id.eq.${studentId}`,
        ...(vehicleId ? [`vehicle_id.eq.${vehicleId}`] : []),
    ];
    let query = supabase_1.supabase
        .from('lessons')
        .select('id, instructor_id, student_id, vehicle_id')
        .neq('status', 'cancelled')
        .lt('start_time', endTime)
        .gt('end_time', startTime)
        .or(orParts.join(','));
    if (excludeId)
        query = query.neq('id', excludeId);
    const { data, error } = await query;
    if (error)
        return 'Error checking schedule conflicts.';
    if (!data?.length)
        return null;
    if (data.some(l => l.instructor_id === instructorId))
        return 'Instructor already has a lesson at this time.';
    if (data.some(l => l.student_id === studentId))
        return 'Student already has a lesson at this time.';
    if (vehicleId && data.some(l => l.vehicle_id === vehicleId))
        return 'Vehicle is already booked at this time.';
    return 'Scheduling conflict detected.';
};
// GET /api/lessons
const list = async (req, res) => {
    const user = req.user;
    const { page, limit, offset } = (0, response_1.parsePagination)(req.query);
    const { type, status, from, to, student_id, instructor_id } = req.query;
    let query = supabase_1.supabase
        .from('lessons')
        .select('*, students(*, profiles(*)), instructors(*, profiles(*)), vehicles(*)', { count: 'exact' });
    // Role-based scope enforcement
    if (user.role === 'instructor') {
        const { data: instructor } = await supabase_1.supabase
            .from('instructors').select('id').eq('profile_id', user.id).single();
        if (!instructor) {
            (0, response_1.sendError)(res, 'Instructor record not found.', 404);
            return;
        }
        query = query.eq('instructor_id', instructor.id);
    }
    else if (user.role === 'student') {
        const { data: student } = await supabase_1.supabase
            .from('students').select('id').eq('profile_id', user.id).single();
        if (!student) {
            (0, response_1.sendError)(res, 'Student record not found.', 404);
            return;
        }
        query = query.eq('student_id', student.id);
    }
    else {
        // Admin: optional filters
        if (student_id)
            query = query.eq('student_id', student_id);
        if (instructor_id)
            query = query.eq('instructor_id', instructor_id);
    }
    if (type)
        query = query.eq('type', type);
    if (status)
        query = query.eq('status', status);
    if (from)
        query = query.gte('start_time', from);
    if (to)
        query = query.lte('start_time', to);
    const { data, count, error } = await query
        .order('start_time', { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendPaginated)(res, data ?? [], count ?? 0, page, limit);
};
exports.list = list;
// POST /api/lessons  (admin, instructor, or student self-booking)
const create = async (req, res) => {
    let { student_id, instructor_id, vehicle_id, type, start_time, end_time, location } = req.body;
    // Instructors can only create lessons for themselves
    if (req.user.role === 'instructor') {
        const { data: self } = await supabase_1.supabase
            .from('instructors').select('id').eq('profile_id', req.user.id).single();
        if (!instructor_id && self) {
            instructor_id = self.id;
        }
        else if (self?.id !== instructor_id) {
            (0, response_1.sendError)(res, 'Instructors can only schedule their own lessons.', 403);
            return;
        }
    }
    // Students always book for themselves
    if (req.user.role === 'student') {
        const { data: self } = await supabase_1.supabase
            .from('students').select('id').eq('profile_id', req.user.id).single();
        if (!self) {
            (0, response_1.sendError)(res, 'Записът за курсист не е намерен.', 404);
            return;
        }
        student_id = self.id;
    }
    if (!student_id || !instructor_id || !type || !start_time || !end_time) {
        (0, response_1.sendError)(res, 'student_id, instructor_id, type, start_time and end_time are required.', 422);
        return;
    }
    if (new Date(end_time) <= new Date(start_time)) {
        (0, response_1.sendError)(res, 'end_time must be after start_time.', 422);
        return;
    }
    const conflict = await detectConflict(instructor_id, student_id, start_time, end_time, vehicle_id);
    if (conflict) {
        (0, response_1.sendError)(res, conflict, 409);
        return;
    }
    const { data, error } = await supabase_1.supabase
        .from('lessons')
        .insert({
        student_id,
        instructor_id,
        vehicle_id: vehicle_id ?? null,
        type,
        start_time,
        end_time,
        location: location?.trim() || null,
        status: 'scheduled',
        instructor_notes: null,
        grade: null,
    })
        .select('*, students(*, profiles(*)), instructors(*, profiles(*)), vehicles(*)')
        .single();
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 201);
};
exports.create = create;
// PATCH /api/lessons/:id  (admin or instructor)
const update = async (req, res) => {
    const { id } = req.params;
    const { status, instructor_notes, grade, start_time, end_time, vehicle_id, location } = req.body;
    const user = req.user;
    const { data: existing, error: fetchError } = await supabase_1.supabase
        .from('lessons').select('*').eq('id', id).single();
    if (fetchError || !existing) {
        (0, response_1.sendError)(res, 'Lesson not found.', 404);
        return;
    }
    // Instructors can only update their own lessons
    if (user.role === 'instructor') {
        const { data: self } = await supabase_1.supabase
            .from('instructors').select('id').eq('profile_id', user.id).single();
        if (self?.id !== existing.instructor_id) {
            (0, response_1.sendError)(res, 'Access denied.', 403);
            return;
        }
    }
    // If rescheduling, check for conflicts again (exclude current lesson)
    if (start_time || end_time) {
        const newStart = start_time ?? existing.start_time;
        const newEnd = end_time ?? existing.end_time;
        if (new Date(newEnd) <= new Date(newStart)) {
            (0, response_1.sendError)(res, 'end_time must be after start_time.', 422);
            return;
        }
        const conflict = await detectConflict(existing.instructor_id, existing.student_id, newStart, newEnd, vehicle_id ?? existing.vehicle_id, id);
        if (conflict) {
            (0, response_1.sendError)(res, conflict, 409);
            return;
        }
    }
    const updates = {};
    if (status !== undefined)
        updates.status = status;
    if (instructor_notes !== undefined)
        updates.instructor_notes = instructor_notes;
    if (grade !== undefined)
        updates.grade = grade;
    if (start_time !== undefined)
        updates.start_time = start_time;
    if (end_time !== undefined)
        updates.end_time = end_time;
    if (vehicle_id !== undefined)
        updates.vehicle_id = vehicle_id;
    if (location !== undefined)
        updates.location = location?.trim() || null;
    const { data, error } = await supabase_1.supabase
        .from('lessons').update(updates).eq('id', id)
        .select('*, students(*, profiles(*)), instructors(*, profiles(*)), vehicles(*)')
        .single();
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.update = update;
// DELETE /api/lessons/:id  — soft cancel  (admin or instructor)
const cancel = async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const { data: existing, error: fetchError } = await supabase_1.supabase
        .from('lessons').select('instructor_id, status').eq('id', id).single();
    if (fetchError || !existing) {
        (0, response_1.sendError)(res, 'Lesson not found.', 404);
        return;
    }
    if (existing.status === 'cancelled') {
        (0, response_1.sendError)(res, 'Lesson is already cancelled.', 400);
        return;
    }
    if (user.role === 'instructor') {
        const { data: self } = await supabase_1.supabase
            .from('instructors').select('id').eq('profile_id', user.id).single();
        if (self?.id !== existing.instructor_id) {
            (0, response_1.sendError)(res, 'Access denied.', 403);
            return;
        }
    }
    const { error } = await supabase_1.supabase.from('lessons').update({ status: 'cancelled' }).eq('id', id);
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, null, 200, 'Lesson cancelled.');
};
exports.cancel = cancel;
//# sourceMappingURL=lessons.controller.js.map