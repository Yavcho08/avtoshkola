type Color = 'green' | 'yellow' | 'red' | 'blue' | 'gray';

interface Props {
  label: string;
  color?: Color;
}

const colorCls: Record<Color, string> = {
  green:  'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red:    'bg-red-100 text-red-800',
  blue:   'bg-blue-100 text-blue-800',
  gray:   'bg-gray-100 text-gray-600',
};

// Maps every status value used across the system to a colour.
const STATUS_COLORS: Record<string, Color> = {
  // StudentStatus
  active: 'green', graduated: 'blue', dropped: 'red',
  // LessonStatus
  scheduled: 'yellow', completed: 'green', cancelled: 'gray',
  // ExamStatus
  passed: 'green', failed: 'red',
  // PaymentStatus
  pending: 'yellow', paid: 'green', overdue: 'red',
  // VehicleStatus
  in_repair: 'yellow', retired: 'gray',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Активен', graduated: 'Завършил', dropped: 'Отписан',
  scheduled: 'Насрочен', completed: 'Завършен', cancelled: 'Отказан',
  passed: 'Издържан', failed: 'Неиздържан',
  pending: 'Изчакващо', paid: 'Платено', overdue: 'Просрочено',
  in_repair: 'В ремонт', retired: 'Изведен',
  theory: 'Теория', practice: 'Практика',
  internal_theory: 'Вътр. теория', internal_practice: 'Вътр. практика',
  state_theory: 'ДАИ теория', state_practice: 'ДАИ практика',
};

export function Badge({ label, color }: Props) {
  const resolvedColor = color ?? STATUS_COLORS[label] ?? 'gray';
  const displayLabel = STATUS_LABELS[label] ?? label;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorCls[resolvedColor]}`}>
      {displayLabel}
    </span>
  );
}
