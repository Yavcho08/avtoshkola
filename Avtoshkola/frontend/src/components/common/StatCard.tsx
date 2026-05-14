import { ReactNode } from 'react';

type Color = 'blue' | 'green' | 'yellow' | 'red' | 'purple';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: Color;
}

const iconBg: Record<Color, string> = {
  blue:   'bg-blue-100 text-blue-600',
  green:  'bg-green-100 text-green-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  red:    'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
};

export function StatCard({ title, value, subtitle, icon, color = 'blue' }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex items-start gap-4">
      {icon && (
        <div className={`flex-shrink-0 p-3 rounded-lg ${iconBg[color]}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}
