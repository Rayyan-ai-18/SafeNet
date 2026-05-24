module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const keyId     = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(503).json({ error: 'Payment service unavailable' });
  }

  const { plan } = req.body;
  const PLANS = {
    guardian: { amount: 99900,    label: 'Guardian Shield — ₹999/month'     },
    sentinel: { amount: 1999900,  label: 'Sentinel Edge — ₹19,999/month'   },
  };
  if (!PLANS[plan]) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  try {
    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        amount:   PLANS[plan].amount,
        currency: 'INR',
        receipt:  `${plan}_${Date.now()}`,
      }),
    });

    if (!rzpRes.ok) {
      const err = await rzpRes.text();
      return res.status(rzpRes.status).json({ error: err });
    }

    const data = await rzpRes.json();

    return res.status(200).json({
      orderId:     data.id,
      amount:      data.amount,
      currency:    data.currency,
      keyId,
      description: PLANS[plan].label,
      plan,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
