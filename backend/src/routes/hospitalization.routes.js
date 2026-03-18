const router = require('express').Router();
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/hospitalizations
router.get('/', async (req, res) => {
  const { status = 'ACTIVE' } = req.query;

  const { data, error } = await supabase
    .from('hospitalizations')
    .select(`
      *,
      patients(
        id, name, species, photo,
        clients(first_name, last_name, phone)
      ),
      hospitalization_records(* ORDER BY date DESC LIMIT 1)
    `)
    .eq('status', status)
    .eq('patients.clinic_id', req.user.clinic_id)
    .order('admitted_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // clinic_id filtresi
  const filtered = (data || []).filter(h => h.patients?.clients !== null);
  res.json(filtered);
});

// GET /api/hospitalizations/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('hospitalizations')
    .select(`
      *,
      patients(
        id, name, species, breed,
        clients(first_name, last_name, phone)
      ),
      hospitalization_records(* ORDER BY date DESC)
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Yatış kaydı bulunamadı' });
  res.json(data);
});

// POST /api/hospitalizations
router.post('/', async (req, res) => {
  const { patientId, cageNumber, reason, notes } = req.body;
  const { data, error } = await supabase
    .from('hospitalizations')
    .insert({
      patient_id: patientId,
      cage_number: cageNumber,
      reason, notes,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// POST /api/hospitalizations/:id/records
router.post('/:id/records', async (req, res) => {
  const { temperature, weight, treatments, fluidTherapy, feeding, notes } = req.body;
  const { data, error } = await supabase
    .from('hospitalization_records')
    .insert({
      hospitalization_id: req.params.id,
      temperature: temperature || null,
      weight: weight || null,
      treatments,
      fluid_therapy: fluidTherapy,
      feeding, notes,
      created_by: `${req.user.first_name} ${req.user.last_name}`,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/hospitalizations/:id/discharge
router.patch('/:id/discharge', async (req, res) => {
  const { data, error } = await supabase
    .from('hospitalizations')
    .update({ status: 'DISCHARGED', discharged_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
