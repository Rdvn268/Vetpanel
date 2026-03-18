'use client';
import { useState, useRef, useEffect } from 'react';
import { Search, Bell, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { patientApi, clientApi } from '@/lib/api';

interface SearchResult {
  type: 'patient' | 'client';
  id: string;
  name: string;
  sub: string;
}

export default function TopBar({ title }: { title?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      const [patients, clients] = await Promise.allSettled([
        patientApi.list({ search: query, limit: 5 }),
        clientApi.list({ search: query, limit: 5 }),
      ]);

      const out: SearchResult[] = [];
      if (patients.status === 'fulfilled') {
        patients.value.data.data?.forEach((p: { id: string; name: string; species: string; breed: string }) =>
          out.push({ type: 'patient', id: p.id, name: p.name, sub: `${p.species} ${p.breed || ''}`.trim() })
        );
      }
      if (clients.status === 'fulfilled') {
        clients.value.data.data?.forEach((c: { id: string; firstName: string; lastName: string; phone: string }) =>
          out.push({ type: 'client', id: c.id, name: `${c.firstName} ${c.lastName}`, sub: c.phone })
        );
      }
      setResults(out);
      setOpen(out.length > 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (r: SearchResult) => {
    setQuery('');
    setOpen(false);
    router.push(r.type === 'patient' ? `/dashboard/patients/${r.id}` : `/dashboard/clients/${r.id}`);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Arama */}
        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-72">
            <Search size={16} className="text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Hasta veya müşteri ara..."
              className="bg-transparent text-sm w-full outline-none"
            />
            {query && (
              <button onClick={() => { setQuery(''); setOpen(false); }}>
                <X size={14} className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          {open && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-50 max-h-64 overflow-y-auto">
              {results.map(r => (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => handleSelect(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left"
                >
                  <span className="text-lg">{r.type === 'patient' ? '🐾' : '👤'}</span>
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.sub}</p>
                  </div>
                  <span className="ml-auto text-xs text-gray-400">
                    {r.type === 'patient' ? 'Hasta' : 'Müşteri'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bildirimler */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
