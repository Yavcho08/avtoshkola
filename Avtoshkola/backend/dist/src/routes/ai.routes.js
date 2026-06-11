"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const ai_controller_1 = require("../controllers/ai.controller");
const router = (0, express_1.Router)();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(authMiddleware_1.authenticate);
router.post('/ask', wrap(ai_controller_1.ai.ask));
router.get('/history', wrap(ai_controller_1.ai.getHistory));
exports.default = router;
//# sourceMappingURL=ai.routes.js.map