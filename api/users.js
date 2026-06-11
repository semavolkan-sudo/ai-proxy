export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const ADMIN_KEY = process.env.ADMIN_KEY;
  const TEST_PASS = process.env.TEST_USER_PASS;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  const TEST_USERS = {
    'test@aicert.com':    { name: 'Test',         plan: 'Starter',  profileKey: 'baslangic_kariyer' },
    'testpro@aicert.com': { name: 'TestPro',      plan: 'Pro',      profileKey: 'orta_kariyer'      },
    'testbiz@aicert.com': { name: 'TestBusiness', plan: 'Business', profileKey: 'ileri_kariyer'     },
  };

  async function sb(path, options = {}) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': options.prefer || 'resolution=merge-duplicates,return=representation',
        ...(options.headers || {})
      }
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
    catch(e) { return []; }
  }

  function generateResetToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  if (req.method === 'POST') {
    const { action, user, adminKey, couponCode, email } = req.body || {};

    // ── Test kullanıcı doğrulama ──────────────────────────
    if (action === 'verify-test' && user && user.email && user.pass) {
      const testUser = TEST_USERS[user.email.toLowerCase()];
      if (!testUser) return res.status(200).json({ ok: false, reason: 'not_test_user' });
      if (!TEST_PASS || user.pass !== TEST_PASS) return res.status(200).json({ ok: false, reason: 'wrong_pass' });
      return res.status(200).json({
        ok: true,
        name: testUser.name,
        plan: testUser.plan,
        profileKey: testUser.profileKey
      });
    }

    // ── Email varlık kontrolü ─────────────────────────────
    if (action === 'check-email') {
      const emailToCheck = (user && user.email) || email;
      if (!emailToCheck) return res.status(200).json({ exists: false });
      const result = await sb(
        'aica_users?email=eq.' + encodeURIComponent(emailToCheck.toLowerCase().trim()),
        { method: 'GET', headers: { 'Prefer': '' } }
      );
      const exists = Array.isArray(result.data) && result.data.length > 0;
      return res.status(200).json({ exists });
    }

    // ── Şifre sıfırlama ───────────────────────────────────
    if (action === 'reset-password') {
      const resetEmail = (user && user.email) || email;
      if (!resetEmail) return res.status(200).json({ ok: false, reason: 'email_required' });
      const cleanEmail = resetEmail.toLowerCase().trim();
      const result = await sb(
        'aica_users?email=eq.' + encodeURIComponent(cleanEmail),
        { method: 'GET', headers: { 'Prefer': '' } }
      );
      const userExists = Array.isArray(result.data) && result.data.length > 0;
      const userData = userExists ? result.data[0] : null;
      if (!userExists) return res.status(200).json({ ok: true });

      const token = generateResetToken();
      const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await sb('aica_users?email=eq.' + encodeURIComponent(cleanEmail), {
        method: 'PATCH',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({ reset_token: token, reset_token_expiry: expiry })
      });

      const resetLink = `https://cert-academy.ai?reset=${token}&email=${encodeURIComponent(cleanEmail)}`;
      const emailResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + RESEND_API_KEY },
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
          `
        })
      });
      const emailData = await emailResp.json();
      console.log('Resend response:', JSON.stringify(emailData));
      return res.status(200).json({ ok: emailResp.ok });
    }

    // ── Şifre sıfırlama token doğrulama ──────────────────
    if (action === 'verify-reset-token') {
      const { token, email: tokenEmail, newPass } = req.body;
      if (!token || !tokenEmail || !newPass) return res.status(200).json({ ok: false, reason: 'missing_fields' });
      const result = await sb(
        'aica_users?email=eq.' + encodeURIComponent(tokenEmail.toLowerCase()) + '&reset_token=eq.' + token,
        { method: 'GET', headers: { 'Prefer': '' } }
      );
      if (!Array.isArray(result.data) || result.data.length === 0) return res.status(200).json({ ok: false, reason: 'invalid_token' });
      const userData = result.data[0];
      if (new Date(userData.reset_token_expiry) < new Date()) return res.status(200).json({ ok: false, reason: 'token_expired' });
      await sb('aica_users?email=eq.' + encodeURIComponent(tokenEmail.toLowerCase()), {
        method: 'PATCH',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({ pass: newPass, reset_token: null, reset_token_expiry: null })
      });
      return res.status(200).json({ ok: true });
    }

    // ── Kupon doğrulama ───────────────────────────────────
    if (action === 'verify-coupon' && couponCode) {
      const coupons = getCoupons();
      const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.active);
      if (!coupon) return res.status(200).json({ ok: false, reason: 'invalid', message: 'Geçersiz kupon kodu.' });
      if (coupon.assignedTo && coupon.assignedTo !== '') {
        const userEmail = (user && user.email) || email || '';
        if (!userEmail || userEmail.toLowerCase() !== coupon.assignedTo.toLowerCase()) {
          return res.status(200).json({ ok: false, reason: 'not_assigned', message: 'Bu kupon başka bir hesaba atanmıştır.' });
        }
      }
      const usedBy = coupon.usedBy || [];
      if (coupon.maxUses && usedBy.length >= coupon.maxUses) return res.status(200).json({ ok: false, reason: 'expired', message: 'Bu kuponun kullanım limiti dolmuştur.' });
      const userEmail2 = (user && user.email) || email || '';
      if (userEmail2 && usedBy.includes(userEmail2.toLowerCase())) return res.status(200).json({ ok: false, reason: 'already_used', message: 'Bu kuponu daha önce kullandınız.' });
      return res.status(200).json({ ok: true, code: coupon.code, discount: coupon.discount, type: coupon.type, isFree: coupon.type === 'free' || coupon.discount === 100, assignedTo: coupon.assignedTo || null });
    }

    // ── Kupon listesi (admin) ─────────────────────────────
    if (action === 'list-coupons' && adminKey === ADMIN_KEY) {
      return res.status(200).json({ coupons: getCoupons() });
    }

    // ── Kullanıcı kayıt ───────────────────────────────────
    if (action === 'register' && user && user.email) {
      await sb('aica_users', {
        method: 'POST',
        body: JSON.stringify({
          email: user.email.toLowerCase().trim(),
          name: user.name || '',
          plan: normalizePlan(user.plan),
          profile_key: user.profileKey || 'default',
          xp: user.xp || 0,
          streak: user.streak || 0,
          progress: user.progress || {},
          scores: user.scores || {},
          last_seen: new Date().toISOString()
        })
      });
      return res.status(200).json({ ok: true });
    }

    // ── Kullanıcı güncelleme ──────────────────────────────
    if (action === 'update' && user && user.email) {
      const updateData = {
        last_seen: new Date().toISOString()
      };
      if (user.xp !== undefined) updateData.xp = user.xp;
      if (user.streak !== undefined) updateData.streak = user.streak;
      if (user.plan !== undefined) updateData.plan = normalizePlan(user.plan);
      if (user.progress !== undefined) updateData.progress = user.progress;
      if (user.scores !== undefined) updateData.scores = user.scores;
      if (user.profileKey !== undefined) updateData.profile_key = user.profileKey;

      await sb(
        'aica_users?email=eq.' + encodeURIComponent(user.email.toLowerCase().trim()),
        { method: 'PATCH', headers: { 'Prefer': 'return=representation' }, body: JSON.stringify(updateData) }
      );
      return res.status(200).json({ ok: true });
    }

    // ── Admin: kullanıcı listesi ──────────────────────────
    if (action === 'list' && adminKey === ADMIN_KEY) {
      const data = await sb('aica_users?order=created_at.desc', {
        method: 'GET', headers: { 'Prefer': '' }
      });
      return res.status(200).json({ users: Array.isArray(data.data) ? data.data : [] });
    }
  }

  return res.status(400).json({ error: 'bad request' });
}
