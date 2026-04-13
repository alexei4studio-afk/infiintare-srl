const https = require('https');

module.exports = async function (req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://azisunt.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe key not configured' });
  }

  const { amount, tipFirma, numeFirma, email, nume } = req.body;

  // Validate amount
  if (!amount || !['99', '149', '199', '299'].includes(String(amount))) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // Validate required fields
  if (!email || !nume) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Sanitize and validate lengths
  const sanitizedNume = String(nume).trim().substring(0, 100);
  const sanitizedEmail = String(email).trim().substring(0, 254);
  const sanitizedNumeFirma = numeFirma ? String(numeFirma).trim().substring(0, 200) : '';
  const sanitizedTipFirma = tipFirma ? String(tipFirma).trim().substring(0, 10) : 'SRL';

  const products = {
    '99': {
      name: sanitizedTipFirma === 'PFA'
        ? 'Dosar Infiintare PFA Digital - 99 RON'
        : `Dosar Infiintare ${sanitizedTipFirma} - 99 RON`,
      amount: 9900,
    },
    '149': {
      name: sanitizedTipFirma === 'PFA'
        ? 'Dosar Infiintare PFA - 149 RON'
        : `Dosar Infiintare ${sanitizedTipFirma} Digital - 149 RON`,
      amount: 14900,
    },
    '199': {
      name: sanitizedTipFirma === 'PFA'
        ? 'Dosar Infiintare PFA Complet - 199 RON'
        : `Dosar Infiintare ${sanitizedTipFirma} - 199 RON`,
      amount: 19900,
    },
    '299': {
      name: sanitizedTipFirma === 'PFA'
        ? 'Dosar Infiintare PFA - 299 RON'
        : `Dosar Infiintare ${sanitizedTipFirma} Complet - 299 RON`,
      amount: 29900,
    }
  };

  const product = products[String(amount)];

  // Detecteaza domeniul din request pentru success/cancel URL
  const host = req.headers.host || 'infiintare-srl.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const params = new URLSearchParams({
    'payment_method_types[]': 'card',
    'line_items[0][price_data][currency]': 'ron',
    'line_items[0][price_data][product_data][name]': product.name,
    'line_items[0][price_data][unit_amount]': String(product.amount),
    'line_items[0][quantity]': '1',
    'mode': 'payment',
    'customer_email': sanitizedEmail,
    'success_url': `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}`,
    'cancel_url': `${baseUrl}/#app`,
    'metadata[tip_firma]': sanitizedTipFirma,
    'metadata[nume_firma]': sanitizedNumeFirma,
    'metadata[nume_client]': sanitizedNume,
    'metadata[pachet]': String(amount),
  });

  try {
    const session = await stripeRequest('POST', '/v1/checkout/sessions', params.toString(), STRIPE_SECRET_KEY);

    if (session.error) {
      console.error('Stripe error:', session.error);
      return res.status(400).json({ error: session.error.message });
    }

    return res.status(200).json({ url: session.url, id: session.id });

  } catch (err) {
    console.error('Function error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

function stripeRequest(method, path, data, secretKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.stripe.com',
      port: 443,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data),
      }
    };
    const req = https.request(options, (resp) => {
      let body = '';
      resp.on('data', chunk => body += chunk);
      resp.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Failed to parse Stripe response')); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}