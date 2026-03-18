const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/patients
router.get('/', async (req, res) => {
  const { search, clientId, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    clinicId: req.user.clinicId,
    ...(clientId && { clientId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { species: { contains: search, mode: 'insensitive' } },
        { microchipNumber: { contains: search } },
      ],
    }),
  };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where, skip, take: Number(limit),
      include: { client: { select: { id: true, firstName: true, lastName: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.patient.count({ where }),
  ]);

  res.json({ data: patients, total, page: Number(page), limit: Number(limit) });
});

// GET /api/patients/:id
router.get('/:id', async (req, res) => {
  const patient = await prisma.patient.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
    include: {
      client: true,
      weightHistory: { orderBy: { date: 'desc' } },
      vaccinations: { orderBy: { dateAdministered: 'desc' } },
      appointments: {
        include: { doctor: { select: { firstName: true, lastName: true } } },
        orderBy: { startTime: 'desc' },
        take: 10,
      },
      medicalRecords: {
        include: { doctor: { select: { firstName: true, lastName: true } } },
        orderBy: { date: 'desc' },
        take: 10,
      },
      labTests: { orderBy: { requestDate: 'desc' }, take: 5 },
      imagingRecords: { orderBy: { takenAt: 'desc' }, take: 5 },
      hospitalizations: { orderBy: { admittedAt: 'desc' }, take: 3 },
    },
  });

  if (!patient) return res.status(404).json({ error: 'Hasta bulunamadı' });
  res.json(patient);
});

// POST /api/patients
router.post('/', [
  body('name').notEmpty().trim(),
  body('species').notEmpty().trim(),
  body('clientId').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, species, breed, sex, birthDate, color, microchipNumber, isNeutered, notes, clientId } = req.body;

  const client = await prisma.client.findFirst({ where: { id: clientId, clinicId: req.user.clinicId } });
  if (!client) return res.status(400).json({ error: 'Geçersiz müşteri' });

  const patient = await prisma.patient.create({
    data: {
      clinicId: req.user.clinicId, clientId, name, species,
      breed, sex, birthDate: birthDate ? new Date(birthDate) : null,
      color, microchipNumber, isNeutered, notes,
    },
  });
  res.status(201).json(patient);
});

// PUT /api/patients/:id
router.put('/:id', async (req, res) => {
  const { name, species, breed, sex, birthDate, color, microchipNumber, isNeutered, isDeceased, notes } = req.body;
  const patient = await prisma.patient.updateMany({
    where: { id: req.params.id, clinicId: req.user.clinicId },
    data: {
      name, species, breed, sex,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      color, microchipNumber, isNeutered, isDeceased, notes,
    },
  });
  if (!patient.count) return res.status(404).json({ error: 'Hasta bulunamadı' });
  res.json({ success: true });
});

// POST /api/patients/:id/weight
router.post('/:id/weight', async (req, res) => {
  const { weight, unit, notes } = req.body;
  const record = await prisma.weightRecord.create({
    data: { patientId: req.params.id, weight, unit: unit || 'kg', notes },
  });
  res.status(201).json(record);
});

module.exports = router;
