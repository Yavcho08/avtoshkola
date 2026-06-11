"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const exam_sim_controller_1 = require("../controllers/exam-sim.controller");
const router = (0, express_1.Router)();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
router.use(authMiddleware_1.authenticate);
router.get('/generate', wrap(exam_sim_controller_1.examSim.generate));
router.post('/submit', wrap(exam_sim_controller_1.examSim.submit));
router.get('/history', wrap(exam_sim_controller_1.examSim.getHistory));
exports.default = router;
//# sourceMappingURL=exam-sim.routes.js.map