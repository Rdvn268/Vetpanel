'use client';
import { useEffect, useState } from 'react';
import { hospitalizationApi, patientApi } from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { Plus, BedDouble } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface Hospitalization {
  id: string;
  cageNumber?: string;
  admittedAt: string;
  reason?: string;
  status: string;
  patient: {
    id: string;
    name: string;
    species: string;
    photo?: string;
    client: { firstName: string; lastName: string; phone: string };
  };
  dailyRecords: { id: string; date: string; treatments?: string; notes?: string }[];
}

interface Patient {
  id: string;
  name: string;
  species: string;
}

export default function HospitalizationsPage() {
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState<string | null>(null);
  const [form, setForm] = useState({ patientId: '', cageNumber: '', reason: '', notes: '' });
  const [recordForm, setRecordForm] = useState({ temperature: '', weight: '', treatments: '', fluidTherapy: '', feeding: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await hospitalizationApi.list('ACTIVE');
    setHospitalizations(res.data);
  };

  useEffect(() => {
    load();
    patientApi.list({ limit: 200 }).then(r => setPatients(r.data.data));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hospitalizationApi.create(form);
      setShowModal(false);
      setForm({ patientId: '', cageNumber: '', reason: '', notes: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRecordModal) return;
    setSaving(true);
    try {
      await hospitalizationApi.addRecord(showRecordModal, recordForm);
      setShowRecordModal(null);
      setRecordForm({ temperature: '', weight: '', treatments: '', fluidTherapy: '', feeding: '', notes: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDischarge = async (id: string) => {
    if (!confirm('Hastayı taburcu etmek istediğinizden emin misiniz?')) return;
    await hospitalizationApi.discharge(id);
    load();
  };

  return (
    <div>
      <TopBar title="Yatış Hastaları" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BedDouble size={20} className="text-blue-600" />
            <span className="text-gray-600 font-medium">{hospitalizations.length} aktif yatış</span>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Yeni Yatış
          </button>
        </div>

        {hospitalizations.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <BedDouble size={40} className="mx-auto mb-3 opacity-30" />
            <p>Şu an yatış hastası yok</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hospitalizations.map(hosp => (
            <div key={hosp.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
                    {hosp.patient.species === 'dog' ? '🐕' : hosp.patient.species === 'cat' ? '🐈' : '🐾'}
                  </div>
                  <div>
                    <p className="font-semibold">{hosp.patient.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{hosp.patient.species}</p>
                  </div>
                </div>
                {hosp.cageNumber && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">Kafes: {hosp.cageNumber}</span>
                )}
              </div>

              {hosp.reason && (
                <p className="text-sm text-gray-600 mb-3 bg-gray-50 rounded-lg p-2">{hosp.reason}</p>
              )}

              <div className="text-xs text-gray-400 mb-4">
                <p>Giriş: {formatDateTime(hosp.admittedAt)}</p>
                <p>Sahip: {hosp.patient.client.firstName} {hosp.patient.client.lastName}</p>
                <p>Tel: {hosp.patient.client.phone}</p>
              </div>

              {hosp.dailyRecords[0] && (
                <div className="bg-blue-50 rounded-lg p-3 mb-4 text-xs text-blue-700">
                  <p className="font-medium">Son Kayıt ({formatDateTime(hosp.dailyRecords[0].date)})</p>
                  {hosp.dailyRecords[0].treatments && <p>Tedavi: {hosp.dailyRecords[0].treatments}</p>}
                  {hosp.dailyRecords[0].notes && <p>{hosp.dailyRecords[0].notes}</p>}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setShowRecordModal(hosp.id)}
                  className="flex-1 text-xs border border-blue-300 text-blue-600 py-1.5 rounded-lg hover:bg-blue-50">
                  Kayıt Ekle
                </button>
                <button onClick={() => handleDischarge(hosp.id)}
                  className="flex-1 text-xs bg-green-600 text-white py-1.5 rounded-lg hover:bg-green-700">
                  Taburcu Et
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* New Hospitalization Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Yeni Yatış</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kafes No</label>
                  <input value={form.cageNumber} onChange={e => setForm({...form, cageNumber: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yatış Nedeni</label>
                  <textarea value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
                    rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">İptal</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Daily Record Modal */}
        {showRecordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Günlük Kayıt</h2>
              </div>
              <form onSubmit={handleAddRecord} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ateş (°C)</label>
                    <input type="number" step="0.1" value={recordForm.temperature} onChange={e => setRecordForm({...recordForm, temperature: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ağırlık (kg)</label>
                    <input type="number" step="0.1" value={recordForm.weight} onChange={e => setRecordForm({...recordForm, weight: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yapılan Tedaviler</label>
                  <textarea value={recordForm.treatments} onChange={e => setRecordForm({...recordForm, treatments: e.target.value})}
                    rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sıvı Tedavisi</label>
                  <input value={recordForm.fluidTherapy} onChange={e => setRecordForm({...recordForm, fluidTherapy: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beslenme</label>
                  <input value={recordForm.feeding} onChange={e => setRecordForm({...recordForm, feeding: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                  <textarea value={recordForm.notes} onChange={e => setRecordForm({...recordForm, notes: e.target.value})}
                    rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowRecordModal(null)}
                    className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">İptal</button>
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
