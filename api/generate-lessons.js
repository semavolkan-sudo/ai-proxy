export const config = { maxDuration: 10 };

import { getUserFromRequest, applyCors } from './_lib/auth.js';

async function sbFetch(path, options = {}) {
  const url = process.env.SUPABASE_URL + '/rest/v1/' + path;
  const r = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_KEY,
      'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
      'Prefer': options.prefer || 'return=minimal',
      ...(options.headers || {})
    }
  });
  const text = await r.text();
  try { return { ok: r.ok, status: r.status, data: JSON.parse(text) }; }
  catch { return { ok: r.ok, status: r.status, data: text }; }
}

export default async function handler(req, res) {
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const cronKey = req.headers['x-cron-key'] || req.query.key;
  const authUser = getUserFromRequest(req);
  const isAdmin = !!(authUser && authUser.admin);
  if (cronKey !== process.env.CRON_SECRET && !isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date().toISOString().split('T')[0];

  if (req.method === 'POST') {
    const body = req.body || {};
    const { tool, profileKey, cards, triggeredBy } = body;

    if (!tool || !cards || !cards.length) {
      return res.status(400).json({ error: 'tool and cards required' });
    }

    const sbResp = await sbFetch('lesson_cards', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=minimal',
      body: JSON.stringify({
        tool_name: tool,
        profile_key: profileKey || 'default',
        batch_date: today,
        cards,
        updated_at: new Date().toISOString()
      })
    });

    await sbFetch('batch_logs', {
      method: 'POST',
      prefer: 'return=minimal',
      body: JSON.stringify({
        batch_date: today,
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        status: sbResp.ok ? 'success' : 'db-error',
        triggered_by: triggeredBy || 'frontend',
        total_tools: 1,
        total_profiles: 1,
        success_count: sbResp.ok ? 1 : 0,
        fail_count: sbResp.ok ? 0 : 1,
        results: [{ tool, profile: profileKey, count: cards.length }]
      })
    });

    return res.status(200).json({ ok: sbResp.ok, tool, count: cards.length });
  }

  const TOOLS = [
    "ChatGPT","Claude","Gemini","Perplexity","Deepseek","Copilot","Grok",
    "Midjourney","Leonardo AI","Stable Diffusion","Canva AI",
    "ElevenLabs","Runway ML","Make.com","Zapier AI","Notion AI",
    "Lovable","Manus","Meta AI","Assembly AI",
    "Prompt Engineering","AI İş Stratejisi"
  ];

  const existingResp = await sbFetch(
    `lesson_cards?batch_date=eq.${today}&select=tool_name,profile_key`,
    { method: 'GET' }
  );

  const existing = existingResp.data || [];
  const done = new Set(existing.map(r => `${r.tool_name}::${r.profile_key}`));
  const pending = TOOLS.filter(t => !done.has(`${t}::default`));

  return res.status(200).json({ today, done: existing.length, pending, total: TOOLS.length });
}
