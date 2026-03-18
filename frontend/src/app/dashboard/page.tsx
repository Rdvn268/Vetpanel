'use client';
import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { formatCurrency, formatDateTime, APPOINTMENT_STATUS, APPOINTMENT_TYPES } from '@/lib/utils';
import { Users, PawPrint, Calendar, TrendingUp, AlertTriangle, BedDouble, FileText, Package } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats {
  todayAppointments: number;
  totalClients: number;
  totalPatients: number;
  activeHospitalizations: number;
  monthlyRevenue: number;
  lowStockAlerts: number;
  overdueVaccinations: number;
  pendingInvoices: number;
}

interface Appointment {
  id: string;
  title: string;
  type: string;
  status: string;
  startTime: string;
  patient: { name: string; species: string };
  doctor: { firstName: string; lastName: string };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [revenue, setRevenue] = useState<{ date: string; revenue: number }[]>([]);

  useEffect(() => {
    dashboardApi.stats().then(r => setStats(r.data)).catch(console.error);
    dashboardApi.todayAppointments().then(r => setAppointments(r.data)).catch(console.error);
    dashboardApi.revenue('monthly').then(r => setRevenue(r.data)).catch(console.error);
  }, []);

  const statCards = stats ? [
    { label: 'Bugünkü Randevular', value: stats.todayAppointments, icon: Calendar, color: 'text-blue-600 bg-blue-50' },
    { label: 'Toplam Müşteri', value: stats.totalClients, icon: Users, color: 'text-green-600 bg-green-50' },
    { label: 'Toplam Hasta', value: stats.totalPatients, icon: PawPrint, color: 'text-purple-600 bg-purple-50' },
    { label: 'Aylık Gelir', value: formatCurrency(Number(stats.monthlyRevenue)), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', isText: true },
    { label: 'Yatış Hastaları', value: stats.activeHospitalizations, icon: BedDouble, color: 'text-orange-600 bg-orange-50' },
    { label: 'Bekleyen Fatura', value: stats.pendingInvoices, icon: FileText, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Düşük Stok', value: stats.lowStockAlerts, icon: Package, color: 'text-red-600 bg-red-50' },
    { label: 'Gecikmiş Aşı', value: stats.overdueVaccinations, icon: AlertTriangle, color: 'text-pink-600 bg-pink-50' },
  ] : [];

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, isText }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{label}</span>
                <div className={`p-2 rounded-lg ${color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className={`font-bold text-gray-900 ${isText ? 'text-lg' : 'text-2xl'}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bugünkü Randevular */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Bugünkü Randevular</h2>
              <a href="/dashboard/appointments" className="text-blue-600 text-sm hover:underline">Tümü</a>
            </div>
            <div className="divide-y divide-gray-50">
              {appointments.length === 0 && (
                <p className="p-6 text-center text-gray-400 text-sm">Bugün randevu yok</p>
              )}
              {appointments.map(apt => {
                const type = APPOINTMENT_TYPES[apt.type] || APPOINTMENT_TYPES.OTHER;
                const status = APPOINTMENT_STATUS[apt.status] || APPOINTMENT_STATUS.SCHEDULED;
                return (
                  <div key={apt.id} className="p-4 flex items-center gap-4">
                    <div className="text-center w-12">
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(apt.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{apt.patient.name}</p>
                      <p className="text-sm text-gray-500">{apt.title} • Dr. {apt.doctor.firstName} {apt.doctor.lastName}</p>
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

          {/* Aylık Gelir Grafiği */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Son 30 Gün Gelir</h2>
            </div>
            <div className="p-4">
              {revenue.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                  Henüz veri yok
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
