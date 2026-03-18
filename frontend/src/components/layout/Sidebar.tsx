'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, PawPrint, Calendar, FileText,
  Syringe, FlaskConical, Package, Receipt, BedDouble,
  BarChart3, Settings, LogOut, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/clients', label: 'Müşteriler', icon: Users },
  { href: '/dashboard/patients', label: 'Hastalar', icon: PawPrint },
  { href: '/dashboard/appointments', label: 'Randevular', icon: Calendar },
  { href: '/dashboard/medical-records', label: 'Tıbbi Kayıtlar', icon: FileText },
  { href: '/dashboard/vaccinations', label: 'Aşılar', icon: Syringe },
  { href: '/dashboard/lab-tests', label: 'Laboratuvar', icon: FlaskConical },
  { href: '/dashboard/hospitalizations', label: 'Yatış', icon: BedDouble },
  { href: '/dashboard/inventory', label: 'Envanter', icon: Package },
  { href: '/dashboard/invoices', label: 'Faturalar', icon: Receipt },
  { href: '/dashboard/reports', label: 'Raporlar', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Ayarlar', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      'bg-gray-900 text-white flex flex-col transition-all duration-300 min-h-screen',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <div>
              <p className="font-bold text-sm">VetPanel</p>
              <p className="text-xs text-gray-400 truncate max-w-[140px]">{user?.clinic?.name}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-700 transition-colors"
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors text-sm',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        {!collapsed && user && (
          <div className="mb-3">
            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors w-full text-sm"
        >
          <LogOut size={18} />
          {!collapsed && <span>Çıkış Yap</span>}
        </button>
      </div>
    </aside>
  );
}
