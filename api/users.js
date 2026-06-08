export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const ADMIN_KEY = process.env.ADMIN_KEY;
  const TEST_PASS = process.env.TEST_USER_PASS;

  const TEST_USERS = {
    'test@aicert.com':    { name: 'Test',         plan: 'Starter'  },
    'testpro@aicert.com': { name: 'TestPro',      plan: 'Pro'      },
    'testbiz@aicert.com': { name: 'TestBusiness', plan: 'Business' },
  };

  async function sb(path, options) {
    const r = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'resolution=merge-duplicates,return=representation',
        ...(options.headers || {})
      }
    });
    return r.json();
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

  if (req.method === 'POST') {
    const { action, user, adminKey, couponCode, email } = req.body;

    // ── Test kullanıcı doğrulama ──────────────────────────
    if (action === 'verify-test' && user && user.email && user.pass) {
      const testUser = TEST_USERS[user.email.toLowerCase()];
      if (!testUser) return res.status(200).json({ ok: false, reason: 'not_test_user' });
      if (!TEST_PASS || user.pass !== TEST_PASS) return res.status(200).json({ ok: false, reason: 'wrong_pass' });
      return res.status(200).json({ ok: true, name: testUser.name, plan: testUser.plan });
    }

    // ── Email varlık kontrolü ─────────────────────────────
    if (action === 'check-email') {
      const emailToCheck = (user && user.email) || email;
      if (!emailToCheck) return res.status(200).json({ exists: false });
      const data = await sb(
        'aica_users?email=eq.' + encodeURIComponent(emailToCheck.toLowerCase().trim()),
        { method: 'GET', headers: { 'Prefer': '' } }
      );
      const exists = Array.isArray(data) && data.length > 0;
      return res.status(200).json({ exists });
    }

    // ── Kupon doğrulama ───────────────────────────────────
    if (action === 'verify-coupon' && couponCode) {
      const coupons = getCoupons();
      const coupon = coupons.find(function(c) {
        return c.code.toUpperCase() === couponCode.toUpperCase() && c.active;
      });
      if (!coupon) {
        return res.status(200).json({ ok: false, reason: 'invalid', message: 'Geçersiz kupon kodu.' });
      }
      if (coupon.assignedTo && coupon.assignedTo !== '') {
        const userEmail = (user && user.email) || email || '';
        if (!userEmail || userEmail.toLowerCase() !== coupon.assignedTo.toLowerCase()) {
          return res.status(200).json({ ok: false, reason: 'not_assigned', message: 'Bu kupon başka bir hesaba atanmıştır.' });
        }
      }
      const usedBy = coupon.usedBy || [];
      if (coupon.maxUses && usedBy.length >= coupon.maxUses) {
        return res.status(200).json({ ok: false, reason: 'expired', message: 'Bu kuponun kullanım limiti dolmuştur.' });
      }
      const userEmail2 = (user && user.email) || email || '';
      if (userEmail2 && usedBy.includes(userEmail2.toLowerCase())) {
        return res.status(200).json({ ok: false, reason: 'already_used', message: 'Bu kuponu daha önce kullandınız.' });
      }
      return res.status(200).json({
        ok: true,
        code: coupon.code,
        discount: coupon.discount,
        type: coupon.type,
        isFree: coupon.type === 'free' || coupon.discount === 100,
        assignedTo: coupon.assignedTo || null
      });
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
      await sb(
        'aica_users?email=eq.' + encodeURIComponent(user.email.toLowerCase().trim()),
        {
          method: 'PATCH',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify({
            xp: user.xp,
            streak: user.streak,
            plan: normalizePlan(user.plan),
            progress: user.progress || {},
            scores: user.scores || {},
            last_seen: new Date().toISOString()
          })
        }
      );
      return res.status(200).json({ ok: true });
    }

    // ── Admin: kullanıcı listesi ──────────────────────────
    if (action === 'list' && adminKey === ADMIN_KEY) {
      const data = await sb('aica_users?order=created_at.desc', {
        method: 'GET',
        headers: { 'Prefer': '' }
      });
      return res.status(200).json({ users: Array.isArray(data) ? data : [] });
    }
  }

  return res.status(400).json({ error: 'bad request' });
}
