"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const response_1 = require("../utils/response");
const students = __importStar(require("../controllers/students.controller"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(authMiddleware_1.authenticate);
// Collection
router.get('/', authMiddleware_1.requireAdminOrInstructor, (0, response_1.wrap)(students.list));
router.post('/', authMiddleware_1.requireAdmin, (0, response_1.wrap)(students.create));
// Per-student (admin, assigned instructor, or the student themselves — enforced in controller)
router.get('/:id', authMiddleware_1.requireAdminOrInstructor, (0, response_1.wrap)(students.getById));
router.patch('/:id', authMiddleware_1.requireAdmin, (0, response_1.wrap)(students.update));
router.get('/:id/progress', authMiddleware_1.requireAdminOrInstructor, (0, response_1.wrap)(students.getProgress));
router.get('/:id/exams', authMiddleware_1.requireAdminOrInstructor, (0, response_1.wrap)(students.getExams));
router.get('/:id/payments', authMiddleware_1.requireAdmin, (0, response_1.wrap)(students.getPayments));
exports.default = router;
//# sourceMappingURL=students.routes.js.map