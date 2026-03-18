'use client';
import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function ReportsPage() {
  const [revenue, setRevenue] = useState<{ date: string; revenue: number }[]>([]);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    dashboardApi.revenue(period).then(r => setRevenue(r.data));
  }, [period]);

  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0);
  const avgDaily = revenue.length > 0 ? totalRevenue / revenue.length : 0;

  return (
    <div>
      <TopBar title="Raporlar" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Gelir Raporu</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${period === 'weekly' ? 'bg-white shadow' : 'text-gray-500'}`}>
              Bu Hafta
            </button>
            <button onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${period === 'monthly' ? 'bg-white shadow' : 'text-gray-500'}`}>
              Bu Ay
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Toplam Gelir', value: formatCurrency(totalRevenue) },
            { label: 'Günlük Ortalama', value: formatCurrency(avgDaily) },
            { label: 'İşlem Günü', value: `${revenue.length} gün` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-1">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-medium text-gray-700 mb-4">Günlük Gelir</h3>
          {revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Gelir']} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Bu dönem için veri bulunamadı
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
