"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminOrInstructor = exports.requireStudent = exports.requireInstructor = exports.requireAdmin = exports.requireRole = exports.authenticate = void 0;
const supabase_1 = require("../config/supabase");
// ─── authenticate ─────────────────────────────────────────────────────────────
// Validates the Bearer JWT sent by the frontend, fetches the caller's profile
// row (which carries their role), and attaches the result to req.user.
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ data: null, error: 'Authorization header missing or malformed.' });
            return;
        }
        const token = authHeader.split(' ')[1];
        // Verify the JWT with Supabase Auth.
        const authResult = await supabase_1.supabase.auth.getUser(token);
        const authError = authResult.error;
        const user = authResult.data?.user;
        if (authError || !user) {
            res.status(401).json({ data: null, error: 'Invalid or expired token.' });
            return;
        }
        // Fetch the profile row — this is where the application role lives.
        const { data: profile, error: profileError } = await supabase_1.supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        if (profileError || !profile) {
            res.status(403).json({ data: null, error: 'User profile not found. Contact an administrator.' });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email ?? '',
            role: profile.role,
            profile,
        };
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.authenticate = authenticate;
// ─── requireRole ─────────────────────────────────────────────────────────────
// Factory that returns a middleware accepting only the specified roles.
// Usage: router.get('/admin-only', authenticate, requireRole('admin'), handler)
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ data: null, error: 'Not authenticated.' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                data: null,
                error: `Access denied. Required role(s): ${roles.join(', ')}.`,
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
// ─── Convenience role guards ──────────────────────────────────────────────────
exports.requireAdmin = (0, exports.requireRole)('admin');
exports.requireInstructor = (0, exports.requireRole)('instructor');
exports.requireStudent = (0, exports.requireRole)('student');
exports.requireAdminOrInstructor = (0, exports.requireRole)('admin', 'instructor');
//# sourceMappingURL=authMiddleware.js.map