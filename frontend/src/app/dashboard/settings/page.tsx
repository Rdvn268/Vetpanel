'use client';
import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { useAuthStore } from '@/lib/store';
import { Settings, User, Building2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'profile' | 'clinic'>('profile');

  return (
    <div>
      <TopBar title="Ayarlar" />
      <div className="p-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
          {[
            { key: 'profile', label: 'Profil', icon: User },
            { key: 'clinic', label: 'Klinik', icon: Building2 },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as typeof tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === key ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-lg">
            <h2 className="font-semibold mb-4">Profil Bilgileri</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                  <input defaultValue={user?.firstName}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                  <input defaultValue={user?.lastName}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input type="email" defaultValue={user?.email}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <input value={user?.role || ''} disabled
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 outline-none" />
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Kaydet
              </button>
            </div>
          </div>
        )}

        {tab === 'clinic' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-lg">
            <h2 className="font-semibold mb-4">Klinik Bilgileri</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Klinik Adı</label>
                <input defaultValue={user?.clinic?.name}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input type="email" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <textarea rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Kaydet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
