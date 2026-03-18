const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/medical-records?patientId=
router.get('/', async (req, res) => {
  const { patientId } = req.query;
  if (!patientId) return res.status(400).json({ error: 'patientId gerekli' });

  const records = await prisma.medicalRecord.findMany({
    where: { patientId },
    include: {
      doctor: { select: { firstName: true, lastName: true } },
      prescriptions: { include: { medications: true } },
    },
    orderBy: { date: 'desc' },
  });

  res.json(records);
});

// GET /api/medical-records/:id
router.get('/:id', async (req, res) => {
  const record = await prisma.medicalRecord.findUnique({
    where: { id: req.params.id },
    include: {
      patient: { select: { id: true, name: true, species: true, breed: true } },
      doctor: { select: { firstName: true, lastName: true } },
      prescriptions: { include: { medications: true } },
    },
  });
  if (!record) return res.status(404).json({ error: 'Kayıt bulunamadı' });
  res.json(record);
});

// POST /api/medical-records
router.post('/', [
  body('patientId').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const {
    patientId, appointmentId, chiefComplaint,
    symptoms, physicalExam, diagnosis, treatmentPlan, notes,
  } = req.body;

  const record = await prisma.medicalRecord.create({
    data: {
      patientId,
      doctorId: req.user.id,
      appointmentId,
      chiefComplaint, symptoms, physicalExam,
      diagnosis, treatmentPlan, notes,
    },
    include: {
      doctor: { select: { firstName: true, lastName: true } },
    },
  });

  // Update appointment status if linked
  if (appointmentId) {
    await prisma.appointment.updateMany({
      where: { id: appointmentId, clinicId: req.user.clinicId },
      data: { status: 'COMPLETED' },
    });
  }

  res.status(201).json(record);
});

// PUT /api/medical-records/:id
router.put('/:id', async (req, res) => {
  const { chiefComplaint, symptoms, physicalExam, diagnosis, treatmentPlan, notes } = req.body;
  const record = await prisma.medicalRecord.update({
    where: { id: req.params.id },
    data: { chiefComplaint, symptoms, physicalExam, diagnosis, treatmentPlan, notes },
  });
  res.json(record);
});

module.exports = router;
