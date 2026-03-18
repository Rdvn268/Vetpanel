const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/inventory
router.get('/', async (req, res) => {
  const { search, category, lowStock } = req.query;
  const where = {
    clinicId: req.user.clinicId,
    isActive: true,
    ...(category && { category }),
    ...(search && { name: { contains: search, mode: 'insensitive' } }),
    ...(lowStock === 'true' && {
      quantity: { lte: prisma.inventoryItem.fields.minQuantity },
    }),
  };

  const items = await prisma.inventoryItem.findMany({
    where: { clinicId: req.user.clinicId, isActive: true, ...(category && { category }), ...(search && { name: { contains: search, mode: 'insensitive' } }) },
    orderBy: { name: 'asc' },
  });

  // Low stock filtresi
  const result = lowStock === 'true'
    ? items.filter(i => i.quantity <= i.minQuantity)
    : items;

  res.json(result);
});

// GET /api/inventory/low-stock
router.get('/low-stock', async (req, res) => {
  const items = await prisma.inventoryItem.findMany({
    where: { clinicId: req.user.clinicId, isActive: true },
  });
  const lowStock = items.filter(i => i.quantity <= i.minQuantity);
  res.json(lowStock);
});

// POST /api/inventory
router.post('/', authorize('CLINIC_OWNER', 'ADMIN', 'VETERINARIAN'), async (req, res) => {
  const { name, category, sku, barcode, quantity, unit, minQuantity, costPrice, sellPrice, expiryDate, supplier, notes } = req.body;
  const item = await prisma.inventoryItem.create({
    data: {
      clinicId: req.user.clinicId,
      name, category: category || 'OTHER', sku, barcode,
      quantity: quantity || 0, unit: unit || 'adet',
      minQuantity: minQuantity || 0,
      costPrice, sellPrice,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      supplier, notes,
    },
  });
  res.status(201).json(item);
});

// PUT /api/inventory/:id
router.put('/:id', async (req, res) => {
  const item = await prisma.inventoryItem.updateMany({
    where: { id: req.params.id, clinicId: req.user.clinicId },
    data: req.body,
  });
  if (!item.count) return res.status(404).json({ error: 'Ürün bulunamadı' });
  res.json({ success: true });
});

// PATCH /api/inventory/:id/stock - Stok güncelle
router.patch('/:id/stock', async (req, res) => {
  const { delta } = req.body; // pozitif=giriş, negatif=çıkış
  const item = await prisma.inventoryItem.findFirst({
    where: { id: req.params.id, clinicId: req.user.clinicId },
  });
  if (!item) return res.status(404).json({ error: 'Ürün bulunamadı' });

  const updated = await prisma.inventoryItem.update({
    where: { id: req.params.id },
    data: { quantity: { increment: delta } },
  });
  res.json(updated);
});

module.exports = router;
