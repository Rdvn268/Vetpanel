import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Token ekleme interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('vetpanel_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 hatası - logout
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('vetpanel_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: object) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  todayAppointments: () => api.get('/dashboard/appointments/today'),
  revenue: (period: string) => api.get(`/dashboard/revenue?period=${period}`),
};

// Clients
export const clientApi = {
  list: (params?: object) => api.get('/clients', { params }),
  get: (id: string) => api.get(`/clients/${id}`),
  create: (data: object) => api.post('/clients', data),
  update: (id: string, data: object) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};

// Patients
export const patientApi = {
  list: (params?: object) => api.get('/patients', { params }),
  get: (id: string) => api.get(`/patients/${id}`),
  create: (data: object) => api.post('/patients', data),
  update: (id: string, data: object) => api.put(`/patients/${id}`, data),
  addWeight: (id: string, data: object) => api.post(`/patients/${id}/weight`, data),
};

// Appointments
export const appointmentApi = {
  list: (params?: object) => api.get('/appointments', { params }),
  today: () => api.get('/appointments/today'),
  create: (data: object) => api.post('/appointments', data),
  update: (id: string, data: object) => api.put(`/appointments/${id}`, data),
  cancel: (id: string) => api.delete(`/appointments/${id}`),
};

// Medical Records
export const medicalRecordApi = {
  list: (patientId: string) => api.get('/medical-records', { params: { patientId } }),
  get: (id: string) => api.get(`/medical-records/${id}`),
  create: (data: object) => api.post('/medical-records', data),
  update: (id: string, data: object) => api.put(`/medical-records/${id}`, data),
};

// Vaccinations
export const vaccinationApi = {
  list: (params?: object) => api.get('/vaccinations', { params }),
  overdue: () => api.get('/vaccinations/overdue'),
  create: (data: object) => api.post('/vaccinations', data),
  delete: (id: string) => api.delete(`/vaccinations/${id}`),
};

// Lab Tests
export const labTestApi = {
  list: (patientId: string) => api.get('/lab-tests', { params: { patientId } }),
  get: (id: string) => api.get(`/lab-tests/${id}`),
  create: (data: object) => api.post('/lab-tests', data),
  addResults: (id: string, results: object[]) => api.post(`/lab-tests/${id}/results`, { results }),
};

// Inventory
export const inventoryApi = {
  list: (params?: object) => api.get('/inventory', { params }),
  lowStock: () => api.get('/inventory/low-stock'),
  create: (data: object) => api.post('/inventory', data),
  update: (id: string, data: object) => api.put(`/inventory/${id}`, data),
  updateStock: (id: string, delta: number) => api.patch(`/inventory/${id}/stock`, { delta }),
};

// Invoices
export const invoiceApi = {
  list: (params?: object) => api.get('/invoices', { params }),
  get: (id: string) => api.get(`/invoices/${id}`),
  create: (data: object) => api.post('/invoices', data),
  addPayment: (id: string, data: object) => api.post(`/invoices/${id}/payments`, data),
};

// Hospitalizations
export const hospitalizationApi = {
  list: (status?: string) => api.get('/hospitalizations', { params: { status } }),
  get: (id: string) => api.get(`/hospitalizations/${id}`),
  create: (data: object) => api.post('/hospitalizations', data),
  addRecord: (id: string, data: object) => api.post(`/hospitalizations/${id}/records`, data),
  discharge: (id: string) => api.patch(`/hospitalizations/${id}/discharge`, {}),
};
