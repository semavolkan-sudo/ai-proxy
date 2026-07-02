// api/login.js
// E-posta + şifre ile giriş. Başarılıysa 7 günlük JWT döner.
// Eski düz metin şifreler ilk başarılı girişte otomatik olarak scrypt hash'ine çevrilir.

import {
  signToken,
  verifyPassword,
  hashPassword,
  isLegacyPlaintext,
  applyCors,
} from './_lib/auth.js';

async function sb(path, options = {}) {
  const r = await fetch(process.env.SUPABASE_URL + '/rest/v1/' + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_KEY,
      Prefer: options.prefer || 'return=minimal',
      ...(options.headers || {}),
    },
  });
  const text = await r.text();
  try {
    return { ok: r.ok, status: r.status, data: JSON.parse(text) };
  } catch {
    return { ok: r.ok, status: r.status, data: text };
  }
}

const TEST_USERS = {
  'test@aicert.com':    { name: 'Test',         plan: 'Starter',  profileKey: 'baslangic_kariyer' },
  'testpro@aicert.com': { name: 'TestPro',      plan: 'Pro',      profileKey: 'orta_kariyer' },
  'testbiz@aicert.com': { name: 'TestBusiness', plan: 'Business', profileKey: 'ileri_kariyer' },
};

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const { email, pass } = req.body || {};
  if (!email || !pass) return res.status(400).json({ ok: false, reason: 'missing_fields' });

  const cleanEmail = email.toLowerCase().trim();

  // ── Test kullanıcıları ──────────────────────────────────────
  const testUser = TEST_USERS[cleanEmail];
  if (testUser) {
    if (!process.env.TEST_USER_PASS || pass !== process.env.TEST_USER_PASS) {
      return res.status(401).json({ ok: false, reason: 'invalid_credentials' });
    }
    const token = signToken({
      email: cleanEmail,
      name: testUser.name,
      plan: testUser.plan,
      profileKey: testUser.profileKey,
      test: true,
    });
    return res.status(200).json({ ok: true, token, user: { email: cleanEmail, ...testUser } });
  }

  // ── Gerçek kullanıcılar ─────────────────────────────────────
  const result = await sb(
    'aica_users?email=eq.' + encodeURIComponent(cleanEmail) + '&select=*',
    { method: 'GET', headers: { Prefer: '' } }
  );
  const user = Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : null;

  // Kullanıcı yok ya da şifre yanlış: aynı cevap (enumeration engellenir)
  if (!user || !verifyPassword(pass, user.pass)) {
    return res.status(401).json({ ok: false, reason: 'invalid_credentials' });
  }

  // Eski düz metin kayıt → sessizce hash'e çevir
  if (isLegacyPlaintext(user.pass)) {
    await sb('aica_users?email=eq.' + encodeURIComponent(cleanEmail), {
      method: 'PATCH',
      body: JSON.stringify({ pass: hashPassword(pass) }),
    });
  }

  await sb('aica_users?email=eq.' + encodeURIComponent(cleanEmail), {
    method: 'PATCH',
    body: JSON.stringify({ last_seen: new Date().toISOString() }),
  });

  const isAdmin = !!(process.env.ADMIN_EMAIL && cleanEmail === process.env.ADMIN_EMAIL.toLowerCase());
  const token = signToken({
    email: cleanEmail,
    name: user.name || '',
    plan: user.plan || 'Starter',
    profileKey: user.profile_key || 'default',
    admin: isAdmin,
  });

  return res.status(200).json({
    ok: true,
    token,
    user: {
      email: cleanEmail,
      name: user.name || '',
      plan: user.plan || 'Starter',
      profileKey: user.profile_key || 'default',
      admin: isAdmin,
      xp: user.xp || 0,
      streak: user.streak || 0,
      progress: user.progress || {},
      scores: user.scores || {},
    },
  });
}
