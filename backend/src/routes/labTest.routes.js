const router = require('express').Router();
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/lab-tests?patientId=
router.get('/', async (req, res) => {
  const { patientId } = req.query;
  if (!patientId) return res.status(400).json({ error: 'patientId gerekli' });

  const { data, error } = await supabase
    .from('lab_tests')
    .select('*, lab_results(*)')
    .eq('patient_id', patientId)
    .order('request_date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/lab-tests/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('lab_tests')
    .select(`
      *,
      lab_results(*),
      patients(id, name, species, breed)
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Test bulunamadı' });
  res.json(data);
});

// POST /api/lab-tests
router.post('/', async (req, res) => {
  const { patientId, testName, testType, notes } = req.body;
  const { data, error } = await supabase
    .from('lab_tests')
    .insert({
      patient_id: patientId,
      test_name: testName,
      test_type: testType,
      requested_by: `${req.user.first_name} ${req.user.last_name}`,
      notes,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// POST /api/lab-tests/:id/results
router.post('/:id/results', async (req, res) => {
  const { results } = req.body;

  const toInsert = results.map(r => ({
    lab_test_id: req.params.id,
    param_name: r.paramName,
    value: r.value,
    unit: r.unit,
    ref_range_low: r.refRangeLow,
    ref_range_high: r.refRangeHigh,
    is_abnormal: r.isAbnormal || false,
  }));

  const { data, error } = await supabase
    .from('lab_results')
    .insert(toInsert)
    .select();

  if (error) return res.status(500).json({ error: error.message });

  await supabase
    .from('lab_tests')
    .update({ status: 'COMPLETED', result_date: new Date().toISOString() })
    .eq('id', req.params.id);

  res.status(201).json(data);
});

module.exports = router;
