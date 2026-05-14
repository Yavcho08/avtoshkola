import { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboard.api';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { LessonWithRelations } from '../../types';

type Stats = Awaited<ReturnType<typeof dashboardApi.instructor>>;

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('bg-BG', { dateStyle: 'short', timeStyle: 'short' });
}

export default function InstructorDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardApi.instructor()
      .then(setStats)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary-600" /></div>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Предстоящи занятия" value={stats.upcomingLessons} color="blue" />
        <StatCard title="Завършени (месец)" value={stats.completedThisMonth} color="green" />
        <StatCard title="Мои студенти" value={stats.studentsCount} color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Следващи занятия</h2>
        {stats.nextLessons.length === 0 ? (
          <p className="text-sm text-gray-500">Няма предстоящи занятия.</p>
        ) : (
          <div className="space-y-3">
            {(stats.nextLessons as LessonWithRelations[]).map((lesson) => (
              <div key={lesson.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    {lesson.students?.profiles?.first_name} {lesson.students?.profiles?.last_name}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{fmtDateTime(lesson.start_time)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {lesson.vehicles && (
                    <span className="text-sm font-mono text-gray-600">{lesson.vehicles.registration_number}</span>
                  )}
                  <Badge label={lesson.type} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
