"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrap = exports.parsePagination = exports.sendPaginated = exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, status = 200, message) => {
    const body = { data, error: null, ...(message !== undefined && { message }) };
    res.status(status).json(body);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, error, status = 400) => {
    const body = { data: null, error };
    res.status(status).json(body);
};
exports.sendError = sendError;
const sendPaginated = (res, data, total, page, limit) => {
    const body = { data, total, page, limit, error: null };
    res.json(body);
};
exports.sendPaginated = sendPaginated;
const parsePagination = (query) => {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    return { page, limit, offset: (page - 1) * limit };
};
exports.parsePagination = parsePagination;
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);
exports.wrap = wrap;
//# sourceMappingURL=response.js.map