export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const tool = req.query.tool || (req.body && req.body.tool);
  const profileKey = req.query.profile || (req.body && req.body.profile) || 'default';

  if (!tool) return res.status(400).json({ error: 'tool required' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const today = new Date().toISOString().split('T')[0];

  async function query(filter) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/lesson_cards?${filter}&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const data = await r.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  }

  // 1. Bugün + profile'a özel
  let row = await query(`tool_name=eq.${encodeURIComponent(tool)}&profile_key=eq.${encodeURIComponent(profileKey)}&batch_date=eq.${today}`);

  // 2. Bugün + default
  if (!row && profileKey !== 'default') {
    row = await query(`tool_name=eq.${encodeURIComponent(tool)}&profile_key=eq.default&batch_date=eq.${today}`);
  }

  // 3. En son tarihli
  if (!row) {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/lesson_cards?tool_name=eq.${encodeURIComponent(tool)}&order=batch_date.desc&limit=1`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await r.json();
    row = Array.isArray(data) && data.length > 0 ? data[0] : null;
  }

  if (!row) return res.status(404).json({ cards: [], message: 'No cards available' });

  return res.status(200).json({
    cards: row.cards,
    date: row.batch_date,
    profile: row.profile_key,
    tool,
    count: row.cards ? row.cards.length : 0
  });
}
