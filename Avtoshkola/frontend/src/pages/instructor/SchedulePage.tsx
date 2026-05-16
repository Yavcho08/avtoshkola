import { useEffect, useState, FormEvent } from 'react';
import { lessonsApi } from '../../api/lessons.api';
import { studentsApi } from '../../api/students.api';
import { vehiclesApi } from '../../api/vehicles.api';
import { LessonWithRelations, StudentWithProfile, VehicleWithCategory } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { extractErrorMessage } from '../../api/client';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  scheduled:  { label: 'Насрочено', dot: 'bg-blue-400'  },
  completed:  { label: 'Завършено', dot: 'bg-green-400' },
  cancelled:  { label: 'Отказано',  dot: 'bg-red-400'   },
};

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  theory:   { label: 'Теория',    bg: 'bg-violet-100', text: 'text-violet-700' },
  practice: { label: 'Практика', bg: 'bg-blue-100',   text: 'text-blue-700'   },
};

const STATUS_FILTERS = [
  { value: 'scheduled', label: 'Насрочени' },
  { value: 'completed', label: 'Завършени' },
  { value: 'cancelled', label: 'Отказани'  },
  { value: '',          label: 'Всички'    },
];

function EmptyLessons() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="text-gray-500 font-medium">Няма намерени занятия</p>
      <p className="text-gray-400 text-sm mt-1">Опитайте с различен филтър</p>
    </div>
  );
}

const selectCls = 'block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

export default function InstructorSchedulePage() {
  const [lessons, setLessons] = useState<LessonWithRelations[]>([]);
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [vehicles, setVehicles] = useState<VehicleWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('scheduled');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [notesModal, setNotesModal] = useState<LessonWithRelations | null>(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    student_id: '', vehicle_id: '', type: 'practice', start_time: '', end_time: '',
  });
  const [notesForm, setNotesForm] = useState({ instructor_notes: '', grade: '', status: 'completed' });

  const load = async () => {
    setIsLoading(true);
    try {
      const [lessonsRes, studentsRes, vehiclesRes] = await Promise.all([
        lessonsApi.list({ status: statusFilter || undefined, limit: 50 }),
        studentsApi.list({ limit: 500 }),
        vehiclesApi.list({ limit: 500 }),
      ]);
      setLessons(lessonsRes.data);
      setStudents(studentsRes.data);
      setVehicles(vehiclesRes.data);
      if (studentsRes.data.length > 0 && !createForm.student_id) {
        setCreateForm(f => ({ ...f, student_id: studentsRes.data[0].id }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, [statusFilter]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      const created = await lessonsApi.create({
        ...createForm,
        instructor_id: '',
        vehicle_id: createForm.vehicle_id || null,
      });
      setLessons(prev => [created, ...prev]);
      setIsCreateOpen(false);
    } catch (err) { setFormError(extractErrorMessage(err)); }
    finally { setIsSaving(false); }
  };

  const handleComplete = async (e: FormEvent) => {
    e.preventDefault();
    if (!notesModal) return;
    setIsSaving(true);
    try {
      const updated = await lessonsApi.update(notesModal.id, {
        status: notesForm.status,
        instructor_notes: notesForm.instructor_notes || undefined,
        grade: notesForm.grade ? Number(notesForm.grade) : null,
      });
      setLessons(prev => prev.map(l => l.id === updated.id ? updated : l));
      setNotesModal(null);
    } finally { setIsSaving(false); }
  };

  const handleCancel = async (id: string) => {
    try {
      await lessonsApi.cancel(id);
      setLessons(prev => prev.map(l => l.id === id ? { ...l, status: 'cancelled' } : l));
    } catch { /* noop */ }
  };

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Моят График</h2>
          <p className="text-sm text-gray-500 mt-0.5">Управление на всички занятия</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filter pills */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${statusFilter === f.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-150 shadow-lg shadow-blue-600/25"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Ново занятие
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner className="h-7 w-7 text-primary-600" /></div>
      ) : lessons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyLessons />
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map(l => {
            const typeConf = TYPE_CONFIG[l.type] ?? { label: l.type, bg: 'bg-gray-100', text: 'text-gray-600' };
            const statusConf = STATUS_CONFIG[l.status] ?? { label: l.status, dot: 'bg-gray-400' };
            const duration = Math.round((new Date(l.end_time).getTime() - new Date(l.start_time).getTime()) / 60000);

            return (
              <div key={l.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start gap-4">
                  {/* Date box */}
                  <div className={`h-14 w-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${typeConf.bg}`}>
                    <span className={`text-xs font-bold uppercase ${typeConf.text}`}>
                      {new Date(l.start_time).toLocaleDateString('bg-BG', { month: 'short' })}
                    </span>
                    <span className={`text-xl font-extrabold leading-none ${typeConf.text}`}>
                      {new Date(l.start_time).getDate()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${typeConf.bg} ${typeConf.text}`}>
                        {typeConf.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                        {statusConf.label}
                      </span>
                    </div>

                    <p className="font-semibold text-gray-900 truncate">
                      {l.students?.profiles?.first_name} {l.students?.profiles?.last_name}
                    </p>

                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                      <span>{fmtDate(l.start_time)}</span>
                      <span className="text-gray-300">·</span>
                      <span>{fmtTime(l.start_time)} – {fmtTime(l.end_time)}</span>
                      <span className="text-gray-300">·</span>
                      <span>{duration} мин.</span>
                      {l.vehicles && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="font-mono">{l.vehicles.registration_number}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Grade */}
                  {l.grade != null && (
                    <div className="flex-shrink-0 text-center bg-primary-50 border border-primary-100 rounded-xl px-4 py-2">
                      <p className="text-3xl font-extrabold text-primary-600">{l.grade}</p>
                      <p className="text-[10px] text-primary-400 font-medium">ОЦЕНКА</p>
                    </div>
                  )}

                  {/* Actions */}
                  {l.status === 'scheduled' && (
                    <div className="flex-shrink-0 flex flex-col gap-1.5">
                      <button
                        onClick={() => { setNotesModal(l); setNotesForm({ instructor_notes: l.instructor_notes ?? '', grade: '', status: 'completed' }); }}
                        className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors duration-150"
                      >
                        Завърши
                      </button>
                      <button
                        onClick={() => handleCancel(l.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors duration-150"
                      >
                        Откажи
                      </button>
                    </div>
                  )}
                </div>

                {l.instructor_notes && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Бележки</p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">{l.instructor_notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Ново занятие">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{formError}</p>}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Студент</label>
            <select value={createForm.student_id} onChange={e => setCreateForm(f => ({ ...f, student_id: e.target.value }))} className={selectCls}>
              {students.map(s => <option key={s.id} value={s.id}>{s.profiles.first_name} {s.profiles.last_name} ({s.egn})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">МПС (незадължително)</label>
            <select value={createForm.vehicle_id} onChange={e => setCreateForm(f => ({ ...f, vehicle_id: e.target.value }))} className={selectCls}>
              <option value="">-- Без МПС --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} – {v.make} {v.model}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Тип</label>
            <select value={createForm.type} onChange={e => setCreateForm(f => ({ ...f, type: e.target.value }))} className={selectCls}>
              <option value="theory">Теория</option>
              <option value="practice">Практика</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Начало" type="datetime-local" value={createForm.start_time} onChange={e => setCreateForm(f => ({ ...f, start_time: e.target.value }))} required />
            <Input label="Край"   type="datetime-local" value={createForm.end_time}   onChange={e => setCreateForm(f => ({ ...f, end_time:   e.target.value }))} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>Отказ</Button>
            <Button type="submit" isLoading={isSaving}>Запиши</Button>
          </div>
        </form>
      </Modal>

      {/* Complete / notes modal */}
      <Modal isOpen={!!notesModal} onClose={() => setNotesModal(null)} title="Завършване на занятие" size="sm">
        <form onSubmit={handleComplete} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Резултат</label>
            <select value={notesForm.status} onChange={e => setNotesForm(f => ({ ...f, status: e.target.value }))} className={selectCls}>
              <option value="completed">Завършено</option>
              <option value="cancelled">Отказано</option>
            </select>
          </div>
          <Input label="Оценка (2–6)" type="number" min="2" max="6" value={notesForm.grade} onChange={e => setNotesForm(f => ({ ...f, grade: e.target.value }))} />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Бележки</label>
            <textarea
              value={notesForm.instructor_notes}
              onChange={e => setNotesForm(f => ({ ...f, instructor_notes: e.target.value }))}
              rows={3}
              className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setNotesModal(null)}>Отказ</Button>
            <Button type="submit" isLoading={isSaving}>Запази</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
