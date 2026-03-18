const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/hospitalizations - Aktif yatışlar
router.get('/', async (req, res) => {
  const { status = 'ACTIVE' } = req.query;
  const hospitalizations = await prisma.hospitalization.findMany({
    where: {
      patient: { clinicId: req.user.clinicId },
      status,
    },
    include: {
      patient: {
        select: {
          id: true, name: true, species: true, photo: true,
          client: { select: { firstName: true, lastName: true, phone: true } },
        },
      },
      dailyRecords: { orderBy: { date: 'desc' }, take: 1 },
    },
    orderBy: { admittedAt: 'desc' },
  });
  res.json(hospitalizations);
});

// GET /api/hospitalizations/:id
router.get('/:id', async (req, res) => {
  const hosp = await prisma.hospitalization.findUnique({
    where: { id: req.params.id },
    include: {
      patient: {
        select: {
          id: true, name: true, species: true, breed: true,
          client: { select: { firstName: true, lastName: true, phone: true } },
        },
      },
      dailyRecords: { orderBy: { date: 'desc' } },
    },
  });
  if (!hosp) return res.status(404).json({ error: 'Yatış kaydı bulunamadı' });
  res.json(hosp);
});

// POST /api/hospitalizations
router.post('/', async (req, res) => {
  const { patientId, cageNumber, reason, notes } = req.body;
  const hosp = await prisma.hospitalization.create({
    data: { patientId, cageNumber, reason, notes },
  });
  res.status(201).json(hosp);
});

// POST /api/hospitalizations/:id/records - Günlük kayıt ekle
router.post('/:id/records', async (req, res) => {
  const { temperature, weight, treatments, fluidTherapy, feeding, notes } = req.body;
  const record = await prisma.hospitalizationRecord.create({
    data: {
      hospitalizationId: req.params.id,
      temperature, weight, treatments, fluidTherapy, feeding, notes,
      createdBy: `${req.user.firstName} ${req.user.lastName}`,
    },
  });
  res.status(201).json(record);
});

// PATCH /api/hospitalizations/:id/discharge - Taburcu et
router.patch('/:id/discharge', async (req, res) => {
  const hosp = await prisma.hospitalization.update({
    where: { id: req.params.id },
    data: { status: 'DISCHARGED', dischargedAt: new Date() },
  });
  res.json(hosp);
});

module.exports = router;
