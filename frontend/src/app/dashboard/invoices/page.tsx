'use client';
import { useEffect, useState } from 'react';
import { invoiceApi, clientApi, inventoryApi } from '@/lib/api';
import TopBar from '@/components/layout/TopBar';
import { Plus, Search } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  client: { firstName: string; lastName: string; phone: string };
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

interface InventoryItem {
  id: string;
  name: string;
  sellPrice: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-700' },
  PARTIAL: { label: 'Kısmi Ödendi', color: 'bg-blue-100 text-blue-700' },
  PAID: { label: 'Ödendi', color: 'bg-green-100 text-green-700' },
  OVERDUE: { label: 'Gecikmiş', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'İptal', color: 'bg-gray-100 text-gray-600' },
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<string | null>(null);
  const [form, setForm] = useState({ clientId: '', notes: '', dueDate: '' });
  const [lineItems, setLineItems] = useState([{ description: '', quantity: 1, unitPrice: '', inventoryItemId: '' }]);
  const [payForm, setPayForm] = useState({ amount: '', method: 'CASH', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await invoiceApi.list({ status: statusFilter });
    setInvoices(res.data);
  };

  useEffect(() => {
    load();
    clientApi.list({ limit: 200 }).then(r => setClients(r.data.data));
    inventoryApi.list().then(r => setInventoryItems(r.data));
  }, []);

  useEffect(() => { load(); }, [statusFilter]);

  const handleAddLine = () => setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: '', inventoryItemId: '' }]);
  const handleRemoveLine = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i));

  const total = lineItems.reduce((s, l) => s + l.quantity * (Number(l.unitPrice) || 0), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoiceApi.create({
        ...form,
        items: lineItems.map(l => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: Number(l.unitPrice),
          inventoryItemId: l.inventoryItemId || undefined,
        })),
      });
      setShowModal(false);
      setForm({ clientId: '', notes: '', dueDate: '' });
      setLineItems([{ description: '', quantity: 1, unitPrice: '', inventoryItemId: '' }]);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal) return;
    setSaving(true);
    try {
      await invoiceApi.addPayment(showPayModal, payForm);
      setShowPayModal(null);
      setPayForm({ amount: '', method: 'CASH', notes: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  const filtered = invoices.filter(inv =>
    !search || inv.invoiceNumber.includes(search) ||
    `${inv.client.firstName} ${inv.client.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <TopBar title="Faturalar" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-64">
              <Search size={16} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Fatura veya müşteri ara..." className="text-sm w-full outline-none" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none">
              <option value="">Tüm Durumlar</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Fatura Oluştur
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Fatura No</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tarih</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Toplam</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ödenen</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Fatura bulunamadı</td></tr>}
              {filtered.map(inv => {
                const st = STATUS_LABELS[inv.status] || STATUS_LABELS.PENDING;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono font-medium">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{inv.client.firstName} {inv.client.lastName}</p>
                      <p className="text-xs text-gray-400">{inv.client.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(inv.date)}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(Number(inv.totalAmount))}</td>
                    <td className="px-4 py-3 text-sm text-green-600">{formatCurrency(Number(inv.paidAmount))}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                        <button onClick={() => setShowPayModal(inv.id)}
                          className="text-xs text-blue-600 hover:underline">Ödeme Al</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Create Invoice Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Fatura Oluştur</h2>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri *</label>
                    <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required>
                      <option value="">Müşteri seçin...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vade Tarihi</label>
                    <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Ürünler / Hizmetler</label>
                    <button type="button" onClick={handleAddLine}
                      className="text-xs text-blue-600 hover:underline">+ Satır Ekle</button>
                  </div>
                  <div className="space-y-2">
                    {lineItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <input
                            value={item.description}
                            onChange={e => {
                              const updated = [...lineItems];
                              updated[i].description = e.target.value;
                              setLineItems(updated);
                            }}
                            placeholder="Açıklama"
                            className="w-full border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="col-span-2">
                          <input type="number" min="1"
                            value={item.quantity}
                            onChange={e => {
                              const updated = [...lineItems];
                              updated[i].quantity = Number(e.target.value);
                              setLineItems(updated);
                            }}
                            placeholder="Adet"
                            className="w-full border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="col-span-3">
                          <input type="number" step="0.01"
                            value={item.unitPrice}
                            onChange={e => {
                              const updated = [...lineItems];
                              updated[i].unitPrice = e.target.value;
                              setLineItems(updated);
                            }}
                            placeholder="Birim Fiyat"
                            className="w-full border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="col-span-1 text-sm text-gray-500 font-medium">
                          {formatCurrency(item.quantity * (Number(item.unitPrice) || 0))}
                        </div>
                        <div className="col-span-1">
                          {lineItems.length > 1 && (
                            <button type="button" onClick={() => handleRemoveLine(i)}
                              className="text-red-400 hover:text-red-600 text-sm">✕</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-right">
                    <span className="text-base font-bold">Toplam: {formatCurrency(total)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">İptal</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {saving ? 'Kaydediliyor...' : 'Fatura Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPayModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Ödeme Al</h2>
              </div>
              <form onSubmit={handlePay} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺) *</label>
                  <input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
                  <select value={payForm.method} onChange={e => setPayForm({...payForm, method: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="CASH">Nakit</option>
                    <option value="CREDIT_CARD">Kredi Kartı</option>
                    <option value="BANK_TRANSFER">Banka Transferi</option>
                    <option value="INSURANCE">Sigorta</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowPayModal(null)}
                    className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">İptal</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                    {saving ? 'Kaydediliyor...' : 'Ödeme Al'}
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
