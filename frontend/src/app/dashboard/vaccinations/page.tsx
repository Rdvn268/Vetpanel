'use client';
import { useEffect, useState } from 'react';
import { vaccinationApi, patientApi } from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { Plus, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Vaccination {
  id: string;
  vaccineName: string;
  vaccineType?: string;
  dateAdministered: string;
  nextDueDate?: string;
  administeredBy?: string;
  patient: {
    id: string;
    name: string;
    species: string;
    client: { firstName: string; lastName: string; phone: string };
  };
}

interface Patient {
  id: string;
  name: string;
  species: string;
}

export default function VaccinationsPage() {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [overdue, setOverdue] = useState<Vaccination[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tab, setTab] = useState<'all' | 'overdue'>('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    patientId: '', vaccineName: '', vaccineType: '', batchNumber: '',
    manufacturer: '', dateAdministered: '', nextDueDate: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [vRes, oRes] = await Promise.all([
      vaccinationApi.list(),
      vaccinationApi.overdue(),
    ]);
    setVaccinations(vRes.data);
    setOverdue(oRes.data);
  };

  useEffect(() => {
    load();
    patientApi.list({ limit: 200 }).then(r => setPatients(r.data.data));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await vaccinationApi.create(form);
      setShowModal(false);
      setForm({ patientId: '', vaccineName: '', vaccineType: '', batchNumber: '', manufacturer: '', dateAdministered: '', nextDueDate: '', notes: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  const displayed = tab === 'all' ? vaccinations : overdue;

  return (
    <div>
      <TopBar title="Aşı Takibi" />
      <div className="p-6">
        {overdue.length > 0 && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">
              <strong>{overdue.length} hayvanın</strong> aşısı gecikmiş durumda!
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setTab('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'all' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}>
              Tüm Aşılar ({vaccinations.length})
            </button>
            <button onClick={() => setTab('overdue')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === 'overdue' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}>
              Gecikmiş ({overdue.length})
            </button>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Aşı Ekle
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hasta</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aşı</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Uygulama Tarihi</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sonraki Aşı</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sahip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Kayıt bulunamadı</td></tr>
              )}
              {displayed.map(v => {
                const isOverdue = v.nextDueDate && new Date(v.nextDueDate) < new Date();
                return (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{v.patient.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{v.patient.species}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{v.vaccineName}</p>
                      {v.vaccineType && <p className="text-xs text-gray-400">{v.vaccineType}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(v.dateAdministered)}</td>
                    <td className="px-4 py-3">
                      {v.nextDueDate ? (
                        <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                          {formatDate(v.nextDueDate)}
                          {isOverdue && ' (Gecikmiş)'}
                        </span>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {v.patient.client.firstName} {v.patient.client.lastName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Aşı Ekle</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aşı Adı *</label>
                  <input value={form.vaccineName} onChange={e => setForm({...form, vaccineName: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aşı Türü</label>
                    <input value={form.vaccineType} onChange={e => setForm({...form, vaccineType: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seri No</label>
                    <input value={form.batchNumber} onChange={e => setForm({...form, batchNumber: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Üretici</label>
                  <input value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Uygulama Tarihi *</label>
                    <input type="date" value={form.dateAdministered} onChange={e => setForm({...form, dateAdministered: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sonraki Aşı Tarihi</label>
                    <input type="date" value={form.nextDueDate} onChange={e => setForm({...form, nextDueDate: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
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
      </div>
    </div>
  );
}
