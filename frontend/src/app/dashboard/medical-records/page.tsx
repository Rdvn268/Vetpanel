'use client';
import { useEffect, useState } from 'react';
import { patientApi, medicalRecordApi } from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { Plus, FileText, Search } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface Patient {
  id: string;
  name: string;
  species: string;
}

interface MedicalRecord {
  id: string;
  date: string;
  chiefComplaint?: string;
  symptoms?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  notes?: string;
  doctor: { firstName: string; lastName: string };
  patient?: { id: string; name: string; species: string };
}

export default function MedicalRecordsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    patientId: '', chiefComplaint: '', symptoms: '', physicalExam: '',
    diagnosis: '', treatmentPlan: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    patientApi.list({ limit: 200 }).then(r => setPatients(r.data.data));
  }, []);

  useEffect(() => {
    if (!selectedPatient) { setRecords([]); return; }
    medicalRecordApi.list(selectedPatient).then(r => setRecords(r.data));
  }, [selectedPatient]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await medicalRecordApi.create({ ...form, patientId: form.patientId || selectedPatient });
      setShowModal(false);
      setForm({ patientId: '', chiefComplaint: '', symptoms: '', physicalExam: '', diagnosis: '', treatmentPlan: '', notes: '' });
      if (selectedPatient) medicalRecordApi.list(selectedPatient).then(r => setRecords(r.data));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <TopBar title="Tıbbi Kayıtlar" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <Search size={16} className="text-gray-400" />
              <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)}
                className="text-sm outline-none bg-transparent min-w-[200px]">
                <option value="">Hasta seçin...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
              </select>
            </div>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Muayene Kaydı
          </button>
        </div>

        {!selectedPatient && (
          <div className="text-center py-16 text-gray-400">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <p>Tıbbi kayıtları görmek için hasta seçin</p>
          </div>
        )}

        {selectedPatient && (
          <div className="space-y-4">
            {records.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p>Bu hasta için kayıt bulunamadı</p>
              </div>
            )}
            {records.map((record, idx) => (
              <div key={record.id} className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      {idx < records.length - 1 && <div className="w-0.5 h-full bg-gray-200" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{formatDateTime(record.date)}</p>
                      <p className="text-xs text-gray-400">Dr. {record.doctor.firstName} {record.doctor.lastName}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {record.chiefComplaint && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase mb-1">Şikayet</p>
                      <p className="text-gray-700">{record.chiefComplaint}</p>
                    </div>
                  )}
                  {record.symptoms && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase mb-1">Semptomlar</p>
                      <p className="text-gray-700">{record.symptoms}</p>
                    </div>
                  )}
                  {record.diagnosis && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase mb-1">Tanı</p>
                      <p className="text-gray-900 font-medium">{record.diagnosis}</p>
                    </div>
                  )}
                  {record.treatmentPlan && (
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase mb-1">Tedavi Planı</p>
                      <p className="text-gray-700">{record.treatmentPlan}</p>
                    </div>
                  )}
                  {record.notes && (
                    <div className="md:col-span-2">
                      <p className="text-xs font-medium text-gray-400 uppercase mb-1">Notlar</p>
                      <p className="text-gray-600">{record.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Record Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Muayene Kaydı</h2>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hasta *</label>
                  <select value={form.patientId || selectedPatient}
                    onChange={e => setForm({...form, patientId: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required>
                    <option value="">Hasta seçin...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
                  </select>
                </div>
                {[
                  { key: 'chiefComplaint', label: 'Baş Şikayet', rows: 2 },
                  { key: 'symptoms', label: 'Semptomlar', rows: 2 },
                  { key: 'physicalExam', label: 'Fiziksel Muayene', rows: 3 },
                  { key: 'diagnosis', label: 'Tanı', rows: 2 },
                  { key: 'treatmentPlan', label: 'Tedavi Planı', rows: 3 },
                  { key: 'notes', label: 'Notlar', rows: 2 },
                ].map(({ key, label, rows }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <textarea
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm({...form, [key]: e.target.value})}
                      rows={rows}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                  </div>
                ))}
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
