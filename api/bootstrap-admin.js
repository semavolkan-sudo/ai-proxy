// api/bootstrap-admin.js — TEK SEFERLİK admin kurulum endpoint'i
// Kullanım: bir kez çağır, admin hesabını oluşturur/sıfırlar, sonra bu dosyayı repodan sil.
// Güvenlik: BOOTSTRAP_SECRET env değişkeni + ADMIN_EMAIL ile eşleşme zorunlu.
//
// Çağrı (tarayıcı konsolu veya curl):
//   POST /api/bootstrap-admin
//   Body: { "secret": "<BOOTSTRAP_SECRET>", "pass": "<yeni admin şifresi>" }

import { hashPassword, applyCors } from './_lib/auth.js';

async function sb(path, options = {}) {
  const r = await fetch(process.env.SUPABASE_URL + '/rest/v1/' + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
      Prefer: options.prefer || 'return=representation',
      ...(options.headers || {}),
    },
  });
  const text = await r.text();
  try { return { ok: r.ok, status: r.status, data: JSON.parse(text) }; }
  catch { return { ok: r.ok, status: r.status, data: text }; }
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const { secret, pass } = req.body || {};
  const envSecret = process.env.JWT_SECRET || '';
  if (!envSecret || secret !== envSecret) {
    // TEK SEFERLİK TEŞHİS: değerleri DEĞİL, sadece uzunlukları ve ilk/son karakteri loglar
    console.log('BOOTSTRAP_DEBUG',
      'envLen=' + envSecret.length,
      'gotLen=' + (secret ? String(secret).length : 0),
      'envHead=' + envSecret.slice(0, 3),
      'gotHead=' + (secret ? String(secret).slice(0, 3) : ''),
      'envTail=' + envSecret.slice(-3),
      'gotTail=' + (secret ? String(secret).slice(-3) : '')
    );
    return res.status(401).json({ error: 'Unauthorized', envLen: envSecret.length, gotLen: secret ? String(secret).length : 0 });
  }
  if (!pass || String(pass).length < 8) {
    return res.status(400).json({ error: 'pass required (min 8 chars)' });
  }
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  if (!adminEmail) return res.status(400).json({ error: 'ADMIN_EMAIL not set' });

  const hashed = hashPassword(String(pass));

  // Var mı diye bak
  const existing = await sb(
    'aica_users?email=eq.' + encodeURIComponent(adminEmail) + '&select=email',
    { method: 'GET', headers: { Prefer: '' } }
  );
  const exists = Array.isArray(existing.data) && existing.data.length > 0;

  if (exists) {
    await sb('aica_users?email=eq.' + encodeURIComponent(adminEmail), {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ pass: hashed, plan: 'Business' }),
    });
    return res.status(200).json({ ok: true, action: 'updated', email: adminEmail });
  }

  await sb('aica_users', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      email: adminEmail,
      name: 'Admin',
      pass: hashed,
      plan: 'Business',
      profile_key: 'ileri_kariyer',
      xp: 0, streak: 0, progress: {}, scores: {},
      last_seen: new Date().toISOString(),
    }),
  });
  return res.status(200).json({ ok: true, action: 'created', email: adminEmail });
}
