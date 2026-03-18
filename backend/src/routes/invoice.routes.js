const router = require('express').Router();
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

const generateInvoiceNumber = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `INV-${ymd}-${Math.floor(Math.random() * 9000) + 1000}`;
};

// GET /api/invoices
router.get('/', async (req, res) => {
  const { clientId, status, startDate, endDate } = req.query;

  let query = supabase
    .from('invoices')
    .select(`
      *,
      clients(first_name, last_name, phone),
      invoice_items(*),
      payments(*)
    `)
    .eq('clinic_id', req.user.clinic_id)
    .order('date', { ascending: false });

  if (clientId) query = query.eq('client_id', clientId);
  if (status) query = query.eq('status', status);
  if (startDate && endDate) {
    query = query.gte('date', startDate).lte('date', endDate);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/invoices/:id
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      clients(*),
      invoice_items(*, inventory_items(name)),
      payments(*)
    `)
    .eq('id', req.params.id)
    .eq('clinic_id', req.user.clinic_id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Fatura bulunamadı' });
  res.json(data);
});

// POST /api/invoices
router.post('/', async (req, res) => {
  const { clientId, items, notes, dueDate, taxRate = 0, discountAmount = 0 } = req.body;

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount - discountAmount;

  // Fatura oluştur
  const { data: invoice, error: invError } = await supabase
    .from('invoices')
    .insert({
      clinic_id: req.user.clinic_id,
      client_id: clientId,
      invoice_number: generateInvoiceNumber(),
      due_date: dueDate || null,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      notes,
    })
    .select()
    .single();

  if (invError) return res.status(500).json({ error: invError.message });

  // Fatura kalemlerini ekle
  const invoiceItems = items.map(item => ({
    invoice_id: invoice.id,
    inventory_item_id: item.inventoryItemId || null,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.quantity * item.unitPrice,
  }));

  await supabase.from('invoice_items').insert(invoiceItems);

  const { data: full } = await supabase
    .from('invoices')
    .select('*, clients(first_name, last_name), invoice_items(*)')
    .eq('id', invoice.id)
    .single();

  res.status(201).json(full);
});

// POST /api/invoices/:id/payments
router.post('/:id/payments', async (req, res) => {
  const { amount, method, reference, notes } = req.body;

  const { data: invoice } = await supabase
    .from('invoices')
    .select('paid_amount, total_amount')
    .eq('id', req.params.id)
    .eq('clinic_id', req.user.clinic_id)
    .single();

  if (!invoice) return res.status(404).json({ error: 'Fatura bulunamadı' });

  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      invoice_id: req.params.id,
      amount,
      method: method || 'CASH',
      reference, notes,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const newPaid = Number(invoice.paid_amount) + Number(amount);
  const status = newPaid >= Number(invoice.total_amount) ? 'PAID'
    : newPaid > 0 ? 'PARTIAL' : 'PENDING';

  await supabase
    .from('invoices')
    .update({ paid_amount: newPaid, status })
    .eq('id', req.params.id);

  res.status(201).json(payment);
});

module.exports = router;
