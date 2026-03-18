'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { patientApi, medicalRecordApi, vaccinationApi } from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import Link from 'next/link';
import { ArrowLeft, Weight, Syringe, FileText, FlaskConical, Calendar } from 'lucide-react';
import { formatDate, formatDateTime, APPOINTMENT_STATUS, APPOINTMENT_TYPES, SPECIES_OPTIONS } from '@/lib/utils';

interface Patient {
  id: string;
  name: string;
  species: string;
  breed?: string;
  sex: string;
  birthDate?: string;
  color?: string;
  microchipNumber?: string;
  isNeutered: boolean;
  isDeceased: boolean;
  notes?: string;
  photo?: string;
  client: { id: string; firstName: string; lastName: string; phone: string };
  weightHistory: { id: string; weight: number; unit: string; date: string }[];
  vaccinations: { id: string; vaccineName: string; dateAdministered: string; nextDueDate?: string }[];
  appointments: { id: string; title: string; type: string; status: string; startTime: string; doctor: { firstName: string; lastName: string } }[];
  medicalRecords: { id: string; date: string; diagnosis?: string; chiefComplaint?: string; doctor: { firstName: string; lastName: string } }[];
  labTests: { id: string; testName: string; testType: string; requestDate: string; status: string }[];
  hospitalizations: { id: string; admittedAt: string; status: string; reason?: string }[];
}

const SEX_LABELS: Record<string, string> = { MALE: 'Erkek', FEMALE: 'Dişi', UNKNOWN: 'Bilinmiyor' };
const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕', cat: '🐈', bird: '🦜', rabbit: '🐇', hamster: '🐹', reptile: '🦎', fish: '🐠', other: '🐾'
};

export default function PatientDetailPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [tab, setTab] = useState<'timeline' | 'vaccinations' | 'labs' | 'appointments'>('timeline');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientApi.get(id as string).then(r => setPatient(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-400">Yükleniyor...</div>;
  if (!patient) return <div className="p-8 text-center text-red-500">Hasta bulunamadı</div>;

  const age = patient.birthDate
    ? Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const lastWeight = patient.weightHistory[0];

  return (
    <div>
      <TopBar title="Hasta Detayı" />
      <div className="p-6 space-y-6">
        <Link href="/dashboard/patients" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Hastalara Dön
        </Link>

        {/* Patient Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center text-4xl flex-shrink-0">
              {patient.photo
                ? <img src={patient.photo} alt={patient.name} className="w-full h-full object-cover rounded-2xl" />
                : SPECIES_EMOJI[patient.species] || '🐾'
              }
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                {patient.isDeceased && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Vefat</span>}
              </div>
              <p className="text-gray-500 mb-3">
                {SPECIES_OPTIONS.find(s => s.value === patient.species)?.label || patient.species}
                {patient.breed ? ` · ${patient.breed}` : ''}
                {' · '}{SEX_LABELS[patient.sex]}
                {patient.isNeutered ? ' · Kısırlaştırılmış' : ''}
                {age !== null ? ` · ${age} yaş` : ''}
                {patient.color ? ` · ${patient.color}` : ''}
              </p>
              <div className="flex flex-wrap gap-3">
                {patient.microchipNumber && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                    Mikroçip: {patient.microchipNumber}
                  </span>
                )}
                {lastWeight && (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Weight size={11} />{Number(lastWeight.weight)} {lastWeight.unit}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Sahip</p>
              <Link href={`/dashboard/clients/${patient.client.id}`} className="text-blue-600 font-medium hover:underline">
                {patient.client.firstName} {patient.client.lastName}
              </Link>
              <p className="text-sm text-gray-500">{patient.client.phone}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            {[
              { key: 'timeline', label: 'Tıbbi Geçmiş', icon: FileText },
              { key: 'vaccinations', label: `Aşılar (${patient.vaccinations.length})`, icon: Syringe },
              { key: 'labs', label: `Lab Testleri (${patient.labTests.length})`, icon: FlaskConical },
              { key: 'appointments', label: `Randevular (${patient.appointments.length})`, icon: Calendar },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key as typeof tab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={15} />{label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {tab === 'timeline' && (
          <div className="space-y-4">
            {patient.medicalRecords.length === 0 && (
              <p className="text-center py-8 text-gray-400">Henüz tıbbi kayıt yok</p>
            )}
            {patient.medicalRecords.map(record => (
              <div key={record.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium text-gray-800">{formatDateTime(record.date)}</span>
                  </div>
                  <span className="text-xs text-gray-400">Dr. {record.doctor.firstName} {record.doctor.lastName}</span>
                </div>
                {record.chiefComplaint && <p className="text-sm text-gray-600 mb-1"><strong>Şikayet:</strong> {record.chiefComplaint}</p>}
                {record.diagnosis && <p className="text-sm text-gray-800 font-medium"><strong>Tanı:</strong> {record.diagnosis}</p>}
              </div>
            ))}
          </div>
        )}

        {tab === 'vaccinations' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="divide-y divide-gray-50">
              {patient.vaccinations.length === 0 && <p className="text-center py-8 text-gray-400">Aşı kaydı yok</p>}
              {patient.vaccinations.map(v => (
                <div key={v.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{v.vaccineName}</p>
                    <p className="text-sm text-gray-500">{formatDate(v.dateAdministered)}</p>
                  </div>
                  {v.nextDueDate && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Sonraki</p>
                      <p className={`text-sm font-medium ${new Date(v.nextDueDate) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                        {formatDate(v.nextDueDate)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'labs' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="divide-y divide-gray-50">
              {patient.labTests.length === 0 && <p className="text-center py-8 text-gray-400">Lab testi yok</p>}
              {patient.labTests.map(t => (
                <div key={t.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.testName}</p>
                    <p className="text-sm text-gray-500">{t.testType} · {formatDate(t.requestDate)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    t.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {t.status === 'COMPLETED' ? 'Tamamlandı' : 'Bekliyor'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'appointments' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="divide-y divide-gray-50">
              {patient.appointments.length === 0 && <p className="text-center py-8 text-gray-400">Randevu yok</p>}
              {patient.appointments.map(apt => {
                const type = APPOINTMENT_TYPES[apt.type] || APPOINTMENT_TYPES.OTHER;
                const status = APPOINTMENT_STATUS[apt.status] || APPOINTMENT_STATUS.SCHEDULED;
                return (
                  <div key={apt.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{apt.title}</p>
                      <p className="text-sm text-gray-500">{formatDateTime(apt.startTime)} · Dr. {apt.doctor.firstName} {apt.doctor.lastName}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${type.color}`}>{type.label}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
