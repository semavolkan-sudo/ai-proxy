export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const ADMIN_KEY = process.env.ADMIN_KEY;

  if (req.method === 'POST') {
    const { action, user, adminKey } = req.body;
    if (action === 'register') {
      return res.status(200).json({ ok: true });
    }
    if (action === 'list' && adminKey === ADMIN_KEY) {
      return res.status(200).json({ users: [] });
    }
  }
  return res.status(400).json({ error: 'bad request' });
}
