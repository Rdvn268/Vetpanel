# 🐾 VetPanel — Veteriner Klinik Yönetim Sistemi

Modern, tam özellikli veteriner klinik yönetim sistemi. Next.js 15 + Node.js/Express + **Supabase** ile inşa edilmiştir.

## Özellikler

- **Müşteri Yönetimi** — Hayvan sahiplerini takip edin
- **Hasta Yönetimi** — Her müşterinin birden fazla hayvanı olabilir
- **Randevu Sistemi** — Haftalık takvim görünümü
- **Tıbbi Kayıtlar** — Zaman çizelgesi tabanlı muayene kayıtları
- **Aşı Takibi** — Gecikmiş aşı uyarıları
- **Laboratuvar** — Test istekleri ve sonuçları
- **Yatış Yönetimi** — Kafes takibi, günlük kayıtlar
- **Envanter** — Stok, SKT takibi, düşük stok uyarıları
- **Fatura & Ödeme** — Fatura oluşturma, kısmi ödeme
- **Dashboard** — Günlük istatistikler, gelir grafiği
- **Rol Tabanlı Erişim** — 6 farklı kullanıcı rolü

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js, Express 5 |
| Veritabanı | **Supabase** (PostgreSQL) |
| Auth | **Supabase Auth** |
| DB Client | **@supabase/supabase-js** |
| State | Zustand |
| Grafikler | Recharts |

## Kurulum

### 1. Supabase Projesi

```bash
# PostgreSQL kurulu olmalı
createdb vetpanel
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# .env dosyasını düzenleyin (DATABASE_URL, JWT_SECRET)

npm install
npx prisma generate
npx prisma db push    # ya da: npx prisma migrate dev
npm run dev           # Port 3001
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev           # Port 3000
```

### 4. İlk Kullanım

Tarayıcıda `http://localhost:3000` adresine gidin.
"Kayıt Ol" sayfasından ilk kliniğinizi oluşturun.

## Kullanıcı Rolleri

| Rol | Açıklama |
|-----|----------|
| CLINIC_OWNER | Tam erişim, silme yetkisi |
| VETERINARIAN | Muayene, reçete, tıbbi kayıt |
| TECHNICIAN | Yatış, lab, aşı |
| RECEPTIONIST | Randevu, müşteri kayıt |
| ACCOUNTANT | Fatura, ödeme, raporlar |
| ADMIN | Sistem yönetimi |

## Veritabanı Modelleri

```
Clinic → User (çalışanlar)
Clinic → Client (müşteriler)
Client → Patient (hayvanlar)
Patient → Appointment, MedicalRecord, Vaccination
Patient → LabTest, ImagingRecord, Prescription
Patient → Hospitalization
Clinic → InventoryItem
Client → Invoice → InvoiceItem, Payment
```

## API Endpoints

```
POST   /api/auth/register        Klinik kaydı
POST   /api/auth/login           Giriş
GET    /api/auth/me              Mevcut kullanıcı

GET    /api/clients              Müşteri listesi
POST   /api/clients              Müşteri ekle
GET    /api/clients/:id          Müşteri detayı

GET    /api/patients             Hasta listesi
POST   /api/patients             Hasta ekle
GET    /api/patients/:id         Hasta detayı

GET    /api/appointments         Randevu listesi
POST   /api/appointments         Randevu oluştur
PUT    /api/appointments/:id     Randevu güncelle

GET    /api/medical-records      Tıbbi kayıtlar
POST   /api/medical-records      Kayıt ekle

GET    /api/vaccinations         Aşı listesi
GET    /api/vaccinations/overdue Gecikmiş aşılar
POST   /api/vaccinations         Aşı ekle

GET    /api/lab-tests            Lab testleri
POST   /api/lab-tests/:id/results Sonuç ekle

GET    /api/inventory            Envanter
POST   /api/inventory            Ürün ekle
PATCH  /api/inventory/:id/stock  Stok güncelle

GET    /api/invoices             Fatura listesi
POST   /api/invoices             Fatura oluştur
POST   /api/invoices/:id/payments Ödeme ekle

GET    /api/hospitalizations     Yatış listesi
POST   /api/hospitalizations     Yatış başlat
PATCH  /api/hospitalizations/:id/discharge Taburcu et

GET    /api/dashboard/stats      Dashboard istatistikleri
GET    /api/dashboard/revenue    Gelir raporu
```

## Geliştirme Yol Haritası

- [ ] SMS/WhatsApp hatırlatma entegrasyonu
- [ ] Görüntüleme modülü (X-ray upload)
- [ ] Reçete yazdırma (PDF)
- [ ] Aşı kartı yazdırma
- [ ] Mobil uygulama (React Native)
- [ ] Çoklu şube desteği
- [ ] Yapay zeka destekli tanı önerileri
- [ ] Ses-metin muayene notu
- [ ] Offline mod
