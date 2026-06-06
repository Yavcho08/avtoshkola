import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboard.api';
import { Spinner } from '../../components/common/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { LessonWithRelations } from '../../types';

type Stats = Awaited<ReturnType<typeof dashboardApi.instructor>>;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Добро утро';
  if (h < 18) return 'Добър ден';
  return 'Добър вечер';
}

function StatCard({ value, label, icon, bg, textColor }:
  { value: string | number; label: string; icon: React.ReactNode; bg: string; textColor: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
        {icon}
      </div>
      <div>
        <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
        <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}

export default function InstructorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardApi.instructor().then(setStats).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Welcome banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 p-6 text-white shadow-lg shadow-violet-600/20">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -right-4 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute top-4 right-1/3 w-16 h-16 bg-white/5 rounded-full" />

        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-violet-200 text-sm font-medium mb-1">{greeting()},</p>
            <h2 className="text-2xl font-bold">{user?.profile.first_name} {user?.profile.last_name}</h2>
            <p className="text-violet-200 text-sm mt-2">
              Имате <span className="text-white font-bold">{stats?.upcomingLessons ?? 0}</span> предстоящи занятия
            </p>
          </div>
          <div className="flex flex-col items-center bg-white/10 rounded-2xl px-6 py-4 backdrop-blur-sm border border-white/10">
            <div className="text-3xl font-extrabold">{stats?.studentsCount ?? 0}</div>
            <div className="text-violet-200 text-xs mt-1">Мои курсисти</div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          value={stats?.upcomingLessons ?? 0}
          label="Предстоящи занятия"
          bg="bg-blue-50"
          textColor="text-blue-600"
          icon={<svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          value={stats?.completedThisMonth ?? 0}
          label="Завършени тази месец"
          bg="bg-green-50"
          textColor="text-green-600"
          icon={<svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          value={stats?.studentsCount ?? 0}
          label="Мои курсисти"
          bg="bg-violet-50"
          textColor="text-violet-600"
          icon={<svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
      </div>

      {/* Upcoming lessons */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Следващи занятия</h2>
          <Link to="/instructor/schedule" className="text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors">
            Виж всички →
          </Link>
        </div>

        {!stats?.nextLessons?.length ? (
          <EmptyCard text="Няма предстоящи занятия" />
        ) : (
          <div className="space-y-2">
            {(stats.nextLessons as LessonWithRelations[]).map(l => {
              const isPractice = l.type === 'practice';
              return (
                <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all duration-150">
                  <div className={`h-10 w-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isPractice ? 'bg-blue-100' : 'bg-violet-100'}`}>
                    <span className={`font-bold text-xs leading-none ${isPractice ? 'text-blue-700' : 'text-violet-700'}`}>{fmtDate(l.start_time)}</span>
                    <span className={`text-[10px] leading-none mt-0.5 ${isPractice ? 'text-blue-500' : 'text-violet-500'}`}>{fmtTime(l.start_time)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {l.students?.profiles?.first_name} {l.students?.profiles?.last_name}
                    </p>
                    {l.vehicles && (
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{l.vehicles.registration_number}</p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${isPractice ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                    {isPractice ? 'Практика' : 'Теория'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
