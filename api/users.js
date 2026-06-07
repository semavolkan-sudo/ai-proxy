export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const ADMIN_KEY = process.env.ADMIN_KEY;

  async function sbFetch(path, options) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=representation',
        ...(options.headers || {})
      }
    });
    return r.json();
  }

  if (req.method === 'POST') {
    const { action, user, adminKey } = req.body;

    if (action === 'register' && user && user.email) {
      const data = await sbFetch('aica_users?on_conflict=email', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          email: user.email,
          name: user.name || '',
          plan: user.plan || 'Starter',
          xp: user.xp || 0,
          streak: user.streak || 0,
          progress: user.progress || {},
          scores: user.scores || {},
          last_seen: new Date().toISOString()
        })
      });
      return res.status(200).json({ ok: true, data });
    }

    if (action === 'update' && user && user.email) {
      const data = await sbFetch('aica_users?email=eq.' + encodeURIComponent(user.email), {
        method: 'PATCH',
        body: JSON.stringify({
          xp: user.xp,
          streak: user.streak,
          plan: user.plan,
          progress: user.progress,
          scores: user.scores,
          last_seen: new Date().toISOString()
        })
      });
      return res.status(200).json({ ok: true, data });
    }

    if (action === 'list' && adminKey === ADMIN_KEY) {
      const data = await sbFetch('aica_users?order=created_at.desc', {
        method: 'GET'
      });
      return res.status(200).json({ users: data });
    }
  }

  return res.status(400).json({ error: 'bad request' });
}
