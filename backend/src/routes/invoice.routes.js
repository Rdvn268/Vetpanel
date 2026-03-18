const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

const generateInvoiceNumber = () => {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${ymd}-${rand}`;
};

// GET /api/invoices
router.get('/', async (req, res) => {
  const { clientId, status, startDate, endDate } = req.query;
  const invoices = await prisma.invoice.findMany({
    where: {
      clinicId: req.user.clinicId,
      ...(clientId && { clientId }),
      ...(status && { status }),
      ...(startDate && endDate && {
        date: { gte: new Date(startDate), lte: new Date(endDate) },
      }),
    },
    include: {
      client: { select: { firstName: true, lastName: true, phone: true } },
      items: true,
      payments: true,
    },
    orderBy: { date: 'desc' },
  });
  res.json(invoices);
});

// GET /api/invoices/:id
router.get('/:id', async (req, res) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
    include: {
      client: true,
      items: { include: { inventoryItem: { select: { name: true } } } },
      payments: true,
    },
  });
  if (!invoice) return res.status(404).json({ error: 'Fatura bulunamadı' });
  res.json(invoice);
});

// POST /api/invoices
router.post('/', async (req, res) => {
  const { clientId, items, notes, dueDate, taxRate = 0, discountAmount = 0 } = req.body;

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount - discountAmount;

  const invoice = await prisma.invoice.create({
    data: {
      clinicId: req.user.clinicId,
      clientId,
      invoiceNumber: generateInvoiceNumber(),
      dueDate: dueDate ? new Date(dueDate) : null,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      notes,
      items: {
        create: items.map(item => ({
          inventoryItemId: item.inventoryItemId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true, client: { select: { firstName: true, lastName: true } } },
  });

  res.status(201).json(invoice);
});

// POST /api/invoices/:id/payments - Ödeme ekle
router.post('/:id/payments', async (req, res) => {
  const { amount, method, reference, notes } = req.body;

  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
    include: { payments: true },
  });
  if (!invoice) return res.status(404).json({ error: 'Fatura bulunamadı' });

  const payment = await prisma.payment.create({
    data: { invoiceId: req.params.id, amount, method: method || 'CASH', reference, notes },
  });

  const newPaidAmount = Number(invoice.paidAmount) + Number(amount);
  const status = newPaidAmount >= Number(invoice.totalAmount) ? 'PAID'
    : newPaidAmount > 0 ? 'PARTIAL' : 'PENDING';

  await prisma.invoice.update({
    where: { id: req.params.id },
    data: { paidAmount: newPaidAmount, status },
  });

  res.status(201).json(payment);
});

module.exports = router;
