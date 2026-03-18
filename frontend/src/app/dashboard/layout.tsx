'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, setAuth, logout } = useAuthStore();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Supabase oturum değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        await logout();
      } else if (session && event === 'TOKEN_REFRESHED') {
        // Token yenilendiğinde store'u güncelle
        localStorage.setItem('vetpanel_token', session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, [logout]);

  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else {
      setChecking(false);
    }
  }, [token, router]);

  if (checking || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🐾</div>
          <p className="text-gray-400 text-sm">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
