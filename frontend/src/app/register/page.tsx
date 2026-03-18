'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authApi } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    clinicName: '', firstName: '', lastName: '',
    email: '', password: '', phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Backend: Supabase Auth user + clinic + profile oluşturur
      const res = await authApi.register(form);
      setAuth(res.data.user, res.data.token);
      localStorage.setItem('vetpanel_token', res.data.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Kayıt sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    type = 'text',
    placeholder = '',
    required = true
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        placeholder={placeholder}
        required={required}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🐾</div>
          <h1 className="text-2xl font-bold text-gray-900">Kliniğinizi Kurun</h1>
          <p className="text-gray-500 text-sm mt-1">Ücretsiz başlayın, dilediğiniz zaman genişletin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field('clinicName', 'Klinik Adı', 'text', 'Örn: Şifa Veteriner Kliniği')}

          <div className="grid grid-cols-2 gap-3">
            {field('firstName', 'Ad', 'text', 'Ad')}
            {field('lastName', 'Soyad', 'text', 'Soyad')}
          </div>

          {field('email', 'E-posta', 'email', 'doktor@klinik.com')}
          {field('phone', 'Telefon', 'tel', '05XX XXX XX XX', false)}
          {field('password', 'Şifre', 'password', 'En az 6 karakter')}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Oluşturuluyor...' : 'Kliniği Oluştur'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Hesabınız var mı?{' '}
          <a href="/login" className="text-blue-600 hover:underline font-medium">Giriş Yap</a>
        </p>
      </div>
    </div>
  );
}
