const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../lib/supabase');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/clients
router.get('/', async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const from = (Number(page) - 1) * Number(limit);
  const to = from + Number(limit) - 1;

  let query = supabase
    .from('clients')
    .select('*, patients(id, name, species)', { count: 'exact' })
    .eq('clinic_id', req.user.clinic_id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json({ data, total: count, page: Number(page), limit: Number(limit) });
});

// GET /api/clients/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      patients(
        *,
        appointments(id, title, start_time, status, type),
        vaccinations(id, vaccine_name, date_administered, next_due_date)
      ),
      invoices(id, invoice_number, total_amount, paid_amount, status, date)
    `)
    .eq('id', req.params.id)
    .eq('clinic_id', req.user.clinic_id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Müşteri bulunamadı' });
  res.json(data);
});

// POST /api/clients
router.post('/', [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('phone').notEmpty().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { firstName, lastName, phone, email, address, nationalId, notes } = req.body;
  const { data, error } = await supabase
    .from('clients')
    .insert({
      clinic_id: req.user.clinic_id,
      first_name: firstName,
      last_name: lastName,
      phone, email, address,
      national_id: nationalId,
      notes,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  const { firstName, lastName, phone, email, address, nationalId, notes } = req.body;
  const { error } = await supabase
    .from('clients')
    .update({
      first_name: firstName,
      last_name: lastName,
      phone, email, address,
      national_id: nationalId,
      notes,
    })
    .eq('id', req.params.id)
    .eq('clinic_id', req.user.clinic_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// DELETE /api/clients/:id
router.delete('/:id', authorize('CLINIC_OWNER', 'ADMIN'), async (req, res) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', req.params.id)
    .eq('clinic_id', req.user.clinic_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
