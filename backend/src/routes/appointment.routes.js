const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/appointments
router.get('/', async (req, res) => {
  const { date, doctorId, status, startDate, endDate } = req.query;

  let dateFilter = {};
  if (date) {
    const d = new Date(date);
    dateFilter = {
      startTime: {
        gte: new Date(d.setHours(0, 0, 0, 0)),
        lte: new Date(d.setHours(23, 59, 59, 999)),
      },
    };
  } else if (startDate && endDate) {
    dateFilter = {
      startTime: { gte: new Date(startDate), lte: new Date(endDate) },
    };
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId: req.user.clinicId,
      ...(doctorId && { doctorId }),
      ...(status && { status }),
      ...dateFilter,
    },
    include: {
      patient: { select: { id: true, name: true, species: true, photo: true } },
      doctor: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  res.json(appointments);
});

// POST /api/appointments
router.post('/', [
  body('patientId').notEmpty(),
  body('doctorId').notEmpty(),
  body('title').notEmpty(),
  body('startTime').isISO8601(),
  body('endTime').isISO8601(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { patientId, doctorId, title, type, startTime, endTime, notes } = req.body;

  const appointment = await prisma.appointment.create({
    data: {
      clinicId: req.user.clinicId,
      patientId, doctorId, title,
      type: type || 'CHECKUP',
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      notes,
    },
    include: {
      patient: { select: { id: true, name: true, species: true } },
      doctor: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  res.status(201).json(appointment);
});

// PUT /api/appointments/:id
router.put('/:id', async (req, res) => {
  const { title, type, status, startTime, endTime, notes, doctorId } = req.body;
  const appointment = await prisma.appointment.updateMany({
    where: { id: req.params.id, clinicId: req.user.clinicId },
    data: {
      title, type, status,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      notes, doctorId,
    },
  });
  if (!appointment.count) return res.status(404).json({ error: 'Randevu bulunamadı' });
  res.json({ success: true });
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {
  await prisma.appointment.updateMany({
    where: { id: req.params.id, clinicId: req.user.clinicId },
    data: { status: 'CANCELLED' },
  });
  res.json({ success: true });
});

// GET /api/appointments/today
router.get('/today', async (req, res) => {
  const today = new Date();
  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId: req.user.clinicId,
      startTime: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
        lte: new Date(today.setHours(23, 59, 59, 999)),
      },
    },
    include: {
      patient: { select: { id: true, name: true, species: true, photo: true } },
      doctor: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { startTime: 'asc' },
  });
  res.json(appointments);
});

module.exports = router;
