'use client';
import { useEffect, useState } from 'react';
import { inventoryApi } from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { Plus, AlertTriangle, Search, Package } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku?: string;
  barcode?: string;
  quantity: number;
  unit: string;
  minQuantity: number;
  costPrice: number;
  sellPrice: number;
  expiryDate?: string;
  supplier?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  DRUG: 'İlaç', VACCINE: 'Aşı', CONSUMABLE: 'Sarf Malzeme',
  FOOD: 'Mama', EQUIPMENT: 'Ekipman', OTHER: 'Diğer',
};
const CATEGORY_COLORS: Record<string, string> = {
  DRUG: 'bg-blue-100 text-blue-700', VACCINE: 'bg-green-100 text-green-700',
  CONSUMABLE: 'bg-yellow-100 text-yellow-700', FOOD: 'bg-orange-100 text-orange-700',
  EQUIPMENT: 'bg-purple-100 text-purple-700', OTHER: 'bg-gray-100 text-gray-600',
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', category: 'DRUG', sku: '', barcode: '', quantity: '0', unit: 'adet',
    minQuantity: '5', costPrice: '', sellPrice: '', expiryDate: '', supplier: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await inventoryApi.list({ search, category });
    setItems(res.data);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, category]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await inventoryApi.create({
        ...form,
        quantity: Number(form.quantity),
        minQuantity: Number(form.minQuantity),
        costPrice: Number(form.costPrice),
        sellPrice: Number(form.sellPrice),
      });
      setShowModal(false);
      setForm({ name: '', category: 'DRUG', sku: '', barcode: '', quantity: '0', unit: 'adet', minQuantity: '5', costPrice: '', sellPrice: '', expiryDate: '', supplier: '', notes: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  const lowStock = items.filter(i => i.quantity <= i.minQuantity);

  return (
    <div>
      <TopBar title="Envanter" />
      <div className="p-6">
        {lowStock.length > 0 && (
          <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-orange-500" />
            <p className="text-sm text-orange-700">
              <strong>{lowStock.length} ürün</strong> kritik stok seviyesinde:{' '}
              {lowStock.slice(0, 3).map(i => i.name).join(', ')}
              {lowStock.length > 3 ? `...` : ''}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-xs">
              <Search size={16} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Ürün ara..." className="text-sm w-full outline-none" />
            </div>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Tüm Kategoriler</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Ürün Ekle
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Toplam Ürün', value: items.length, icon: Package, color: 'text-blue-600 bg-blue-50' },
            { label: 'Düşük Stok', value: lowStock.length, icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' },
            { label: 'Stok Değeri', value: formatCurrency(items.reduce((s, i) => s + i.quantity * Number(i.costPrice), 0)), icon: Package, color: 'text-green-600 bg-green-50', isText: true },
            { label: 'Satış Değeri', value: formatCurrency(items.reduce((s, i) => s + i.quantity * Number(i.sellPrice), 0)), icon: Package, color: 'text-purple-600 bg-purple-50', isText: true },
          ].map(({ label, value, icon: Icon, color, isText }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{label}</span>
                <div className={`p-1.5 rounded-lg ${color}`}><Icon size={14} /></div>
              </div>
              <p className={`font-bold ${isText ? 'text-base' : 'text-2xl'} text-gray-900`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ürün</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stok</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Alış Fiyatı</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Satış Fiyatı</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Ürün bulunamadı</td></tr>}
              {items.map(item => {
                const isLow = item.quantity <= item.minQuantity;
                const isExpiring = item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 ${isLow ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.OTHER}`}>
                        {CATEGORY_LABELS[item.category] || 'Diğer'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.quantity} {item.unit}
                      </span>
                      {isLow && <span className="text-xs text-red-400 ml-1">(Düşük)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(Number(item.costPrice))}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{formatCurrency(Number(item.sellPrice))}</td>
                    <td className="px-4 py-3">
                      {item.expiryDate ? (
                        <span className={`text-sm ${isExpiring ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {formatDate(item.expiryDate)}
                        </span>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Yeni Ürün Ekle</h2>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                    <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birim</label>
                    <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      {['adet', 'kutu', 'şişe', 'ampul', 'tablet', 'ml', 'mg', 'kg', 'g'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Stok</label>
                    <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stok</label>
                    <input type="number" value={form.minQuantity} onChange={e => setForm({...form, minQuantity: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alış Fiyatı (₺) *</label>
                    <input type="number" step="0.01" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Satış Fiyatı (₺) *</label>
                    <input type="number" step="0.01" value={form.sellPrice} onChange={e => setForm({...form, sellPrice: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKT</label>
                    <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tedarikçi</label>
                    <input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
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
