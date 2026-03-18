const supabase = require('../lib/supabase');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkilendirme token\'ı gerekli' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Supabase token'ı doğrula
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) {
      return res.status(401).json({ error: 'Geçersiz token' });
    }

    // Kullanıcı profilini al (clinic_id, role)
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, clinic_id, is_active')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile || !profile.is_active) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı veya devre dışı' });
    }

    req.user = profile;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Kimlik doğrulama hatası' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
