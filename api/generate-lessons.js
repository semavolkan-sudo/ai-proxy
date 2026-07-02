// api/generate-lessons.js — OTOMATİK SÜRÜM
// Üç çalışma modu:
//  1. Vercel Cron (her gece): en eski/eksik TEK aracın 3 seviye dersini sunucuda üretir → 28 araç ~28 günde bir tazelenir
//  2. POST (frontend/manuel): üretilmiş kartları kaydeder (eski davranış korunur)
//  3. GET ?mode=status: kapsam raporu
// Yetki: Vercel Cron (Authorization: Bearer CRON_SECRET) VEYA x-cron-key VEYA admin JWT

export const config = { maxDuration: 60 };

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

const TOOLS = [
  "ChatGPT","Claude","Gemini","Perplexity","Deepseek","Copilot","Grok",
  "Lovable","Manus","NanoBanana","Leonardo AI","Meta AI","Assembly AI","Canva AI",
  "Veo 3","Sora 2","NotebookLM","Microsoft 365 Copilot",
  "Midjourney","Runway ML","ElevenLabs","Pika Labs","Stable Diffusion",
  "Make.com","Zapier AI","Notion AI",
  "Prompt Engineering","AI İş Stratejisi"
];

const PROFILES = {
  baslangic_kariyer: 'Kariyerinin başında, AI araçlarına yeni başlayan bir çalışan. Teknik terim bilgisi az; sade dil ve temel kavramlarla anlat.',
  orta_kariyer: 'Orta düzey deneyimli bir profesyonel. Temel kavramları biliyor; iş akışına entegrasyon ve verimlilik odaklı anlat.',
  ileri_kariyer: 'Yönetici / ileri düzey kullanıcı. Strateji, ekip verimliliği ve ileri kullanım senaryolarına odaklan.',
};

function buildPrompt(tool, profileCtx) {
  return `Sen AI eğitim uzmanısın. ${tool} aracını öğretiyorsun.
Kurallar: Emin olmadığın arayüz detayını (buton adı, menü yeri) yazma; işlevi tarif et. Arayüzler değişebildiği için gerektiğinde resmî dokümana yönlendir. Uydurma isim, istatistik veya vaka verme. Kazanç garantisi verme.
Öğrenci: ${profileCtx}

15 kart üret: ilk 5 kart TEMEL (araç nedir, neden önemli, başlangıç, temel kavramlar, ekosistem), sonraki 5 kart ÖZELLİKLER (en kritik 5 özellik), son 5 kart PROMPT ŞABLONLARI (kopyala-kullan hazır komutlar ve kullanım senaryoları).
SADECE geçerli bir JSON dizisi döndür, başka hiçbir şey yazma:
[{"title":"başlık","content":"2-3 cümle sade Türkçe açıklama.\\n\\n💡 Örnek Senaryo (temsili):\\nDurum: [Bir meslek grubundan temsili kullanıcı - gerçek kişi ismi UYDURMA]\\nYaklaşım: [Araçla izlediği adımlar ve kullandığı örnek komut]\\nKazanım: [Beklenen somut fayda - uydurma istatistik ve garanti dili YOK]\\n\\n📊 Adım Adım:\\n1️⃣ [Adım]: [Uygulanabilir talimat veya örnek komut]\\n2️⃣ [Adım]: [Ne yapılır, ne beklenir]\\n3️⃣ [Adım]: [Beklenen çıktı]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir pratik öneri]","icon":"emoji"}]`;
}

async function generateCards(tool, profileKey) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: buildPrompt(tool, PROFILES[profileKey]) }],
    }),
  });
  const data = await resp.json();
  let text = '';
  if (Array.isArray(data.content)) for (const b of data.content) text += b.text || '';
  text = text.replace(/```json|```/g, '').trim();
  const start = text.indexOf('['); const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('JSON bulunamadı');
  const cards = JSON.parse(text.slice(start, end + 1));
  if (!Array.isArray(cards) || cards.length < 5) throw new Error('kart sayısı yetersiz');
  return cards;
}

export default async function handler(req, res) {
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cron-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── Yetki: Vercel Cron / cron key / admin JWT ──
  const authz = req.headers['authorization'] || '';
  const isVercelCron = !!process.env.CRON_SECRET && authz === 'Bearer ' + process.env.CRON_SECRET;
  const cronKey = req.headers['x-cron-key'] || req.query.key;
  const isCronKey = !!process.env.CRON_SECRET && cronKey === process.env.CRON_SECRET;
  const authUser = getUserFromRequest(req);
  const isAdmin = !!(authUser && authUser.admin);
  if (!isVercelCron && !isCronKey && !isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date().toISOString().split('T')[0];

  // ── POST: frontend'den gelen kartları kaydet (eski davranış) ──
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
        tool_name: tool, profile_key: profileKey || 'default',
        batch_date: today, cards, updated_at: new Date().toISOString()
      })
    });
    await sbFetch('batch_logs', {
      method: 'POST', prefer: 'return=minimal',
      body: JSON.stringify({
        batch_date: today, started_at: new Date().toISOString(), finished_at: new Date().toISOString(),
        status: sbResp.ok ? 'success' : 'db-error', triggered_by: triggeredBy || 'frontend',
        total_tools: 1, total_profiles: 1,
        success_count: sbResp.ok ? 1 : 0, fail_count: sbResp.ok ? 0 : 1,
        results: [{ tool, profile: profileKey, count: cards.length }]
      })
    });
    return res.status(200).json({ ok: sbResp.ok, tool, count: cards.length });
  }

  // ── Kapsam bilgisi ──
  const covResp = await sbFetch('lesson_cards?select=tool_name,profile_key,updated_at&order=updated_at.asc', { method: 'GET' });
  const rows = Array.isArray(covResp.data) ? covResp.data : [];
  const profileKeys = Object.keys(PROFILES);
  const have = new Set(rows.map(r => r.tool_name + '::' + r.profile_key));
  const missing = [];
  for (const t of TOOLS) for (const pk of profileKeys) {
    if (!have.has(t + '::' + pk)) missing.push(t + '/' + pk);
  }

  if (req.query.mode === 'status') {
    return res.status(200).json({ tools: TOOLS.length, covered: rows.length, missing, oldest: rows[0] || null });
  }

  // ── CRON: hedef aracı seç → eksik olan öncelikli, yoksa en eski güncellenen ──
  let target = null;
  for (const t of TOOLS) {
    if (profileKeys.some(pk => !have.has(t + '::' + pk))) { target = t; break; }
  }
  if (!target) {
    const oldestByTool = {};
    for (const r of rows) {
      if (!TOOLS.includes(r.tool_name)) continue;
      const cur = oldestByTool[r.tool_name];
      if (!cur || r.updated_at < cur) oldestByTool[r.tool_name] = r.updated_at;
    }
    const sorted = Object.entries(oldestByTool).sort((a, b) => (a[1] < b[1] ? -1 : 1));
    target = (sorted.length > 0 ? sorted[0][0] : TOOLS[0]);
  }

  const started = new Date().toISOString();
  const results = []; let ok = 0, fail = 0;
  for (const pk of profileKeys) {
    try {
      const cards = await generateCards(target, pk);
      const save = await sbFetch('lesson_cards', {
        method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal',
        body: JSON.stringify({
          tool_name: target, profile_key: pk, batch_date: today,
          cards, updated_at: new Date().toISOString()
        })
      });
      if (save.ok) { ok++; results.push({ tool: target, profile: pk, count: cards.length }); }
      else { fail++; results.push({ tool: target, profile: pk, error: 'db' }); }
    } catch (e) {
      fail++; results.push({ tool: target, profile: pk, error: String(e.message).slice(0, 80) });
    }
  }

  await sbFetch('batch_logs', {
    method: 'POST', prefer: 'return=minimal',
    body: JSON.stringify({
      batch_date: today, started_at: started, finished_at: new Date().toISOString(),
      status: fail === 0 ? 'success' : (ok > 0 ? 'partial' : 'failed'),
      triggered_by: isVercelCron ? 'vercel-cron' : (isAdmin ? 'admin' : 'cron-key'),
      total_tools: 1, total_profiles: profileKeys.length,
      success_count: ok, fail_count: fail, results
    })
  });

  return res.status(200).json({ ok: fail === 0, tool: target, generated: ok, failed: fail, results });
}
