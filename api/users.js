// api/users.js — GÜVENLİ SÜRÜM v2
// Değişiklikler:
//  - "update" artık JWT ister; kullanıcı yalnızca KENDİ kaydını, yalnızca izinli alanları günceller (plan değiştirilemez)
//  - "register" artık şifreyi hash'leyip saklar; mevcut kaydın üzerine yazamaz; plan ancak geçerli %100 kuponla Starter dışına çıkar
//  - Admin işlemleri (list, admin-update, list-coupons) gömülü anahtar yerine admin JWT ister
//  - Reset token crypto.randomUUID ile üretilir, yeni şifre hash'lenerek saklanır
//  - verify-test kaldırıldı (girişler /api/login üzerinden)

import crypto from 'node:crypto';
import { getUserFromRequest, hashPassword, applyCors } from './_lib/auth.js';

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
  try { return { ok: r.ok, status: r.status, data: JSON.parse(text) }; }
  catch { return { ok: r.ok, status: r.status, data: text }; }
}

function normalizePlan(plan) {
  if (!plan) return 'Starter';
  if (typeof plan === 'string') return plan;
  if (plan.name) return plan.name;
  return 'Starter';
}

function getCoupons() {
  try { return JSON.parse(process.env.COUPONS || '[]'); }
  catch { return []; }
}

function checkCoupon(couponCode, email) {
  const coupons = getCoupons();
  const coupon = coupons.find(c => c.code.toUpperCase() === String(couponCode || '').toUpperCase() && c.active);
  if (!coupon) return { ok: false, reason: 'invalid', message: 'Geçersiz kupon kodu.' };
  if (coupon.assignedTo) {
    if (!email || email.toLowerCase() !== coupon.assignedTo.toLowerCase()) {
      return { ok: false, reason: 'not_assigned', message: 'Bu kupon başka bir hesaba atanmıştır.' };
    }
  }
  const usedBy = coupon.usedBy || [];
  if (coupon.maxUses && usedBy.length >= coupon.maxUses) {
    return { ok: false, reason: 'expired', message: 'Bu kuponun kullanım limiti dolmuştur.' };
  }
  if (email && usedBy.includes(email.toLowerCase())) {
    return { ok: false, reason: 'already_used', message: 'Bu kuponu daha önce kullandınız.' };
  }
  return {
    ok: true, code: coupon.code, discount: coupon.discount, type: coupon.type,
    isFree: coupon.type === 'free' || coupon.discount === 100,
    assignedTo: coupon.assignedTo || null,
  };
}

const emailFilter = (e) => 'aica_users?email=eq.' + encodeURIComponent(String(e).toLowerCase().trim());

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(400).json({ error: 'bad request' });

  const { action, user, couponCode, email } = req.body || {};
  const authUser = getUserFromRequest(req); // token yoksa null
  const isAdmin = !!(authUser && authUser.admin);

  // ── Email varlık kontrolü (açık) ────────────────────────────
  if (action === 'check-email') {
    const emailToCheck = (user && user.email) || email;
    if (!emailToCheck) return res.status(200).json({ exists: false });
    const result = await sb(emailFilter(emailToCheck) + '&select=email', { method: 'GET', headers: { Prefer: '' } });
    return res.status(200).json({ exists: Array.isArray(result.data) && result.data.length > 0 });
  }

  // ── Kupon doğrulama (açık) ──────────────────────────────────
  if (action === 'verify-coupon' && couponCode) {
    const userEmail = (user && user.email) || email || '';
    return res.status(200).json(checkCoupon(couponCode, userEmail));
  }

  // ── B2B demo talebi (açık) ──────────────────────────────────
  if (action === 'demo-request') {
    const { lead } = req.body || {};
    if (!lead || !lead.company || !lead.name || !lead.email || String(lead.email).indexOf('@') < 1) {
      return res.status(400).json({ ok: false });
    }
    const r = await sb('aica_leads', {
      method: 'POST',
      body: JSON.stringify({
        company: String(lead.company).slice(0, 200),
        name: String(lead.name).slice(0, 120),
        email: String(lead.email).toLowerCase().trim().slice(0, 200),
        phone: String(lead.phone || '').slice(0, 40),
        size: String(lead.size || '').slice(0, 20),
      }),
    });
    return res.status(200).json({ ok: r.ok });
  }

  if (action === 'list-leads') {
    if (!isAdmin) return res.status(401).json({ error: 'Unauthorized' });
    const data = await sb('aica_leads?order=created_at.desc&limit=200', { method: 'GET', headers: { Prefer: '' } });
    return res.status(200).json({ leads: Array.isArray(data.data) ? data.data : [] });
  }

  // ── Kayıt doğrulama kodu e-postası (açık) ───────────────────
  if (action === 'send-verify-code') {
    const { code } = req.body || {};
    const target = email || (user && user.email);
    if (!target || !/^\d{6}$/.test(String(code || ''))) {
      return res.status(400).json({ ok: false });
    }
    const emailResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.RESEND_API_KEY },
      body: JSON.stringify({
        from: 'AI Certification Academy <noreply@cert-academy.ai>',
        to: [String(target).toLowerCase().trim()],
        subject: 'Doğrulama Kodun - AI Certification Academy',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#070711;color:#fff;padding:32px;border-radius:16px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:32px;margin-bottom:8px;">✉️</div>
              <h1 style="color:#d4a853;font-size:22px;margin:0;">E-posta Doğrulama</h1>
            </div>
            <p style="color:#ccccdd;line-height:1.6;">AI Certification Academy kaydını tamamlamak için doğrulama kodun:</p>
            <div style="text-align:center;margin:28px 0;">
              <div style="display:inline-block;background:rgba(212,168,83,0.12);border:1px solid #d4a853;border-radius:12px;padding:16px 32px;font-size:30px;font-weight:800;letter-spacing:8px;color:#f0c060;">${code}</div>
            </div>
            <p style="color:#888899;font-size:12px;line-height:1.6;">Bu kodu sen istemediysen bu e-postayı yok sayabilirsin.</p>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;">
            <p style="color:#555577;font-size:11px;text-align:center;">AI Certification Academy · cert-academy.ai · info@cert-academy.ai</p>
          </div>
        `,
      }),
    });
    return res.status(200).json({ ok: emailResp.ok });
  }

  // ── Kayıt (açık; yalnızca YENİ kullanıcı oluşturur) ─────────
  if (action === 'register' && user && user.email) {
    const cleanEmail = user.email.toLowerCase().trim();

    const existing = await sb(emailFilter(cleanEmail) + '&select=email', { method: 'GET', headers: { Prefer: '' } });
    if (Array.isArray(existing.data) && existing.data.length > 0) {
      return res.status(200).json({ ok: false, reason: 'exists' });
    }

    // Plan: varsayılan Starter. Yalnızca sunucuda doğrulanan %100/free kuponla yükseltilebilir.
    let plan = 'Starter';
    const requestedPlan = normalizePlan(user.plan);
    const cCode = (user.coupon && user.coupon.code) || couponCode;
    if (requestedPlan !== 'Starter' && cCode) {
      const c = checkCoupon(cCode, cleanEmail);
      if (c.ok && c.isFree) plan = requestedPlan;
    }

    await sb('aica_users', {
      method: 'POST',
      body: JSON.stringify({
        email: cleanEmail,
        name: user.name || '',
        pass: user.pass ? hashPassword(user.pass) : null,
        plan,
        profile_key: user.profileKey || user.profile_key || 'default',
        xp: user.xp || 0,
        streak: user.streak || 0,
        progress: user.progress || {},
        scores: user.scores || {},
        last_seen: new Date().toISOString(),
      }),
    });
    return res.status(200).json({ ok: true, plan });
  }

  // ── Kendi kaydını güncelleme (JWT zorunlu) ──────────────────
  if (action === 'update') {
    if (!authUser) return res.status(401).json({ error: 'Unauthorized' });
    const u = user || {};
    const updateData = { last_seen: new Date().toISOString() };
    // İzinli alanlar — plan BİLEREK yok: plan sadece kupon/admin/ödeme ile değişir
    if (u.xp !== undefined) updateData.xp = u.xp;
    if (u.streak !== undefined) updateData.streak = u.streak;
    if (u.progress !== undefined) updateData.progress = u.progress;
    if (u.scores !== undefined) updateData.scores = u.scores;
    if (u.name !== undefined) updateData.name = u.name;
    if (u.profileKey !== undefined) updateData.profile_key = u.profileKey;
    if (u.profile_key !== undefined) updateData.profile_key = u.profile_key;

    await sb(emailFilter(authUser.email), { method: 'PATCH', body: JSON.stringify(updateData) });
    return res.status(200).json({ ok: true });
  }

  // ── Şifre sıfırlama isteği (açık) ───────────────────────────
  if (action === 'reset-password') {
    const resetEmail = (user && user.email) || email;
    if (!resetEmail) return res.status(200).json({ ok: false, reason: 'email_required' });
    const cleanEmail = resetEmail.toLowerCase().trim();
    const result = await sb(emailFilter(cleanEmail), { method: 'GET', headers: { Prefer: '' } });
    const userData = Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : null;
    if (!userData) return res.status(200).json({ ok: true }); // enumeration engeli

    const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await sb(emailFilter(cleanEmail), {
      method: 'PATCH',
      body: JSON.stringify({ reset_token: token, reset_token_expiry: expiry }),
    });

    const resetLink = `https://cert-academy.ai?reset=${token}&email=${encodeURIComponent(cleanEmail)}`;
    const emailResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.RESEND_API_KEY },
      body: JSON.stringify({
        from: 'AI Certification Academy <noreply@cert-academy.ai>',
        to: [cleanEmail],
        subject: 'Şifre Sıfırlama - AI Certification Academy',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#070711;color:#fff;padding:32px;border-radius:16px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:32px;margin-bottom:8px;">🔑</div>
              <h1 style="color:#d4a853;font-size:22px;margin:0;">Şifre Sıfırlama</h1>
            </div>
            <p style="color:#ccccdd;line-height:1.6;">Merhaba ${userData.name || ''},</p>
            <p style="color:#ccccdd;line-height:1.6;">AI Certification Academy hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${resetLink}" style="background:linear-gradient(135deg,#d4a853,#f0c060);color:#08080f;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;display:inline-block;">Şifremi Sıfırla</a>
            </div>
            <p style="color:#888899;font-size:12px;line-height:1.6;">Bu bağlantı 1 saat geçerlidir.</p>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;">
            <p style="color:#555577;font-size:11px;text-align:center;">AI Certification Academy · cert-academy.ai · info@cert-academy.ai</p>
          </div>
        `,
      }),
    });
    return res.status(200).json({ ok: emailResp.ok });
  }

  // ── Reset token ile yeni şifre (açık; token zaten kanıt) ────
  if (action === 'verify-reset-token') {
    const { token, email: tokenEmail, newPass } = req.body || {};
    if (!token || !tokenEmail || !newPass) return res.status(200).json({ ok: false, reason: 'missing_fields' });
    const result = await sb(
      emailFilter(tokenEmail) + '&reset_token=eq.' + encodeURIComponent(token),
      { method: 'GET', headers: { Prefer: '' } }
    );
    if (!Array.isArray(result.data) || result.data.length === 0) return res.status(200).json({ ok: false, reason: 'invalid_token' });
    const userData = result.data[0];
    if (new Date(userData.reset_token_expiry) < new Date()) return res.status(200).json({ ok: false, reason: 'token_expired' });
    await sb(emailFilter(tokenEmail), {
      method: 'PATCH',
      body: JSON.stringify({ pass: hashPassword(newPass), reset_token: null, reset_token_expiry: null }),
    });
    return res.status(200).json({ ok: true });
  }

  // ── ADMIN işlemleri (admin JWT zorunlu) ─────────────────────
  if (action === 'list') {
    if (!isAdmin) return res.status(401).json({ error: 'Unauthorized' });
    const data = await sb('aica_users?order=created_at.desc&select=email,name,plan,profile_key,xp,streak,last_seen,created_at', {
      method: 'GET', headers: { Prefer: '' },
    });
    return res.status(200).json({ users: Array.isArray(data.data) ? data.data : [] });
  }

  if (action === 'admin-update') {
    if (!isAdmin) return res.status(401).json({ error: 'Unauthorized' });
    if (!user || !user.email) return res.status(400).json({ error: 'user.email required' });
    const updateData = {};
    if (user.plan !== undefined) updateData.plan = normalizePlan(user.plan);
    if (user.profileKey !== undefined) updateData.profile_key = user.profileKey;
    if (user.profile_key !== undefined) updateData.profile_key = user.profile_key;
    if (user.name !== undefined) updateData.name = user.name;
    if (user.xp !== undefined) updateData.xp = user.xp;
    await sb(emailFilter(user.email), { method: 'PATCH', body: JSON.stringify(updateData) });
    return res.status(200).json({ ok: true });
  }

  if (action === 'list-coupons') {
    if (!isAdmin) return res.status(401).json({ error: 'Unauthorized' });
    return res.status(200).json({ coupons: getCoupons() });
  }

  return res.status(400).json({ error: 'bad request' });
}
