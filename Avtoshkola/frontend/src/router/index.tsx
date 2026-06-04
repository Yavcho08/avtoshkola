import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';

// Public
import LandingPage from '../pages/LandingPage';

// Auth
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Admin
import AdminDashboardPage from '../pages/admin/DashboardPage';
import AdminStudentsPage from '../pages/admin/StudentsPage';
import AdminInstructorsPage from '../pages/admin/InstructorsPage';
import AdminVehiclesPage from '../pages/admin/VehiclesPage';
import AdminExamsPage from '../pages/admin/ExamsPage';
import AdminFinancesPage from '../pages/admin/FinancesPage';
import AdminEmailsPage from '../pages/admin/EmailsPage';

// Instructor
import InstructorDashboardPage from '../pages/instructor/DashboardPage';
import InstructorSchedulePage from '../pages/instructor/SchedulePage';

// Student
import StudentDashboardPage from '../pages/student/DashboardPage';
import StudentSchedulePage from '../pages/student/SchedulePage';
import StudentPaymentsPage from '../pages/student/PaymentsPage';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <LandingPage />;
  const home = { admin: '/admin', instructor: '/instructor', student: '/student' } as const;
  return <Navigate to={home[user.role]} replace />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── Admin ──────────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin"             element={<AdminDashboardPage />} />
          <Route path="/admin/students"    element={<AdminStudentsPage />} />
          <Route path="/admin/instructors" element={<AdminInstructorsPage />} />
          <Route path="/admin/vehicles"    element={<AdminVehiclesPage />} />
          <Route path="/admin/exams"       element={<AdminExamsPage />} />
          <Route path="/admin/finances"    element={<AdminFinancesPage />} />
          <Route path="/admin/emails"      element={<AdminEmailsPage />} />
        </Route>
      </Route>

      {/* ── Instructor ─────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['instructor']} />}>
        <Route element={<AppLayout />}>
          <Route path="/instructor"          element={<InstructorDashboardPage />} />
          <Route path="/instructor/schedule" element={<InstructorSchedulePage />} />
        </Route>
      </Route>

      {/* ── Student ────────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<AppLayout />}>
          <Route path="/student"           element={<StudentDashboardPage />} />
          <Route path="/student/schedule"  element={<StudentSchedulePage />} />
          <Route path="/student/payments"  element={<StudentPaymentsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
