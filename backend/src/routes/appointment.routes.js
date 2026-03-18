const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/appointments
router.get('/', async (req, res) => {
  const { date, doctorId, status, startDate, endDate } = req.query;

  let query = supabase
    .from('appointments')
    .select(`
      *,
      patients(id, name, species, photo),
      users!doctor_id(id, first_name, last_name)
    `)
    .eq('clinic_id', req.user.clinic_id)
    .order('start_time', { ascending: true });

  if (doctorId) query = query.eq('doctor_id', doctorId);
  if (status) query = query.eq('status', status);

  if (date) {
    const d = new Date(date);
    const start = new Date(d.setHours(0, 0, 0, 0)).toISOString();
    const end = new Date(d.setHours(23, 59, 59, 999)).toISOString();
    query = query.gte('start_time', start).lte('start_time', end);
  } else if (startDate && endDate) {
    query = query.gte('start_time', startDate).lte('start_time', endDate);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/appointments/today
router.get('/today', async (req, res) => {
  const today = new Date();
  const start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const end = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patients(id, name, species, photo),
      users!doctor_id(id, first_name, last_name)
    `)
    .eq('clinic_id', req.user.clinic_id)
    .gte('start_time', start)
    .lte('start_time', end)
    .order('start_time', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/appointments
router.post('/', [
  body('patientId').notEmpty(),
  body('doctorId').notEmpty(),
  body('title').notEmpty(),
  body('startTime').notEmpty(),
  body('endTime').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { patientId, doctorId, title, type, startTime, endTime, notes } = req.body;
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      clinic_id: req.user.clinic_id,
      patient_id: patientId,
      doctor_id: doctorId,
      title,
      type: type || 'CHECKUP',
      start_time: startTime,
      end_time: endTime,
      notes,
    })
    .select(`
      *,
      patients(id, name, species),
      users!doctor_id(id, first_name, last_name)
    `)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/appointments/:id
router.put('/:id', async (req, res) => {
  const { title, type, status, startTime, endTime, notes, doctorId } = req.body;
  const { error } = await supabase
    .from('appointments')
    .update({
      title, type, status,
      start_time: startTime,
      end_time: endTime,
      notes,
      doctor_id: doctorId,
    })
    .eq('id', req.params.id)
    .eq('clinic_id', req.user.clinic_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// DELETE /api/appointments/:id (iptal et)
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'CANCELLED' })
    .eq('id', req.params.id)
    .eq('clinic_id', req.user.clinic_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
