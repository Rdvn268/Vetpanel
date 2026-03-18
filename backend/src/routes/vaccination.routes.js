const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/vaccinations?patientId=
router.get('/', async (req, res) => {
  const { patientId, overdueOnly } = req.query;
  const where = {
    ...(patientId && { patientId }),
    ...(overdueOnly === 'true' && { nextDueDate: { lt: new Date() } }),
  };
  const vaccinations = await prisma.vaccination.findMany({
    where,
    include: { patient: { select: { id: true, name: true, species: true, client: { select: { firstName: true, lastName: true, phone: true } } } } },
    orderBy: { dateAdministered: 'desc' },
  });
  res.json(vaccinations);
});

// GET /api/vaccinations/overdue - Süresi geçmiş aşılar
router.get('/overdue', async (req, res) => {
  const overdue = await prisma.vaccination.findMany({
    where: {
      patient: { clinicId: req.user.clinicId },
      nextDueDate: { lt: new Date() },
    },
    include: {
      patient: {
        select: {
          id: true, name: true, species: true,
          client: { select: { firstName: true, lastName: true, phone: true } },
        },
      },
    },
    orderBy: { nextDueDate: 'asc' },
  });
  res.json(overdue);
});

// POST /api/vaccinations
router.post('/', async (req, res) => {
  const {
    patientId, vaccineName, vaccineType, batchNumber,
    manufacturer, dateAdministered, nextDueDate, notes,
  } = req.body;

  const vaccination = await prisma.vaccination.create({
    data: {
      patientId, vaccineName, vaccineType, batchNumber,
      manufacturer,
      dateAdministered: new Date(dateAdministered),
      nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
      administeredBy: `${req.user.firstName} ${req.user.lastName}`,
      notes,
    },
  });
  res.status(201).json(vaccination);
});

// DELETE /api/vaccinations/:id
router.delete('/:id', async (req, res) => {
  await prisma.vaccination.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;
