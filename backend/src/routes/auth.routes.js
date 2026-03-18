const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth.middleware');

// POST /api/auth/register — Klinik + ilk kullanıcı oluştur
router.post('/register', [
  body('clinicName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { clinicName, email, password, firstName, lastName, phone } = req.body;
  try {
    // 1. Supabase Auth'da kullanıcı oluştur (admin API)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // email doğrulama gerek yok (klinik için)
    });
    if (authError) return res.status(400).json({ error: authError.message });

    // 2. Klinik oluştur
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .insert({ name: clinicName })
      .select()
      .single();
    if (clinicError) throw clinicError;

    // 3. Kullanıcı profili oluştur (users tablosu)
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        clinic_id: clinic.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: 'CLINIC_OWNER',
      })
      .select()
      .single();
    if (profileError) throw profileError;

    // 4. Login yap ve token al
    const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (loginError) throw loginError;

    res.status(201).json({
      token: session.session.access_token,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        role: userProfile.role,
        clinic: { id: clinic.id, name: clinic.name },
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Email veya şifre hatalı' });

    // Kullanıcı profilini ve klinik bilgisini al
    const { data: profile } = await supabase
      .from('users')
      .select('*, clinics(id, name, logo)')
      .eq('id', data.user.id)
      .single();

    if (!profile?.is_active) {
      return res.status(401).json({ error: 'Hesabınız devre dışı bırakılmış' });
    }

    res.json({
      token: data.session.access_token,
      user: {
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: profile.role,
        clinic: profile.clinics,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const { data } = await supabase
    .from('users')
    .select('*, clinics(id, name, logo)')
    .eq('id', req.user.id)
    .single();

  res.json({
    id: data.id,
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    role: data.role,
    phone: data.phone,
    avatar: data.avatar,
    clinic: data.clinics,
  });
});

module.exports = router;
