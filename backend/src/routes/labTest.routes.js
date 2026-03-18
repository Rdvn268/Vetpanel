const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/lab-tests?patientId=
router.get('/', async (req, res) => {
  const { patientId } = req.query;
  const tests = await prisma.labTest.findMany({
    where: { ...(patientId && { patientId }) },
    include: { results: true },
    orderBy: { requestDate: 'desc' },
  });
  res.json(tests);
});

// POST /api/lab-tests
router.post('/', async (req, res) => {
  const { patientId, testName, testType, notes } = req.body;
  const test = await prisma.labTest.create({
    data: {
      patientId, testName, testType,
      requestedBy: `${req.user.firstName} ${req.user.lastName}`,
      notes,
    },
  });
  res.status(201).json(test);
});

// POST /api/lab-tests/:id/results - Sonuç ekle
router.post('/:id/results', async (req, res) => {
  const { results } = req.body; // [{ paramName, value, unit, refRangeLow, refRangeHigh }]

  const labResults = await prisma.$transaction(
    results.map(r =>
      prisma.labResult.create({
        data: {
          labTestId: req.params.id,
          paramName: r.paramName,
          value: r.value,
          unit: r.unit,
          refRangeLow: r.refRangeLow,
          refRangeHigh: r.refRangeHigh,
          isAbnormal: r.isAbnormal || false,
        },
      })
    )
  );

  await prisma.labTest.update({
    where: { id: req.params.id },
    data: { status: 'COMPLETED', resultDate: new Date() },
  });

  res.status(201).json(labResults);
});

// GET /api/lab-tests/:id
router.get('/:id', async (req, res) => {
  const test = await prisma.labTest.findUnique({
    where: { id: req.params.id },
    include: {
      results: true,
      patient: { select: { id: true, name: true, species: true, breed: true } },
    },
  });
  if (!test) return res.status(404).json({ error: 'Test bulunamadı' });
  res.json(test);
});

module.exports = router;
