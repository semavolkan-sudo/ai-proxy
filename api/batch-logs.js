// api/batch-logs.js — admin JWT ile korunur
import { getUserFromRequest, applyCors } from './_lib/auth.js';

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authUser = getUserFromRequest(req);
  if (!authUser || !authUser.admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const r = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/batch_logs?order=started_at.desc&limit=30`,
    { headers: { apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}` } }
  );
  const logs = await r.json();
  return res.status(200).json({ logs: Array.isArray(logs) ? logs : [] });
}
