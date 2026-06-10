import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

const PAGE_TITLES: Record<string, string> = {
  '/admin':             'Табло',
  '/admin/students':    'Курсисти',
  '/admin/instructors': 'Инструктори',
  '/admin/vehicles':    'Превозни средства',
  '/admin/exams':       'Изпити',
  '/admin/finances':    'Финанси',
  '/admin/emails':      'Имейли',
  '/instructor':        'Табло',
  '/instructor/schedule': 'График',
  '/student':           'Табло',
  '/student/schedule':  'График',
  '/student/payments':  'Плащания',
  '/student/chat':      'Съобщения',
  '/instructor/chat':   'Съобщения',
  '/student/ai':        'AI Асистент',
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Администратор',
  instructor: 'Инструктор',
  student: 'Курсист',
};

export function AppLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = PAGE_TITLES[pathname] ?? (user ? ROLE_LABELS[user.role] : '');

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
