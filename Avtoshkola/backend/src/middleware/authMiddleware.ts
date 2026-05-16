import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedUser, UserRole, Profile } from '../types';

// ─── authenticate ─────────────────────────────────────────────────────────────
// Validates the Bearer JWT sent by the frontend, fetches the caller's profile
// row (which carries their role), and attaches the result to req.user.
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ data: null, error: 'Authorization header missing or malformed.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT with Supabase Auth.
    const authResult = await supabase.auth.getUser(token);
    const authError = authResult.error;
    const user = authResult.data?.user;

    if (authError || !user) {
      res.status(401).json({ data: null, error: 'Invalid or expired token.' });
      return;
    }

    // Fetch the profile row — this is where the application role lives.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>();

    if (profileError || !profile) {
      res.status(403).json({ data: null, error: 'User profile not found. Contact an administrator.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email ?? '',
      role: profile.role,
      profile,
    } satisfies AuthenticatedUser;

    next();
  } catch (err) {
    next(err);
  }
};

// ─── requireRole ─────────────────────────────────────────────────────────────
// Factory that returns a middleware accepting only the specified roles.
// Usage: router.get('/admin-only', authenticate, requireRole('admin'), handler)
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

// ─── Convenience role guards ──────────────────────────────────────────────────
export const requireAdmin = requireRole('admin');
export const requireInstructor = requireRole('instructor');
export const requireStudent = requireRole('student');
export const requireAdminOrInstructor = requireRole('admin', 'instructor');
