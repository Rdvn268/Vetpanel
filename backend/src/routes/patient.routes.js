const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/patients
router.get('/', async (req, res) => {
  const { search, clientId, page = 1, limit = 20 } = req.query;
  const from = (Number(page) - 1) * Number(limit);
  const to = from + Number(limit) - 1;

  let query = supabase
    .from('patients')
    .select('*, clients(id, first_name, last_name, phone)', { count: 'exact' })
    .eq('clinic_id', req.user.clinic_id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (clientId) query = query.eq('client_id', clientId);
  if (search) {
    query = query.or(`name.ilike.%${search}%,species.ilike.%${search}%,microchip_number.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data, total: count, page: Number(page), limit: Number(limit) });
});

// GET /api/patients/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      clients(*),
      weight_records(* ORDER BY date DESC),
      vaccinations(* ORDER BY date_administered DESC),
      appointments(
        *,
        users!doctor_id(first_name, last_name)
        ORDER BY start_time DESC LIMIT 10
      ),
      medical_records(
        *,
        users!doctor_id(first_name, last_name)
        ORDER BY date DESC LIMIT 10
      ),
      lab_tests(* ORDER BY request_date DESC LIMIT 5),
      imaging_records(* ORDER BY taken_at DESC LIMIT 5),
      hospitalizations(* ORDER BY admitted_at DESC LIMIT 3)
    `)
    .eq('id', req.params.id)
    .eq('clinic_id', req.user.clinic_id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Hasta bulunamadı' });
  res.json(data);
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

  // Müşteri bu kliniğe ait mi kontrol et
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('clinic_id', req.user.clinic_id)
    .single();

  if (!client) return res.status(400).json({ error: 'Geçersiz müşteri' });

  const { data, error } = await supabase
    .from('patients')
    .insert({
      clinic_id: req.user.clinic_id,
      client_id: clientId,
      name, species, breed,
      sex: sex || 'UNKNOWN',
      birth_date: birthDate || null,
      color,
      microchip_number: microchipNumber,
      is_neutered: isNeutered || false,
      notes,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/patients/:id
router.put('/:id', async (req, res) => {
  const { name, species, breed, sex, birthDate, color, microchipNumber, isNeutered, isDeceased, notes } = req.body;
  const { error } = await supabase
    .from('patients')
    .update({
      name, species, breed, sex,
      birth_date: birthDate || null,
      color,
      microchip_number: microchipNumber,
      is_neutered: isNeutered,
      is_deceased: isDeceased,
      notes,
    })
    .eq('id', req.params.id)
    .eq('clinic_id', req.user.clinic_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// POST /api/patients/:id/weight
router.post('/:id/weight', async (req, res) => {
  const { weight, unit, notes } = req.body;
  const { data, error } = await supabase
    .from('weight_records')
    .insert({ patient_id: req.params.id, weight, unit: unit || 'kg', notes })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

module.exports = router;
