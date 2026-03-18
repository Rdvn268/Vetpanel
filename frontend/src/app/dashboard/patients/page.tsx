'use client';
import { useEffect, useState } from 'react';
import { patientApi, clientApi } from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { Plus, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { SPECIES_OPTIONS } from '@/lib/utils';

interface Patient {
  id: string;
  name: string;
  species: string;
  breed?: string;
  sex: string;
  isNeutered: boolean;
  photo?: string;
  client: { id: string; firstName: string; lastName: string; phone: string };
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

const SEX_LABELS: Record<string, string> = { MALE: 'Erkek', FEMALE: 'Dişi', UNKNOWN: '?' };
const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕', cat: '🐈', bird: '🦜', rabbit: '🐇', hamster: '🐹', reptile: '🦎', fish: '🐠', other: '🐾'
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', species: 'dog', breed: '', sex: 'UNKNOWN', birthDate: '',
    color: '', microchipNumber: '', isNeutered: false, notes: '', clientId: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async (q = '') => {
    setLoading(true);
    try {
      const res = await patientApi.list({ search: q, limit: 50 });
      setPatients(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    clientApi.list({ limit: 200 }).then(r => setClients(r.data.data));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await patientApi.create(form);
      setShowModal(false);
      setForm({ name: '', species: 'dog', breed: '', sex: 'UNKNOWN', birthDate: '', color: '', microchipNumber: '', isNeutered: false, notes: '', clientId: '' });
      load(search);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <TopBar title="Hastalar" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-80">
            <Search size={16} className="text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="İsim, tür veya mikroçip ile ara..."
              className="text-sm w-full outline-none"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus size={16} /> Yeni Hasta
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading && <p className="col-span-full text-center py-8 text-gray-400">Yükleniyor...</p>}
          {!loading && patients.length === 0 && <p className="col-span-full text-center py-8 text-gray-400">Hasta bulunamadı</p>}
          {patients.map(patient => (
            <Link key={patient.id} href={`/dashboard/patients/${patient.id}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-blue-200 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl">
                  {patient.photo
                    ? <img src={patient.photo} alt={patient.name} className="w-full h-full object-cover rounded-xl" />
                    : SPECIES_EMOJI[patient.species] || '🐾'
                  }
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{patient.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {SPECIES_OPTIONS.find(s => s.value === patient.species)?.label || patient.species}
                    {patient.breed ? ` · ${patient.breed}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {SEX_LABELS[patient.sex]}
                </span>
                {patient.isNeutered && (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Kısırlaştırılmış</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{patient.client.firstName} {patient.client.lastName}</span>
                <ChevronRight size={14} />
              </div>
            </Link>
          ))}
        </div>

        {/* Add Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold">Yeni Hasta Ekle</h2>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri *</label>
                  <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required>
                    <option value="">Müşteri seçin...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hayvan Adı *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tür *</label>
                    <select value={form.species} onChange={e => setForm({...form, species: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      {SPECIES_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cins</label>
                    <input value={form.breed} onChange={e => setForm({...form, breed: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cinsiyet</label>
                    <select value={form.sex} onChange={e => setForm({...form, sex: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="UNKNOWN">Bilinmiyor</option>
                      <option value="MALE">Erkek</option>
                      <option value="FEMALE">Dişi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doğum Tarihi</label>
                    <input type="date" value={form.birthDate} onChange={e => setForm({...form, birthDate: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Renk</label>
                    <input value={form.color} onChange={e => setForm({...form, color: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mikroçip</label>
                    <input value={form.microchipNumber} onChange={e => setForm({...form, microchipNumber: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="neutered" checked={form.isNeutered}
                    onChange={e => setForm({...form, isNeutered: e.target.checked})}
                    className="rounded" />
                  <label htmlFor="neutered" className="text-sm text-gray-700">Kısırlaştırılmış</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
                    İptal
                  </button>
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
