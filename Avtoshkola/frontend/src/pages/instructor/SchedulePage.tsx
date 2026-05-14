import { useEffect, useState, FormEvent } from 'react';
import { lessonsApi } from '../../api/lessons.api';
import { studentsApi } from '../../api/students.api';
import { vehiclesApi } from '../../api/vehicles.api';
import { LessonWithRelations, StudentWithProfile, VehicleWithCategory } from '../../types';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import { extractErrorMessage } from '../../api/client';

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('bg-BG', { dateStyle: 'short', timeStyle: 'short' });
}

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
    student_id: '', vehicle_id: '', type: 'practice',
    start_time: '', end_time: '',
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
      // instructor_id is resolved by the backend from req.user
      const created = await lessonsApi.create({
        ...createForm,
        instructor_id: '', // backend will enforce self for instructor role
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="scheduled">Насрочени</option>
          <option value="completed">Завършени</option>
          <option value="cancelled">Отказани</option>
          <option value="">Всички</option>
        </select>
        <Button className="ml-auto" onClick={() => setIsCreateOpen(true)}>+ Ново занятие</Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="h-7 w-7 text-primary-600" /></div>
        ) : lessons.length === 0 ? (
          <EmptyState title="Няма намерени занятия" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Студент', 'Тип', 'Начало', 'Край', 'МПС', 'Статус', 'Оценка', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lessons.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {l.students?.profiles?.first_name} {l.students?.profiles?.last_name}
                  </td>
                  <td className="px-4 py-3"><Badge label={l.type} /></td>
                  <td className="px-4 py-3 text-gray-600">{fmtDateTime(l.start_time)}</td>
                  <td className="px-4 py-3 text-gray-600">{fmtDateTime(l.end_time)}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{l.vehicles?.registration_number ?? '—'}</td>
                  <td className="px-4 py-3"><Badge label={l.status} /></td>
                  <td className="px-4 py-3 text-gray-700">{l.grade ?? '—'}</td>
                  <td className="px-4 py-3 flex gap-1">
                    {l.status === 'scheduled' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => { setNotesModal(l); setNotesForm({ instructor_notes: l.instructor_notes ?? '', grade: '', status: 'completed' }); }}>
                          Завърши
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleCancel(l.id)}>Откажи</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Ново занятие">
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{formError}</p>}
          <div>
            <label className="text-sm font-medium text-gray-700">Студент</label>
            <select value={createForm.student_id} onChange={e => setCreateForm(f => ({ ...f, student_id: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {students.map(s => <option key={s.id} value={s.id}>{s.profiles.first_name} {s.profiles.last_name} ({s.egn})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">МПС (незадължително)</label>
            <select value={createForm.vehicle_id} onChange={e => setCreateForm(f => ({ ...f, vehicle_id: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">-- Без МПС --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} - {v.make} {v.model}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Тип</label>
            <select value={createForm.type} onChange={e => setCreateForm(f => ({ ...f, type: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="theory">Теория</option>
              <option value="practice">Практика</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Начало" type="datetime-local" value={createForm.start_time} onChange={e => setCreateForm(f => ({ ...f, start_time: e.target.value }))} required />
            <Input label="Край" type="datetime-local" value={createForm.end_time} onChange={e => setCreateForm(f => ({ ...f, end_time: e.target.value }))} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>Отказ</Button>
            <Button type="submit" isLoading={isSaving}>Запиши</Button>
          </div>
        </form>
      </Modal>

      {/* Complete/notes modal */}
      <Modal isOpen={!!notesModal} onClose={() => setNotesModal(null)} title="Завършване на занятие" size="sm">
        <form onSubmit={handleComplete} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Резултат</label>
            <select value={notesForm.status} onChange={e => setNotesForm(f => ({ ...f, status: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="completed">Завършено</option>
              <option value="cancelled">Отказано</option>
            </select>
          </div>
          <Input label="Оценка (2–6)" type="number" min="2" max="6" value={notesForm.grade} onChange={e => setNotesForm(f => ({ ...f, grade: e.target.value }))} />
          <div>
            <label className="text-sm font-medium text-gray-700">Бележки</label>
            <textarea value={notesForm.instructor_notes} onChange={e => setNotesForm(f => ({ ...f, instructor_notes: e.target.value }))}
              rows={3} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
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
