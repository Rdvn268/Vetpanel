import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = 'dd.MM.yyyy') {
  return format(new Date(date), fmt, { locale: tr });
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: tr });
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: tr });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
}

export const SPECIES_OPTIONS = [
  { value: 'dog', label: 'Köpek' },
  { value: 'cat', label: 'Kedi' },
  { value: 'bird', label: 'Kuş' },
  { value: 'rabbit', label: 'Tavşan' },
  { value: 'hamster', label: 'Hamster' },
  { value: 'reptile', label: 'Sürüngen' },
  { value: 'fish', label: 'Balık' },
  { value: 'other', label: 'Diğer' },
];

export const APPOINTMENT_TYPES: Record<string, { label: string; color: string }> = {
  CHECKUP: { label: 'Kontrol', color: 'bg-blue-100 text-blue-800' },
  VACCINATION: { label: 'Aşı', color: 'bg-green-100 text-green-800' },
  SURGERY: { label: 'Ameliyat', color: 'bg-red-100 text-red-800' },
  GROOMING: { label: 'Tımar', color: 'bg-purple-100 text-purple-800' },
  EMERGENCY: { label: 'Acil', color: 'bg-orange-100 text-orange-800' },
  LAB_TEST: { label: 'Lab Testi', color: 'bg-yellow-100 text-yellow-800' },
  FOLLOW_UP: { label: 'Takip', color: 'bg-indigo-100 text-indigo-800' },
  OTHER: { label: 'Diğer', color: 'bg-gray-100 text-gray-800' },
};

export const APPOINTMENT_STATUS: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: 'Planlandı', color: 'bg-blue-100 text-blue-800' },
  CONFIRMED: { label: 'Onaylandı', color: 'bg-green-100 text-green-800' },
  IN_PROGRESS: { label: 'Devam ediyor', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: 'Tamamlandı', color: 'bg-gray-100 text-gray-800' },
  CANCELLED: { label: 'İptal', color: 'bg-red-100 text-red-800' },
  NO_SHOW: { label: 'Gelmedi', color: 'bg-orange-100 text-orange-800' },
};

export const ROLE_LABELS: Record<string, string> = {
  CLINIC_OWNER: 'Klinik Sahibi',
  VETERINARIAN: 'Veteriner',
  TECHNICIAN: 'Teknisyen',
  RECEPTIONIST: 'Resepsiyonist',
  ACCOUNTANT: 'Muhasebeci',
  ADMIN: 'Admin',
};
