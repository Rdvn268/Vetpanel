const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Service role - backend'de tüm RLS'i bypass eder, güvenli
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = supabase;
