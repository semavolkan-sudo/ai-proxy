export const config = { maxDuration: 10 };

const PROFILES = [
  { key:"baslangic_kariyer",   level:"Yeni başlayan",   goal:"Kariyerini geliştirmek isteyen profesyonel" },
  { key:"baslangic_is",        level:"Yeni başlayan",   goal:"Kendi işini kurmak isteyen girişimci" },
  { key:"baslangic_freelance", level:"Yeni başlayan",   goal:"Freelance gelir elde etmek isteyen serbest çalışan" },
  { key:"orta_kariyer",        level:"Orta seviye",     goal:"Kariyerinde hızla ilerlemek isteyen profesyonel" },
  { key:"orta_is",             level:"Orta seviye",     goal:"İşini büyütmek isteyen girişimci" },
  { key:"ileri_kariyer",       level:"İleri seviye",    goal:"Sektöründe AI lideri olmak isteyen uzman" },
  { key:"default",             level:"Genel kullanıcı", goal:"AI araçlarını öğrenmek isteyen kişi" }
];

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const cronKey = req.headers['x-cron-key'] || req.query.key;
  if (cronKey !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tool = req.query.tool;
  const profileKey = req.query.profile || 'default';
  const triggeredBy = req.query.trigger || 'cron';

  if (!tool) {
    return res.status(400).json({ error: 'tool parameter required' });
  }

  const profile = PROFILES.find(p => p.key === profileKey) || PROFILES[6];
  const today = new Date().toISOString().split('T')[0];

  const prompt = `Sen AI eğitim uzmanısın. ${tool} aracını öğretiyorsun.\nÖğrenci: ${profile.level}, ${profile.goal}\n\n5 ders kartı üret. Her kart somut, uygulanabilir, profile özel olmalı.\n\nSADECE JSON döndür:\n[{"title":"başlık","content":"açıklama\\n\\n💡 Örnek: somut senaryo\\n\\n📊 Adımlar:\\n1️⃣ adım\\n2️⃣ adım\\n3️⃣ adım\\n\\n⚡ İpucu: somut ipucu","icon":"emoji"}]`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await resp.json();
    if (data.error) throw new Error(JSON.stringify(data.error));

    const text = (data.content || []).map(c => c.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('No JSON array found');

    const cards = JSON.parse(clean.slice(start, end + 1));
    if (!Array.isArray(cards) || cards.length === 0) throw new Error('Empty cards');

    await sbFetch('lesson_cards', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=minimal',
      body: JSON.stringify({
        tool_name: tool,
        profile_key: profileKey,
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
        status: 'success',
        triggered_by: triggeredBy,
        total_tools: 1,
        total_profiles: 1,
        success_count: 1,
        fail_count: 0,
        results: [{ tool, profile: profileKey, count: cards.length }]
      })
    });

    return res.status(200).json({
      tool, profile: profileKey, date: today,
      status: 'ok', count: cards.length
    });

  } catch(e) {
    await sbFetch('batch_logs', {
      method: 'POST',
      prefer: 'return=minimal',
      body: JSON.stringify({
        batch_date: today,
        started_at: new Date().toISOString(),
        finished_at: new Date().toISOString(),
        status: 'failed',
        triggered_by: triggeredBy,
        total_tools: 1,
        total_profiles: 1,
        success_count: 0,
        fail_count: 1,
        error: e.message
      })
    });
    return res.status(500).json({ error: e.message });
  }
}
