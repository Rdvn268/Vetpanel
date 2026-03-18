'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { clientApi } from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import Link from 'next/link';
import { Phone, Mail, MapPin, PawPrint, FileText, Receipt, ArrowLeft } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  balance: number;
  patients: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    sex: string;
    isNeutered: boolean;
    appointments: { id: string; title: string; startTime: string; status: string }[];
    vaccinations: { id: string; vaccineName: string; dateAdministered: string }[];
  }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    date: string;
  }[];
}

const SEX_LABELS: Record<string, string> = { MALE: 'Erkek', FEMALE: 'Dişi', UNKNOWN: 'Bilinmiyor' };

export default function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientApi.get(id as string).then(r => setClient(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-400">Yükleniyor...</div>;
  if (!client) return <div className="p-8 text-center text-red-500">Müşteri bulunamadı</div>;

  return (
    <div>
      <TopBar title="Müşteri Detayı" />
      <div className="p-6 space-y-6">
        <Link href="/dashboard/clients" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Müşterilere Dön
        </Link>

        {/* Client Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                {client.firstName[0]}{client.lastName[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{client.firstName} {client.lastName}</h1>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
                  <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 hover:text-blue-600">
                    <Phone size={14} />{client.phone}
                  </a>
                  {client.email && (
                    <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-blue-600">
                      <Mail size={14} />{client.email}
                    </a>
                  )}
                  {client.address && (
                    <span className="flex items-center gap-1.5"><MapPin size={14} />{client.address}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Bakiye</p>
              <p className={`text-2xl font-bold ${Number(client.balance) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(Number(client.balance))}
              </p>
            </div>
          </div>
          {client.notes && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">{client.notes}</div>
          )}
        </div>

        {/* Patients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2"><PawPrint size={18} /> Hayvanlar ({client.patients.length})</h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.patients.map(p => (
              <Link key={p.id} href={`/dashboard/patients/${p.id}`}
                className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-xl">
                    {p.species === 'dog' ? '🐕' : p.species === 'cat' ? '🐈' : p.species === 'bird' ? '🦜' : '🐾'}
                  </div>
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.species} {p.breed ? `· ${p.breed}` : ''} · {SEX_LABELS[p.sex]} {p.isNeutered ? '· Kısırlaştırılmış' : ''}</p>
                  </div>
                </div>
                {p.appointments.length > 0 && (
                  <p className="text-xs text-gray-400">Son randevu: {formatDate(p.appointments[0].startTime)}</p>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Invoices */}
        {client.invoices.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2"><Receipt size={18} /> Son Faturalar</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {client.invoices.map(inv => (
                <div key={inv.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-400">{formatDate(inv.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(Number(inv.totalAmount))}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                      inv.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {inv.status === 'PAID' ? 'Ödendi' : inv.status === 'PARTIAL' ? 'Kısmi' : 'Bekliyor'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
