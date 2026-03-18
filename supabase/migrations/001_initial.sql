-- =============================================
-- VetPanel - Supabase SQL Migration
-- Supabase Dashboard > SQL Editor'e yapıştırın
-- =============================================

-- ENUMs
CREATE TYPE user_role AS ENUM ('CLINIC_OWNER','VETERINARIAN','TECHNICIAN','RECEPTIONIST','ACCOUNTANT','ADMIN');
CREATE TYPE sex_type AS ENUM ('MALE','FEMALE','UNKNOWN');
CREATE TYPE appointment_status AS ENUM ('SCHEDULED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW');
CREATE TYPE appointment_type AS ENUM ('CHECKUP','VACCINATION','SURGERY','GROOMING','EMERGENCY','LAB_TEST','FOLLOW_UP','OTHER');
CREATE TYPE payment_status AS ENUM ('PENDING','PARTIAL','PAID','OVERDUE','CANCELLED');
CREATE TYPE payment_method AS ENUM ('CASH','CREDIT_CARD','BANK_TRANSFER','INSURANCE','OTHER');
CREATE TYPE hospitalization_status AS ENUM ('ACTIVE','DISCHARGED','DECEASED','TRANSFERRED');
CREATE TYPE inventory_category AS ENUM ('DRUG','VACCINE','CONSUMABLE','FOOD','EQUIPMENT','OTHER');

-- =============================================
-- CLINICS
-- =============================================
CREATE TABLE clinics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  address     TEXT,
  phone       TEXT,
  email       TEXT,
  tax_number  TEXT,
  logo        TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USERS (auth.users ile eşleşir)
-- =============================================
CREATE TABLE users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id    UUID NOT NULL REFERENCES clinics(id),
  email        TEXT NOT NULL,
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
  phone        TEXT,
  role         user_role NOT NULL DEFAULT 'RECEPTIONIST',
  is_active    BOOLEAN DEFAULT TRUE,
  avatar       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CLIENTS (Hayvan sahipleri)
-- =============================================
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID NOT NULL REFERENCES clinics(id),
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT,
  address     TEXT,
  national_id TEXT,
  notes       TEXT,
  balance     DECIMAL(10,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PATIENTS (Hayvanlar)
-- =============================================
CREATE TABLE patients (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id        UUID NOT NULL REFERENCES clinics(id),
  client_id        UUID NOT NULL REFERENCES clients(id),
  name             TEXT NOT NULL,
  species          TEXT NOT NULL,
  breed            TEXT,
  sex              sex_type DEFAULT 'UNKNOWN',
  birth_date       DATE,
  color            TEXT,
  microchip_number TEXT,
  photo            TEXT,
  is_neutered      BOOLEAN DEFAULT FALSE,
  is_deceased      BOOLEAN DEFAULT FALSE,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- WEIGHT RECORDS
-- =============================================
CREATE TABLE weight_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  weight     DECIMAL(5,2) NOT NULL,
  unit       TEXT DEFAULT 'kg',
  date       TIMESTAMPTZ DEFAULT NOW(),
  notes      TEXT
);

-- =============================================
-- APPOINTMENTS
-- =============================================
CREATE TABLE appointments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id),
  patient_id    UUID NOT NULL REFERENCES patients(id),
  doctor_id     UUID NOT NULL REFERENCES users(id),
  title         TEXT NOT NULL,
  type          appointment_type DEFAULT 'CHECKUP',
  status        appointment_status DEFAULT 'SCHEDULED',
  start_time    TIMESTAMPTZ NOT NULL,
  end_time      TIMESTAMPTZ NOT NULL,
  notes         TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MEDICAL RECORDS
-- =============================================
CREATE TABLE medical_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  doctor_id       UUID NOT NULL REFERENCES users(id),
  appointment_id  UUID UNIQUE REFERENCES appointments(id),
  date            TIMESTAMPTZ DEFAULT NOW(),
  chief_complaint TEXT,
  symptoms        TEXT,
  physical_exam   TEXT,
  diagnosis       TEXT,
  treatment_plan  TEXT,
  notes           TEXT,
  attachments     TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- VACCINATIONS
-- =============================================
CREATE TABLE vaccinations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID NOT NULL REFERENCES patients(id),
  vaccine_name      TEXT NOT NULL,
  vaccine_type      TEXT,
  batch_number      TEXT,
  manufacturer      TEXT,
  date_administered TIMESTAMPTZ NOT NULL,
  next_due_date     TIMESTAMPTZ,
  administered_by   TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LAB TESTS
-- =============================================
CREATE TABLE lab_tests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID NOT NULL REFERENCES patients(id),
  test_name    TEXT NOT NULL,
  test_type    TEXT NOT NULL,
  requested_by TEXT,
  request_date TIMESTAMPTZ DEFAULT NOW(),
  result_date  TIMESTAMPTZ,
  status       TEXT DEFAULT 'PENDING',
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lab_results (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_test_id    UUID NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
  param_name     TEXT NOT NULL,
  value          TEXT,
  unit           TEXT,
  ref_range_low  TEXT,
  ref_range_high TEXT,
  is_abnormal    BOOLEAN DEFAULT FALSE
);

-- =============================================
-- IMAGING RECORDS
-- =============================================
CREATE TABLE imaging_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id  UUID NOT NULL REFERENCES patients(id),
  image_type  TEXT NOT NULL,
  description TEXT,
  file_url    TEXT NOT NULL,
  taken_at    TIMESTAMPTZ DEFAULT NOW(),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRESCRIPTIONS
-- =============================================
CREATE TABLE prescriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID NOT NULL REFERENCES patients(id),
  doctor_id         UUID NOT NULL REFERENCES users(id),
  medical_record_id UUID REFERENCES medical_records(id),
  date              TIMESTAMPTZ DEFAULT NOW(),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prescription_medications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage          TEXT NOT NULL,
  frequency       TEXT NOT NULL,
  duration        TEXT NOT NULL,
  instructions    TEXT
);

-- =============================================
-- HOSPITALIZATIONS
-- =============================================
CREATE TABLE hospitalizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID NOT NULL REFERENCES patients(id),
  cage_number   TEXT,
  admitted_at   TIMESTAMPTZ DEFAULT NOW(),
  discharged_at TIMESTAMPTZ,
  reason        TEXT,
  status        hospitalization_status DEFAULT 'ACTIVE',
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hospitalization_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospitalization_id  UUID NOT NULL REFERENCES hospitalizations(id) ON DELETE CASCADE,
  date                TIMESTAMPTZ DEFAULT NOW(),
  temperature         DECIMAL(4,1),
  weight              DECIMAL(5,2),
  treatments          TEXT,
  fluid_therapy       TEXT,
  feeding             TEXT,
  notes               TEXT,
  created_by          TEXT
);

-- =============================================
-- INVENTORY
-- =============================================
CREATE TABLE inventory_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    UUID NOT NULL REFERENCES clinics(id),
  name         TEXT NOT NULL,
  category     inventory_category DEFAULT 'OTHER',
  sku          TEXT,
  barcode      TEXT,
  quantity     INT DEFAULT 0,
  unit         TEXT DEFAULT 'adet',
  min_quantity INT DEFAULT 0,
  cost_price   DECIMAL(10,2) NOT NULL,
  sell_price   DECIMAL(10,2) NOT NULL,
  expiry_date  DATE,
  supplier     TEXT,
  notes        TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVOICES & PAYMENTS
-- =============================================
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID NOT NULL REFERENCES clinics(id),
  client_id       UUID NOT NULL REFERENCES clients(id),
  invoice_number  TEXT UNIQUE NOT NULL,
  date            TIMESTAMPTZ DEFAULT NOW(),
  due_date        TIMESTAMPTZ,
  subtotal        DECIMAL(10,2) NOT NULL,
  tax_amount      DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount    DECIMAL(10,2) NOT NULL,
  paid_amount     DECIMAL(10,2) DEFAULT 0,
  status          payment_status DEFAULT 'PENDING',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoice_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id        UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id),
  description       TEXT NOT NULL,
  quantity          INT NOT NULL,
  unit_price        DECIMAL(10,2) NOT NULL,
  total_price       DECIMAL(10,2) NOT NULL
);

CREATE TABLE payments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  amount     DECIMAL(10,2) NOT NULL,
  method     payment_method DEFAULT 'CASH',
  paid_at    TIMESTAMPTZ DEFAULT NOW(),
  reference  TEXT,
  notes      TEXT
);

-- =============================================
-- REMINDERS
-- =============================================
CREATE TABLE reminders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id   UUID REFERENCES patients(id),
  client_id    UUID REFERENCES clients(id),
  type         TEXT NOT NULL,
  message      TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at      TIMESTAMPTZ,
  method       TEXT DEFAULT 'SMS',
  is_sent      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES (performans için)
-- =============================================
CREATE INDEX idx_users_clinic ON users(clinic_id);
CREATE INDEX idx_clients_clinic ON clients(clinic_id);
CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_client ON patients(client_id);
CREATE INDEX idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_time ON appointments(start_time);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_vaccinations_patient ON vaccinations(patient_id);
CREATE INDEX idx_vaccinations_next_due ON vaccinations(next_due_date);
CREATE INDEX idx_lab_tests_patient ON lab_tests(patient_id);
CREATE INDEX idx_inventory_clinic ON inventory_items(clinic_id);
CREATE INDEX idx_invoices_clinic ON invoices(clinic_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);

-- =============================================
-- updated_at otomatik güncelleme trigger
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_medical_records_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_hospitalizations_updated_at BEFORE UPDATE ON hospitalizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- RLS (Row Level Security) - Opsiyonel
-- Şimdilik kapalı, backend service role ile yönetiyor
-- =============================================
-- ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
-- (İleride açılabilir, şimdi backend güvenliği yeterli)
