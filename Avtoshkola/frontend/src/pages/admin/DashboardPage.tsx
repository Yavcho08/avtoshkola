import { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboard.api';
import { StatCard } from '../../components/common/StatCard';
import { Spinner } from '../../components/common/Spinner';

type Stats = Awaited<ReturnType<typeof dashboardApi.admin>>;

function fmt(n: number) {
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'BGN', maximumFractionDigits: 0 }).format(n);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.admin()
      .then(setStats)
      .catch(() => setError('Грешка при зареждане на статистиките.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Активни студенти"
          value={stats.activeStudents}
          subtitle={`Общо ${stats.totalStudents}`}
          color="blue"
          icon={<UsersIcon />}
        />
        <StatCard
          title="Активни инструктори"
          value={stats.activeInstructors}
          color="purple"
          icon={<PersonIcon />}
        />
        <StatCard
          title="Приходи (месец)"
          value={fmt(stats.monthlyRevenue)}
          subtitle={`Нетна печалба: ${fmt(stats.netProfit)}`}
          color="green"
          icon={<MoneyIcon />}
        />
        <StatCard
          title="Разходи (месец)"
          value={fmt(stats.monthlyExpenses)}
          color="yellow"
          icon={<ExpenseIcon />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Активни МПС"
          value={stats.activeVehicles}
          color="blue"
          icon={<CarIcon />}
        />
        <StatCard
          title="Предстоящи изпити"
          value={stats.upcomingExams}
          color="yellow"
          icon={<ClipboardIcon />}
        />
        <StatCard
          title="Просрочени плащания"
          value={stats.overduePayments}
          color="red"
          icon={<AlertIcon />}
        />
      </div>
    </div>
  );
}

function UsersIcon() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>; }
function PersonIcon() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>; }
function MoneyIcon() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function ExpenseIcon() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>; }
function CarIcon() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m0 0h6m-6 0l-2-1m14-4h2a1 1 0 011 1v3a1 1 0 01-1 1h-1m-8-1h6" /></svg>; }
function ClipboardIcon() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>; }
function AlertIcon() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>; }
