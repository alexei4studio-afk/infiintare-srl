const https = require('https');

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://azisunt.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe key not configured' });
  }

  const sessionId = req.query.session_id;

  if (!sessionId || (!sessionId.startsWith('cs_live_') && !sessionId.startsWith('cs_test_'))) {
    return res.status(400).json({ error: 'Invalid session_id', valid: false });
  }

  try {
    const session = await stripeRequest('GET', `/v1/checkout/sessions/${sessionId}`, STRIPE_SECRET_KEY);

    if (session.error) {
      return res.status(400).json({ error: 'Session not found', valid: false });
    }

    if (session.payment_status !== 'paid') {
      return res.status(200).json({ valid: false, reason: 'Payment not completed' });
    }

    return res.status(200).json({
      valid: true,
      tipFirma: session.metadata?.tip_firma || 'SRL',
      numeFirma: session.metadata?.nume_firma || '',
      numeClient: session.metadata?.nume_client || '',
      pachet: session.metadata?.pachet || '50',
      email: session.customer_email || '',
    });

  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ error: 'Verification failed', valid: false });
  }
};

function stripeRequest(method, path, secretKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.stripe.com',
      port: 443,
      path,
      method,
      headers: { 'Authorization': `Bearer ${secretKey}` }
    };
    const req = https.request(options, (resp) => {
      let body = '';
      resp.on('data', chunk => body += chunk);
      resp.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Parse error')); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}
