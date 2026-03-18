const router = require('express').Router();
const supabase = require('../lib/supabase');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/inventory
router.get('/', async (req, res) => {
  const { search, category } = req.query;

  let query = supabase
    .from('inventory_items')
    .select('*')
    .eq('clinic_id', req.user.clinic_id)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (category) query = query.eq('category', category);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/inventory/low-stock
router.get('/low-stock', async (req, res) => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('clinic_id', req.user.clinic_id)
    .eq('is_active', true);

  if (error) return res.status(500).json({ error: error.message });
  const lowStock = (data || []).filter(i => i.quantity <= i.min_quantity);
  res.json(lowStock);
});

// POST /api/inventory
router.post('/', authorize('CLINIC_OWNER', 'ADMIN', 'VETERINARIAN'), async (req, res) => {
  const { name, category, sku, barcode, quantity, unit, minQuantity, costPrice, sellPrice, expiryDate, supplier, notes } = req.body;

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      clinic_id: req.user.clinic_id,
      name,
      category: category || 'OTHER',
      sku, barcode,
      quantity: quantity || 0,
      unit: unit || 'adet',
      min_quantity: minQuantity || 0,
      cost_price: costPrice,
      sell_price: sellPrice,
      expiry_date: expiryDate || null,
      supplier, notes,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/inventory/:id
router.put('/:id', async (req, res) => {
  const { name, category, sku, barcode, quantity, unit, minQuantity, costPrice, sellPrice, expiryDate, supplier, notes } = req.body;

  const { error } = await supabase
    .from('inventory_items')
    .update({
      name, category, sku, barcode, quantity, unit,
      min_quantity: minQuantity,
      cost_price: costPrice,
      sell_price: sellPrice,
      expiry_date: expiryDate,
      supplier, notes,
    })
    .eq('id', req.params.id)
    .eq('clinic_id', req.user.clinic_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// PATCH /api/inventory/:id/stock
router.patch('/:id/stock', async (req, res) => {
  const { delta } = req.body;

  // Mevcut stoku al
  const { data: item } = await supabase
    .from('inventory_items')
    .select('quantity')
    .eq('id', req.params.id)
    .eq('clinic_id', req.user.clinic_id)
    .single();

  if (!item) return res.status(404).json({ error: 'Ürün bulunamadı' });

  const newQuantity = Math.max(0, item.quantity + delta);
  const { data, error } = await supabase
    .from('inventory_items')
    .update({ quantity: newQuantity })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
