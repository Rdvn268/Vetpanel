'use client';
import { useEffect, useState } from 'react';
import { appointmentApi, patientApi, clientApi } from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { tr } from 'date-fns/locale';
import { APPOINTMENT_TYPES } from '@/lib/utils';

interface Appointment {
  id: string;
  title: string;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  notes?: string;
  patient: { id: string; name: string; species: string };
  doctor: { id: string; firstName: string; lastName: string };
}

interface Patient {
  id: string;
  name: string;
  species: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00-19:00

export default function AppointmentsPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    patientId: '', doctorId: '', title: '', type: 'CHECKUP',
    startTime: '', endTime: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const load = async () => {
    const start = weekStart.toISOString();
    const end = addDays(weekStart, 6).toISOString();
    const res = await appointmentApi.list({ startDate: start, endDate: end });
    setAppointments(res.data);
  };

  useEffect(() => {
    load();
    patientApi.list({ limit: 200 }).then(r => setPatients(r.data.data));
  }, [weekStart]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await appointmentApi.create(form);
      setShowModal(false);
      setForm({ patientId: '', doctorId: '', title: '', type: 'CHECKUP', startTime: '', endTime: '', notes: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  const getDayAppointments = (day: Date) =>
    appointments.filter(a => isSameDay(new Date(a.startTime), day));

  return (
    <div>
      <TopBar title="Randevular" />
      <div className="p-6">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setWeekStart(subWeeks(weekStart, 1))}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-base font-medium text-gray-800">
              {format(weekStart, 'd MMMM', { locale: tr })} - {format(addDays(weekStart, 6), 'd MMMM yyyy', { locale: tr })}
            </h2>
            <button onClick={() => setWeekStart(addWeeks(weekStart, 1))}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="text-sm text-blue-600 hover:underline ml-2">Bu Hafta</button>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Yeni Randevu
          </button>
        </div>

        {/* Weekly Calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-8 border-b border-gray-100">
            <div className="py-3 px-3 text-xs text-gray-400" />
            {weekDays.map(day => (
              <div key={day.toISOString()}
                className={`py-3 text-center border-l border-gray-100 ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''}`}>
                <p className="text-xs text-gray-400 capitalize">{format(day, 'EEE', { locale: tr })}</p>
                <p className={`text-sm font-semibold ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-800'}`}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="overflow-y-auto max-h-[600px]">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b border-gray-50 min-h-[60px]">
                <div className="px-3 py-2 text-xs text-gray-400 text-right pr-3 pt-2">
                  {String(hour).padStart(2, '0')}:00
                </div>
                {weekDays.map(day => {
                  const dayApts = getDayAppointments(day).filter(a => {
                    const h = new Date(a.startTime).getHours();
                    return h === hour;
                  });
                  return (
                    <div key={day.toISOString()}
                      className={`border-l border-gray-100 p-1 ${isSameDay(day, new Date()) ? 'bg-blue-50/30' : ''}`}>
                      {dayApts.map(apt => {
                        const type = APPOINTMENT_TYPES[apt.type] || APPOINTMENT_TYPES.OTHER;
                        return (
                          <div key={apt.id}
                            className={`text-xs p-1.5 rounded mb-1 cursor-pointer ${type.color} truncate`}
                            title={`${apt.patient.name} - ${apt.title}`}
                          >
                            <p className="font-medium truncate">{apt.patient.name}</p>
                            <p className="truncate opacity-75">{apt.title}</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Today's List */}
        <div className="mt-6">
          <h3 className="font-semibold text-gray-800 mb-3">Bugünkü Randevular</h3>
          <div className="space-y-2">
            {getDayAppointments(new Date()).length === 0 && (
              <p className="text-gray-400 text-sm">Bugün randevu yok</p>
            )}
            {getDayAppointments(new Date()).map(apt => {
              const type = APPOINTMENT_TYPES[apt.type] || APPOINTMENT_TYPES.OTHER;
              return (
                <div key={apt.id} className="bg-white rounded-lg border border-gray-100 p-3 flex items-center gap-4">
                  <div className="text-sm font-medium text-gray-600 w-14">
                    {format(new Date(apt.startTime), 'HH:mm')}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${type.color}`}>{type.label}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{apt.patient.name}</p>
                    <p className="text-xs text-gray-400">{apt.title} · Dr. {apt.doctor.firstName} {apt.doctor.lastName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* New Appointment Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold">Yeni Randevu</h2>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta *</label>
                  <select value={form.patientId} onChange={e => setForm({...form, patientId: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required>
                    <option value="">Hasta seçin...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                  <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tür</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {Object.entries(APPOINTMENT_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç *</label>
                    <input type="datetime-local" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş *</label>
                    <input type="datetime-local" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">İptal</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
