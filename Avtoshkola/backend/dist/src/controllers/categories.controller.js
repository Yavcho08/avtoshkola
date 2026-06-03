"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = void 0;
const supabase_1 = require("../config/supabase");
const response_1 = require("../utils/response");
const list = async (_req, res) => {
    const { data, error } = await supabase_1.supabase.from('categories').select('*').order('name', { ascending: true });
    if (error) {
        (0, response_1.sendError)(res, error.message, 500);
        return;
    }
    (0, response_1.sendSuccess)(res, data);
};
exports.list = list;
//# sourceMappingURL=categories.controller.js.map