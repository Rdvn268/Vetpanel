const router = require('express').Router();
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/vaccinations?patientId=
router.get('/', async (req, res) => {
  const { patientId } = req.query;

  let query = supabase
    .from('vaccinations')
    .select(`
      *,
      patients(
        id, name, species,
        clients(first_name, last_name, phone)
      )
    `)
    .order('date_administered', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  } else {
    // Sadece bu kliniğin hastalarının aşılarını getir
    query = query.eq('patients.clinic_id', req.user.clinic_id);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// GET /api/vaccinations/overdue
router.get('/overdue', async (req, res) => {
  const { data, error } = await supabase
    .from('vaccinations')
    .select(`
      *,
      patients(
        id, name, species, clinic_id,
        clients(first_name, last_name, phone)
      )
    `)
    .lt('next_due_date', new Date().toISOString())
    .not('next_due_date', 'is', null)
    .order('next_due_date', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  // Sadece bu kliniğin hastalarını filtrele
  const filtered = (data || []).filter(v => v.patients?.clinic_id === req.user.clinic_id);
  res.json(filtered);
});

// POST /api/vaccinations
router.post('/', async (req, res) => {
  const {
    patientId, vaccineName, vaccineType, batchNumber,
    manufacturer, dateAdministered, nextDueDate, notes,
  } = req.body;

  const { data, error } = await supabase
    .from('vaccinations')
    .insert({
      patient_id: patientId,
      vaccine_name: vaccineName,
      vaccine_type: vaccineType,
      batch_number: batchNumber,
      manufacturer,
      date_administered: dateAdministered,
      next_due_date: nextDueDate || null,
      administered_by: `${req.user.first_name} ${req.user.last_name}`,
      notes,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// DELETE /api/vaccinations/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('vaccinations')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
