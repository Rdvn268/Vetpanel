const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  const clinicId = req.user.clinicId;
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    todayAppointments,
    totalClients,
    totalPatients,
    activeHospitalizations,
    monthlyRevenue,
    lowStockCount,
    overdueVaccinations,
    pendingInvoices,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { clinicId, startTime: { gte: startOfDay, lte: endOfDay } },
    }),
    prisma.client.count({ where: { clinicId } }),
    prisma.patient.count({ where: { clinicId, isDeceased: false } }),
    prisma.hospitalization.count({
      where: { patient: { clinicId }, status: 'ACTIVE' },
    }),
    prisma.invoice.aggregate({
      where: { clinicId, date: { gte: startOfMonth }, status: { in: ['PAID', 'PARTIAL'] } },
      _sum: { paidAmount: true },
    }),
    prisma.inventoryItem.count({ where: { clinicId, isActive: true } }),
    prisma.vaccination.count({
      where: { patient: { clinicId }, nextDueDate: { lt: new Date() } },
    }),
    prisma.invoice.count({
      where: { clinicId, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
    }),
  ]);

  // Low stock hesapla
  const allInventory = await prisma.inventoryItem.findMany({
    where: { clinicId, isActive: true },
    select: { quantity: true, minQuantity: true },
  });
  const lowStock = allInventory.filter(i => i.quantity <= i.minQuantity).length;

  res.json({
    todayAppointments,
    totalClients,
    totalPatients,
    activeHospitalizations,
    monthlyRevenue: monthlyRevenue._sum.paidAmount || 0,
    lowStockAlerts: lowStock,
    overdueVaccinations,
    pendingInvoices,
  });
});

// GET /api/dashboard/appointments/today
router.get('/appointments/today', async (req, res) => {
  const clinicId = req.user.clinicId;
  const today = new Date();
  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId,
      startTime: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
        lte: new Date(today.setHours(23, 59, 59, 999)),
      },
    },
    include: {
      patient: { select: { id: true, name: true, species: true, photo: true } },
      doctor: { select: { firstName: true, lastName: true } },
    },
    orderBy: { startTime: 'asc' },
  });
  res.json(appointments);
});

// GET /api/dashboard/revenue?period=weekly|monthly
router.get('/revenue', async (req, res) => {
  const { period = 'monthly' } = req.query;
  const clinicId = req.user.clinicId;

  const days = period === 'weekly' ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const invoices = await prisma.invoice.findMany({
    where: { clinicId, date: { gte: startDate }, status: { in: ['PAID', 'PARTIAL'] } },
    select: { date: true, paidAmount: true, totalAmount: true },
    orderBy: { date: 'asc' },
  });

  // Günlük gruplama
  const grouped = {};
  invoices.forEach(inv => {
    const key = inv.date.toISOString().split('T')[0];
    if (!grouped[key]) grouped[key] = 0;
    grouped[key] += Number(inv.paidAmount);
  });

  const data = Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
  res.json(data);
});

module.exports = router;
