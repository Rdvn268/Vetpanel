const router = require('express').Router();
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/medical-records?patientId=
router.get('/', async (req, res) => {
  const { patientId } = req.query;
  if (!patientId) return res.status(400).json({ error: 'patientId gerekli' });

  const { data, error } = await supabase
    .from('medical_records')
    .select(`
      *,
      users!doctor_id(first_name, last_name),
      prescriptions(*, prescription_medications(*))
    `)
    .eq('patient_id', patientId)
    .order('date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/medical-records/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('medical_records')
    .select(`
      *,
      patients(id, name, species, breed),
      users!doctor_id(first_name, last_name),
      prescriptions(*, prescription_medications(*))
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Kayıt bulunamadı' });
  res.json(data);
});

// POST /api/medical-records
router.post('/', async (req, res) => {
  const {
    patientId, appointmentId,
    chiefComplaint, symptoms, physicalExam,
    diagnosis, treatmentPlan, notes,
  } = req.body;

  if (!patientId) return res.status(400).json({ error: 'patientId gerekli' });

  const { data, error } = await supabase
    .from('medical_records')
    .insert({
      patient_id: patientId,
      doctor_id: req.user.id,
      appointment_id: appointmentId || null,
      chief_complaint: chiefComplaint,
      symptoms,
      physical_exam: physicalExam,
      diagnosis,
      treatment_plan: treatmentPlan,
      notes,
    })
    .select(`*, users!doctor_id(first_name, last_name)`)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Randevuyu tamamlandı olarak işaretle
  if (appointmentId) {
    await supabase
      .from('appointments')
      .update({ status: 'COMPLETED' })
      .eq('id', appointmentId)
      .eq('clinic_id', req.user.clinic_id);
  }

  res.status(201).json(data);
});

// PUT /api/medical-records/:id
router.put('/:id', async (req, res) => {
  const { chiefComplaint, symptoms, physicalExam, diagnosis, treatmentPlan, notes } = req.body;
  const { data, error } = await supabase
    .from('medical_records')
    .update({
      chief_complaint: chiefComplaint,
      symptoms,
      physical_exam: physicalExam,
      diagnosis,
      treatment_plan: treatmentPlan,
      notes,
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
