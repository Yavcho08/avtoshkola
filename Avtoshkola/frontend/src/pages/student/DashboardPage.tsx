import { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboard.api';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { LessonWithRelations } from '../../types';

type Stats = Awaited<ReturnType<typeof dashboardApi.student>>;

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('bg-BG', { dateStyle: 'short', timeStyle: 'short' });
}

interface ProgressBarProps { label: string; current: number; required: number; unit?: string }
function ProgressBar({ label, current, required, unit = 'ч.' }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((current / required) * 100));
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{current} / {required} {unit}</span>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-green-500' : 'bg-primary-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-right text-xs text-gray-400 mt-0.5">{pct}%</p>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'BGN' }).format(n);
}

export default function StudentDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardApi.student().then(setStats).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">Напредък по обучение</h2>
        <div className="space-y-5">
          <ProgressBar label="Теория" current={stats.completedTheoryHours} required={stats.requiredTheoryHours} />
          <ProgressBar label="Практика" current={stats.completedPracticeHours} required={stats.requiredPracticeHours} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.examsPassed}</p>
          <p className="text-sm text-gray-500 mt-1">Издържани изпити</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-3xl font-bold text-red-500">{stats.examsFailed}</p>
          <p className="text-sm text-gray-500 mt-1">Неиздържани изпити</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-2xl font-bold text-gray-900">{fmt(stats.totalPaid)}</p>
          <p className="text-sm text-gray-500 mt-1">Платено</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 text-center">
          <p className="text-2xl font-bold text-orange-600">{fmt(stats.totalOwed)}</p>
          <p className="text-sm text-gray-500 mt-1">За плащане</p>
        </div>
      </div>

      {/* Next lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Предстоящи занятия</h2>
          {stats.nextLessons.length === 0 ? (
            <p className="text-sm text-gray-500">Няма насрочени занятия.</p>
          ) : (
            <div className="space-y-3">
              {(stats.nextLessons as LessonWithRelations[]).map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {l.instructors?.profiles?.first_name} {l.instructors?.profiles?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{fmtDateTime(l.start_time)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {l.vehicles && <span className="text-xs font-mono text-gray-500">{l.vehicles.registration_number}</span>}
                    <Badge label={l.type} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Предстоящи изпити</h2>
          {stats.nextExams.length === 0 ? (
            <p className="text-sm text-gray-500">Няма насрочени изпити.</p>
          ) : (
            <div className="space-y-3">
              {(stats.nextExams as Array<{ id: string; type: string; exam_date: string }>).map(ex => (
                <div key={ex.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Badge label={ex.type} />
                  <span className="text-sm text-gray-600">{fmtDateTime(ex.exam_date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
