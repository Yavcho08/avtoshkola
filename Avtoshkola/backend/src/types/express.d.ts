import { AuthenticatedUser } from './index';

// Augment Express's Request so req.user is typed everywhere in the project.
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
