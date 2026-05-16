import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard.api';
import { Spinner } from '../../components/common/Spinner';

type Stats = Awaited<ReturnType<typeof dashboardApi.admin>>;

function fmt(n: number) {
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'BGN', maximumFractionDigits: 0 }).format(n);
}

function KpiCard({ value, label, sub, icon, bg, textColor, to }:
  { value: string | number; label: string; sub?: string; icon: React.ReactNode; bg: string; textColor: string; to?: string }) {
  const inner = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200 cursor-default">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return to ? <Link to={to} className="block">{inner}</Link> : <div>{inner}</div>;
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
    <div className="space-y-6 max-w-7xl">

      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-900 p-6 text-white shadow-lg">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -right-4 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-1/3 w-16 h-16 bg-white/5 rounded-full" />
        <div className="relative">
          <p className="text-blue-300 text-sm font-medium mb-1">Администраторско табло</p>
          <h2 className="text-2xl font-bold">Обзор на автошколата</h2>
          <p className="text-blue-200 text-sm mt-2">
            Приходи за месеца: <span className="text-white font-bold">{fmt(stats.monthlyRevenue)}</span>
            <span className="mx-2 text-blue-400">·</span>
            Нетна печалба: <span className="text-green-300 font-bold">{fmt(stats.netProfit)}</span>
          </p>
        </div>
      </div>

      {/* People & fleet */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Хора и флот</h3>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            value={stats.activeStudents}
            label="Активни студенти"
            sub={`Общо: ${stats.totalStudents}`}
            bg="bg-blue-50" textColor="text-blue-600" to="/admin/students"
            icon={<svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
          />
          <KpiCard
            value={stats.activeInstructors}
            label="Активни инструктори"
            bg="bg-violet-50" textColor="text-violet-600" to="/admin/instructors"
            icon={<svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          />
          <KpiCard
            value={stats.activeVehicles}
            label="Активни МПС"
            bg="bg-cyan-50" textColor="text-cyan-600" to="/admin/vehicles"
            icon={<svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 1m0 0h6m-6 0l-2-1m14-4h2a1 1 0 011 1v3a1 1 0 01-1 1h-1m-8-1h6" /></svg>}
          />
          <KpiCard
            value={stats.upcomingExams}
            label="Предстоящи изпити"
            bg="bg-amber-50" textColor="text-amber-600" to="/admin/exams"
            icon={<svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
          />
        </div>
      </div>

      {/* Finances */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Финанси (текущ месец)</h3>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            value={fmt(stats.monthlyRevenue)}
            label="Приходи"
            bg="bg-green-50" textColor="text-green-600"
            icon={<svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <KpiCard
            value={fmt(stats.monthlyExpenses)}
            label="Разходи"
            bg="bg-orange-50" textColor="text-orange-600" to="/admin/finances"
            icon={<svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>}
          />
          <KpiCard
            value={fmt(stats.netProfit)}
            label="Нетна печалба"
            bg="bg-emerald-50" textColor="text-emerald-600"
            icon={<svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          />
          <KpiCard
            value={stats.overduePayments}
            label="Просрочени плащания"
            bg="bg-red-50" textColor="text-red-600" to="/admin/finances"
            icon={<svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          />
        </div>
      </div>
    </div>
  );
}
