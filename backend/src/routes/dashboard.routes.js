const router = require('express').Router();
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  const clinicId = req.user.clinic_id;
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const [
    aptRes,
    clientRes,
    patientRes,
    hospRes,
    revenueRes,
    overdueRes,
    pendingInvRes,
    inventoryRes,
  ] = await Promise.all([
    supabase.from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay),

    supabase.from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId),

    supabase.from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('is_deceased', false),

    supabase.from('hospitalizations')
      .select('id, patients!inner(clinic_id)', { count: 'exact', head: true })
      .eq('status', 'ACTIVE')
      .eq('patients.clinic_id', clinicId),

    supabase.from('invoices')
      .select('paid_amount')
      .eq('clinic_id', clinicId)
      .gte('date', startOfMonth)
      .in('status', ['PAID', 'PARTIAL']),

    supabase.from('vaccinations')
      .select('id, patients!inner(clinic_id)', { count: 'exact', head: true })
      .lt('next_due_date', new Date().toISOString())
      .not('next_due_date', 'is', null)
      .eq('patients.clinic_id', clinicId),

    supabase.from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .in('status', ['PENDING', 'PARTIAL', 'OVERDUE']),

    supabase.from('inventory_items')
      .select('quantity, min_quantity')
      .eq('clinic_id', clinicId)
      .eq('is_active', true),
  ]);

  const monthlyRevenue = (revenueRes.data || []).reduce((s, i) => s + Number(i.paid_amount), 0);
  const lowStockAlerts = (inventoryRes.data || []).filter(i => i.quantity <= i.min_quantity).length;

  res.json({
    todayAppointments: aptRes.count || 0,
    totalClients: clientRes.count || 0,
    totalPatients: patientRes.count || 0,
    activeHospitalizations: hospRes.count || 0,
    monthlyRevenue,
    lowStockAlerts,
    overdueVaccinations: overdueRes.count || 0,
    pendingInvoices: pendingInvRes.count || 0,
  });
});

// GET /api/dashboard/appointments/today
router.get('/appointments/today', async (req, res) => {
  const today = new Date();
  const start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const end = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patients(id, name, species, photo),
      users!doctor_id(first_name, last_name)
    `)
    .eq('clinic_id', req.user.clinic_id)
    .gte('start_time', start)
    .lte('start_time', end)
    .order('start_time', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/dashboard/revenue?period=weekly|monthly
router.get('/revenue', async (req, res) => {
  const { period = 'monthly' } = req.query;
  const days = period === 'weekly' ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('invoices')
    .select('date, paid_amount')
    .eq('clinic_id', req.user.clinic_id)
    .gte('date', startDate.toISOString())
    .in('status', ['PAID', 'PARTIAL'])
    .order('date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  // Günlük gruplama
  const grouped = {};
  (data || []).forEach(inv => {
    const key = inv.date.split('T')[0];
    grouped[key] = (grouped[key] || 0) + Number(inv.paid_amount);
  });

  const result = Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
  res.json(result);
});

module.exports = router;
