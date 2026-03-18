'use client';
import { useEffect, useState } from 'react';
import { labTestApi, patientApi } from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { Plus, FlaskConical } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface LabTest {
  id: string;
  testName: string;
  testType: string;
  requestDate: string;
  resultDate?: string;
  status: string;
  results: { id: string; paramName: string; value?: string; unit?: string; refRangeLow?: string; refRangeHigh?: string; isAbnormal: boolean }[];
  patient: { id: string; name: string; species: string };
}

interface Patient {
  id: string;
  name: string;
  species: string;
}

const TEST_TYPES = ['Hemogram', 'Biyokimya', 'İdrar Analizi', 'Parazitoloji', 'Seroloji', 'Kültür-Antibiyogram', 'Diğer'];

export default function LabTestsPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState<string | null>(null);
  const [form, setForm] = useState({ patientId: '', testName: '', testType: '', notes: '' });
  const [results, setResults] = useState([{ paramName: '', value: '', unit: '', refRangeLow: '', refRangeHigh: '', isAbnormal: false }]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    // Tüm testleri al (demo amaçlı - gerçekte patientId ile filtrelenmeli)
    setTests([]);
  };

  useEffect(() => {
    patientApi.list({ limit: 200 }).then(r => setPatients(r.data.data));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await labTestApi.create(form);
      setShowModal(false);
      setForm({ patientId: '', testName: '', testType: '', notes: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleAddResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResultModal) return;
    setSaving(true);
    try {
      await labTestApi.addResults(showResultModal, results);
      setShowResultModal(null);
      setResults([{ paramName: '', value: '', unit: '', refRangeLow: '', refRangeHigh: '', isAbnormal: false }]);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <TopBar title="Laboratuvar" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FlaskConical size={20} className="text-blue-600" />
            <span className="text-gray-600 font-medium">Laboratuvar Test Yönetimi</span>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Test İste
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 text-center text-gray-400">
            <FlaskConical size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Lab testlerini görüntülemek için hasta profiline gidin</p>
            <p className="text-xs mt-1">Her hastanın profilinde Laboratuvar sekmesini bulabilirsiniz</p>
          </div>
        </div>

        {/* New Test Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Lab Testi İste</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Adı *</label>
                  <input value={form.testName} onChange={e => setForm({...form, testName: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Türü *</label>
                  <select value={form.testType} onChange={e => setForm({...form, testType: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required>
                    <option value="">Seçin...</option>
                    {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">İptal</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {saving ? 'Kaydediliyor...' : 'Test İste'}
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
