"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unreadCount = exports.markRead = exports.sendMessage = exports.getMessages = exports.getContacts = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
// GET /api/chat/contacts
const getContacts = async (req, res) => {
    const user = req.user;
    if (user.role === 'student') {
        const { data: student } = await supabase_1.supabase
            .from('students').select('id').eq('profile_id', user.id).single();
        if (!student) {
            (0, response_1.sendSuccess)(res, []);
            return;
        }
        const { data: lessons } = await supabase_1.supabase
            .from('lessons')
            .select('instructor_id, instructors(profile_id, profiles(first_name, last_name))')
            .eq('student_id', student.id);
        const seen = new Set();
        const contacts = (lessons ?? [])
            .filter(l => {
            const pid = l.instructors?.profile_id;
            if (!pid || seen.has(pid))
                return false;
            seen.add(pid);
            return true;
        })
            .map(l => ({
            profile_id: l.instructors?.profile_id,
            first_name: l.instructors?.profiles?.first_name,
            last_name: l.instructors?.profiles?.last_name,
            role: 'instructor',
        }));
        (0, response_1.sendSuccess)(res, contacts);
    }
    else if (user.role === 'instructor') {
        const { data: instructor } = await supabase_1.supabase
            .from('instructors').select('id').eq('profile_id', user.id).single();
        if (!instructor) {
            (0, response_1.sendSuccess)(res, []);
            return;
        }
        const { data: lessons } = await supabase_1.supabase
            .from('lessons')
            .select('student_id, students(profile_id, profiles(first_name, last_name))')
            .eq('instructor_id', instructor.id);
        const seen = new Set();
        const contacts = (lessons ?? [])
            .filter(l => {
            const pid = l.students?.profile_id;
            if (!pid || seen.has(pid))
                return false;
            seen.add(pid);
            return true;
        })
            .map(l => ({
            profile_id: l.students?.profile_id,
            first_name: l.students?.profiles?.first_name,
            last_name: l.students?.profiles?.last_name,
            role: 'student',
        }));
        (0, response_1.sendSuccess)(res, contacts);
    }
    else {
        (0, response_1.sendSuccess)(res, []);
    }
};
exports.getContacts = getContacts;
// GET /api/chat/messages/:profileId
const getMessages = async (req, res) => {
    const me = req.user.id;
    const other = req.params.profileId;
    const { data, error } = await supabase_1.supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${me},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${me})`)
        .order('created_at', { ascending: true })
        .limit(200);
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data ?? []);
};
exports.getMessages = getMessages;
// POST /api/chat/send
const sendMessage = async (req, res) => {
    const sender_id = req.user.id;
    const { receiver_id, content } = req.body;
    if (!receiver_id || !content?.trim()) {
        (0, response_1.sendError)(res, 'receiver_id и content са задължителни.', 422);
        return;
    }
    if (content.length > 2000) {
        (0, response_1.sendError)(res, 'Максимум 2000 символа.', 422);
        return;
    }
    const { data, error } = await supabase_1.supabase
        .from('messages')
        .insert({ sender_id, receiver_id, content: content.trim() })
        .select('*').single();
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data, 201);
};
exports.sendMessage = sendMessage;
// PATCH /api/chat/read/:profileId
const markRead = async (req, res) => {
    const me = req.user.id;
    const other = req.params.profileId;
    await supabase_1.supabase.from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', other).eq('receiver_id', me).is('read_at', null);
    (0, response_1.sendSuccess)(res, { ok: true });
};
exports.markRead = markRead;
// GET /api/chat/unread
const unreadCount = async (req, res) => {
    const me = req.user.id;
    const { count } = await supabase_1.supabase
        .from('messages').select('*', { count: 'exact', head: true })
        .eq('receiver_id', me).is('read_at', null);
    (0, response_1.sendSuccess)(res, { count: count ?? 0 });
};
exports.unreadCount = unreadCount;
//# sourceMappingURL=chat.controller.js.map