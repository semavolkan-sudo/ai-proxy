export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const tool = req.query.tool || (req.body && req.body.tool);
  const profileKey = req.query.profile || (req.body && req.body.profile) || 'default';

  if (!tool) return res.status(400).json({ error: 'tool required' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const today = new Date().toISOString().split('T')[0];

  // Önce profile'a özel içerik ara
  let resp = await fetch(
    `${SUPABASE_URL}/rest/v1/lesson_cards?tool_name=eq.${encodeURIComponent(tool)}&profile_key=eq.${encodeURIComponent(profileKey)}&batch_date=eq.${today}&limit=1`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  );
  let data = await resp.json();

  // Profile'a özel yoksa default içeriği getir
  if (!data || !data.length) {
    resp = await fetch(
      `${SUPABASE_URL}/rest/v1/lesson_cards?tool_name=eq.${encodeURIComponent(tool)}&profile_key=eq.default&batch_date=eq.${today}&limit=1`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    data = await resp.json();
  }

  // Bugün yoksa dünkü içeriği getir
  if (!data || !data.length) {
    resp = await fetch(
      `${SUPABASE_URL}/rest/v1/lesson_cards?tool_name=eq.${encodeURIComponent(tool)}&order=batch_date.desc&limit=1`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    data = await resp.json();
  }

  if (!data || !data.length) {
    return res.status(404).json({ cards: [], message: 'No cards available' });
  }

  return res.status(200).json({
    cards: data[0].cards,
    date: data[0].batch_date,
    profile: data[0].profile_key,
    tool
  });
}
