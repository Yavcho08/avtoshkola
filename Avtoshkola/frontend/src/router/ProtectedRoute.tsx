import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { Spinner } from '../components/common/Spinner';

interface Props {
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="h-10 w-10 text-primary-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    // Redirect each role to their own root instead of a generic 403
    const home: Record<UserRole, string> = {
      admin: '/admin',
      instructor: '/instructor',
      student: '/student',
    };
    return <Navigate to={home[user.role]} replace />;
  }

  return <Outlet />;
}
