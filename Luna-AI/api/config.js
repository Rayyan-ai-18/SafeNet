// Returns only the Supabase anon key - safe to expose, protected by RLS.
// NEVER return SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY here.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseKey: process.env.SUPABASE_ANON_KEY || '',
  });
};
