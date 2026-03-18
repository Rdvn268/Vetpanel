const router = require('express').Router();
const { body, query, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/clients
router.get('/', async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    clinicId: req.user.clinicId,
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where, skip, take: Number(limit),
      include: { patients: { select: { id: true, name: true, species: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.count({ where }),
  ]);

  res.json({ data: clients, total, page: Number(page), limit: Number(limit) });
});

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
    include: {
      patients: {
        include: {
          appointments: { take: 3, orderBy: { startTime: 'desc' } },
          vaccinations: { take: 3, orderBy: { dateAdministered: 'desc' } },
        },
      },
      invoices: { take: 5, orderBy: { createdAt: 'desc' } },
    },
  });

  if (!client) return res.status(404).json({ error: 'Müşteri bulunamadı' });
  res.json(client);
});

// POST /api/clients
router.post('/', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').notEmpty().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { firstName, lastName, phone, email, address, nationalId, notes } = req.body;
  const client = await prisma.client.create({
    data: { clinicId: req.user.clinicId, firstName, lastName, phone, email, address, nationalId, notes },
  });
  res.status(201).json(client);
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  const { firstName, lastName, phone, email, address, nationalId, notes } = req.body;
  const client = await prisma.client.updateMany({
    where: { id: req.params.id, clinicId: req.user.clinicId },
    data: { firstName, lastName, phone, email, address, nationalId, notes },
  });
  if (!client.count) return res.status(404).json({ error: 'Müşteri bulunamadı' });
  res.json({ success: true });
});

// DELETE /api/clients/:id
router.delete('/:id', authorize('CLINIC_OWNER', 'ADMIN'), async (req, res) => {
  await prisma.client.deleteMany({
    where: { id: req.params.id, clinicId: req.user.clinicId },
  });
  res.json({ success: true });
});

module.exports = router;
