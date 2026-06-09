export const config = { maxDuration: 60 };

const TOOLS = [
  "ChatGPT","Claude","Gemini","Perplexity","Deepseek","Copilot","Grok",
  "Midjourney","Leonardo AI","Stable Diffusion","Canva AI",
  "ElevenLabs","Runway ML","Make.com","Zapier AI","Notion AI",
  "Lovable","Manus","Meta AI","Assembly AI",
  "Prompt Engineering","AI İş Stratejisi"
];

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

function buildPrompts(tool, profile) {
  const ctx = `Öğrenci: ${profile.level}, ${profile.goal}`;
  return [
    `Sen dünyaca tanınan AI eğitim uzmanısın. ${tool} aracını öğretiyorsun.\n${ctx}\n\n5 ders kartı üret:\n1. Bu araç bu kişi için neden kritik — somut iş/kariyer faydası\n2. Profile özel ilk kurulum ve hızlı başlangıç\n3. Bu kişinin günlük işinde en çok kullanacağı özellik\n4. Profile özel prompt şablonları ve hazır komutlar\n5. Bu seviyedeki kişilerin sık yaptığı hatalar\n\n${FORMAT}`,
    `Sen fütürist AI strateji danışmanısın. ${tool} için içerik üretiyorsun.\n${ctx}\n\n5 kart üret:\n1. Bu kişi için en kritik entegrasyonlar (Zapier/Make/API)\n2. Profile özel iş akışı otomasyonu — adım adım\n3. Bu kişinin sektöründe rekabet avantajı — rakamlarla\n4. Gelir/verimlilik artışı senaryoları — somut ROI\n5. 2025-2030 fırsatları — bu kişi için özel\n\n${FORMAT}`,
    `Sen hem ${tool} uzmanısın hem AI pedagogusun.\n${ctx}\n\n5 eğitim kartı üret:\n1. Bu profile özel 30 günlük öğrenme planı\n2. Hemen yapılabilecek 3 pratik egzersiz\n3. Bu seviyedeki en çok sorulan sorular ve cevapları\n4. Bir sonraki seviyeye geçiş kriterleri\n5. Bu profile özel başarı hikayeleri — isimli ve detaylı\n\n${FORMAT}`
  ];
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
      max_tokens: 4000,
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
  if (options.returnJson !== false) {
    const text = await r.text();
    try { return { ok: r.ok, status: r.status, data: JSON.parse(text) }; }
    catch { return { ok: r.ok, status: r.status, data: text }; }
  }
  return { ok: r.ok, status: r.status };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const cronKey = req.headers['x-cron-key'] || req.query.key;
  if (cronKey !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const targetTool = req.query.tool;
  const targetProfile = req.query.profile;
  const triggeredBy = req.query.trigger || 'cron';
  const today = new Date().toISOString().split('T')[0];

  const toolsToProcess = targetTool ? [targetTool] : TOOLS;
  const profilesToProcess = targetProfile
    ? PROFILES.filter(p => p.key === targetProfile)
    : PROFILES;

  const logResp = await sbFetch('batch_logs', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify({
      batch_date: today,
      status: 'running',
      triggered_by: triggeredBy,
      total_tools: toolsToProcess.length,
      total_profiles: profilesToProcess.length
    })
  });

  const logId = logResp.data && logResp.data[0] ? logResp.data[0].id : null;
  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const tool of toolsToProcess) {
    for (const profile of profilesToProcess) {
      const prompts = buildPrompts(tool, profile);
      const allCards = [];

      for (let i = 0; i < prompts.length; i++) {
        try {
          const cards = await callAnthropic(prompts[i]);
          allCards.push(...cards);
          if (i < prompts.length - 1) await new Promise(r => setTimeout(r, 1500));
        } catch(e) {
          console.error(`Batch ${i} failed: ${tool}/${profile.key}:`, e.message);
        }
      }

      if (allCards.length > 0) {
        const sbResp = await sbFetch('lesson_cards', {
          method: 'POST',
          prefer: 'resolution=merge-duplicates,return=minimal',
          body: JSON.stringify({
            tool_name: tool,
            profile_key: profile.key,
            batch_date: today,
            cards: allCards,
            updated_at: new Date().toISOString()
          })
        });
        if (sbResp.ok) successCount++; else failCount++;
        results.push({ tool, profile: profile.key, status: sbResp.ok ? 'ok' : 'db-error', count: allCards.length });
      } else {
        failCount++;
        results.push({ tool, profile: profile.key, status: 'failed', count: 0 });
      }
    }
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 2);
  await sbFetch(`lesson_cards?batch_date=lt.${cutoff.toISOString().split('T')[0]}`, {
    method: 'DELETE', returnJson: false
  });

  if (logId) {
    await sbFetch(`batch_logs?id=eq.${logId}`, {
      method: 'PATCH',
      prefer: 'return=minimal',
      body: JSON.stringify({
        finished_at: new Date().toISOString(),
        status: failCount === 0 ? 'success' : successCount > 0 ? 'partial' : 'failed',
        success_count: successCount,
        fail_count: failCount,
        results
      })
    });
  }

  return res.status(200).json({
    date: today,
    triggered_by: triggeredBy,
    success: successCount,
    failed: failCount,
    total: results.length,
    results
  });
}
