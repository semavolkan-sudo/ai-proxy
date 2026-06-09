export const config = { maxDuration: 60 };

const PROFILES = [
  { key:"baslangic_kariyer",   level:"Yeni başlayan",   goal:"Kariyerini geliştirmek isteyen profesyonel" },
  { key:"baslangic_is",        level:"Yeni başlayan",   goal:"Kendi işini kurmak isteyen girişimci" },
  { key:"baslangic_freelance", level:"Yeni başlayan",   goal:"Freelance gelir elde etmek isteyen serbest çalışan" },
  { key:"orta_kariyer",        level:"Orta seviye",     goal:"Kariyerinde hızla ilerlemek isteyen profesyonel" },
  { key:"orta_is",             level:"Orta seviye",     goal:"İşini büyütmek isteyen girişimci" },
  { key:"ileri_kariyer",       level:"İleri seviye",    goal:"Sektöründe AI lideri olmak isteyen uzman" },
  { key:"default",             level:"Genel kullanıcı", goal:"AI araçlarını öğrenmek isteyen kişi" }
];

const FORMAT = `SADECE JSON döndür, başka hiçbir şey yazma:
[{"title":"başlık","content":"detaylı açıklama\\n\\n💡 Gerçek Örnek: [isim/meslek] somut senaryo\\n\\n📊 Adımlar:\\n1️⃣ [Adım]: [somut örnek]\\n2️⃣ [Adım]: [somut örnek]\\n3️⃣ [Adım]: [somut örnek]\\n\\n⚡ Pro İpucu: [rakam/oran içeren ipucu]","icon":"emoji"}]`;

function buildPrompt(tool, profile) {
  const ctx = `Öğrenci: ${profile.level}, ${profile.goal}`;
  return `Sen dünyaca tanınan AI eğitim uzmanısın. ${tool} aracını öğretiyorsun.\n${ctx}\n\n15 ders kartı üret:\n1-5: Temel kullanım, kurulum, kritik özellikler, prompt şablonları, sık hatalar\n6-10: Entegrasyonlar, otomasyon, rekabet avantajı, ROI senaryoları, 2025-2030 fırsatları\n11-15: 30 günlük plan, pratik egzersizler, sık sorular, sonraki seviye, başarı hikayeleri\n\nHer kart için profile özel, somut, uygulanabilir içerik üret.\n\n${FORMAT}`;
}

async function callAnthropic(prompt) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await resp.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  const text = (data.content || []).map(c => c.text || '').join('');
  const clean = text.replace(/```json|```/g, '').trim();
  const start = clean.indexOf('[');
  const end = clean.lastIndexOf(']');
  if (start === -1 || end === -1) return [];
  const parsed = JSON.parse(clean.slice(start, end + 1));
  return Array.isArray(parsed) ? parsed : [];
}

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
    return res.status(400).json({ error: 'tool parameter required. Call this endpoint once per tool.' });
  }

  const profile = PROFILES.find(p => p.key === profileKey) || PROFILES.find(p => p.key === 'default');
  const today = new Date().toISOString().split('T')[0];

  const logResp = await sbFetch('batch_logs', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify({
      batch_date: today,
      status: 'running',
      triggered_by: triggeredBy,
      total_tools: 1,
      total_profiles: 1
    })
  });

  const logId = logResp.data && logResp.data[0] ? logResp.data[0].id : null;

  try {
    const prompt = buildPrompt(tool, profile);
    const cards = await callAnthropic(prompt);

    if (cards.length === 0) {
      if (logId) {
        await sbFetch(`batch_logs?id=eq.${logId}`, {
          method: 'PATCH',
          prefer: 'return=minimal',
          body: JSON.stringify({ finished_at: new Date().toISOString(), status: 'failed', fail_count: 1 })
        });
      }
      return res.status(200).json({ tool, profile: profileKey, status: 'failed', count: 0 });
    }

    const sbResp = await sbFetch('lesson_cards', {
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

    if (logId) {
      await sbFetch(`batch_logs?id=eq.${logId}`, {
        method: 'PATCH',
        prefer: 'return=minimal',
        body: JSON.stringify({
          finished_at: new Date().toISOString(),
          status: sbResp.ok ? 'success' : 'db-error',
          success_count: sbResp.ok ? 1 : 0,
          fail_count: sbResp.ok ? 0 : 1,
          results: [{ tool, profile: profileKey, count: cards.length }]
        })
      });
    }

    return res.status(200).json({
      tool,
      profile: profileKey,
      date: today,
      triggered_by: triggeredBy,
      status: sbResp.ok ? 'ok' : 'db-error',
      count: cards.length
    });

  } catch(e) {
    if (logId) {
      await sbFetch(`batch_logs?id=eq.${logId}`, {
        method: 'PATCH',
        prefer: 'return=minimal',
        body: JSON.stringify({ finished_at: new Date().toISOString(), status: 'failed', error: e.message })
      });
    }
    return res.status(500).json({ error: e.message });
  }
}
