const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keySecret      = process.env.RAZORPAY_KEY_SECRET;
  const supabaseUrl    = process.env.SUPABASE_URL;
  const supabaseService = process.env.SUPABASE_SERVICE_KEY;

  if (!keySecret) {
    return res.status(503).json({ error: 'Payment service unavailable' });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId,
    plan = 'guardian',
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Verify HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  // Update Supabase profile if service key is available
  if (supabaseUrl && supabaseService) {
    try {
      const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':        supabaseService,
          'Authorization': `Bearer ${supabaseService}`,
          'Prefer':        'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id:                   userId,
          plan:                 plan,
          plan_activated_at:    new Date().toISOString(),
          razorpay_payment_id,
        }),
      });

      if (!profileRes.ok) {
        const err = await profileRes.text();
        console.error('Luna: profile upsert failed:', err);
        // Don't fail the response - payment is verified, profile update is best-effort
      }
    } catch (e) {
      console.error('Luna: profile upsert error:', e.message);
    }
  }

  return res.status(200).json({ success: true });
};
