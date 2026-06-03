"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
// ─── Import type augmentation so req.user is visible project-wide ─────────────
// Type augmentations are picked up automatically via tsconfig include.
const app = (0, express_1.default)();
// ─── Security & Logging Middleware ────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ─── API Routes ───────────────────────────────────────────────────────────────
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const students_routes_1 = __importDefault(require("./routes/students.routes"));
const instructors_routes_1 = __importDefault(require("./routes/instructors.routes"));
const lessons_routes_1 = __importDefault(require("./routes/lessons.routes"));
const exams_routes_1 = __importDefault(require("./routes/exams.routes"));
const vehicles_routes_1 = __importDefault(require("./routes/vehicles.routes"));
const payments_routes_1 = __importDefault(require("./routes/payments.routes"));
const expenses_routes_1 = __importDefault(require("./routes/expenses.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const categories_routes_1 = __importDefault(require("./routes/categories.routes"));
const jobs_routes_1 = __importDefault(require("./routes/jobs.routes"));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/students', students_routes_1.default);
app.use('/api/instructors', instructors_routes_1.default);
app.use('/api/lessons', lessons_routes_1.default);
app.use('/api/exams', exams_routes_1.default);
app.use('/api/vehicles', vehicles_routes_1.default);
app.use('/api/payments', payments_routes_1.default);
app.use('/api/expenses', expenses_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/categories', categories_routes_1.default);
app.use('/api/jobs', jobs_routes_1.default);
// ─── 404 Catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => {
    const body = { data: null, error: 'Route not found.' };
    res.status(404).json(body);
});
// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('[Unhandled Error]', err.stack);
    const body = { data: null, error: 'Internal server error.' };
    res.status(500).json(body);
});
exports.default = app;
//# sourceMappingURL=app.js.map