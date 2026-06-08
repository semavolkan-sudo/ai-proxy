export const config = { maxDuration: 300 };

const TOOLS = [
  "ChatGPT","Claude","Gemini","Perplexity","Deepseek","Copilot","Grok",
  "Midjourney","Leonardo AI","Stable Diffusion","Canva AI",
  "ElevenLabs","Runway ML","Make.com","Zapier AI","Notion AI",
  "Lovable","Manus","Meta AI","Assembly AI",
  "Prompt Engineering","AI İş Stratejisi"
];

const PROFILES = [
  { key: "baslangic_kariyer",   level: "Yeni başlayan",  goal: "Kariyerini geliştirmek isteyen profesyonel" },
  { key: "baslangic_is",        level: "Yeni başlayan",  goal: "Kendi işini kurmak isteyen girişimci" },
  { key: "baslangic_freelance", level: "Yeni başlayan",  goal: "Freelance gelir elde etmek isteyen serbest çalışan" },
  { key: "orta_kariyer",        level: "Orta seviye",    goal: "Kariyerinde hızla ilerlemek isteyen profesyonel" },
  { key: "orta_is",             level: "Orta seviye",    goal: "İşini büyütmek isteyen girişimci" },
  { key: "ileri_kariyer",       level: "İleri seviye",   goal: "Sektöründe AI lideri olmak isteyen uzman" },
  { key: "default",             level: "Genel kullanıcı",goal: "AI araçlarını öğrenmek isteyen kişi" }
];

const FORMAT = `Her kart şu yapıda olmalı:
- 4-5 cümle detaylı açıklama
- Gerçek ve uygulanabilir senaryo
- Her adımın yanında somut örnek

SADECE JSON:
[{"title":"başlık","content":"detaylı açıklama\\n\\n💡 Gerçek Örnek: [isim ve meslek belirt] nasıl kullandı — somut sonuç\\n\\n📊 Adımlar:\\n1️⃣ [Adım adı]: [Bu adımın somut örneği — ne yazılır, ne tıklanır, ne yapılır]\\n2️⃣ [Adım adı]: [Bu adımın somut örneği — gerçek bir komut veya eylem]\\n3️⃣ [Adım adı]: [Bu adımın somut örneği — beklenen sonuç ne olur]\\n\\n⚡ Pro İpucu: [Çoğu kullanıcının bilmediği, zaman kazandıran somut ipucu — rakam veya oran içersin]","icon":"emoji"}]`;

function buildPrompts(tool, profile) {
  const ctx = `Öğrenci profili: ${profile.level}, ${profile.goal}`;
  return [
    `Sen dünyaca tanınan bir AI eğitim uzmanısın. ${tool} aracını öğretiyorsun.\n${ctx}\n\nBu profile ÖZEL 5 ders kartı üret:\n1. Bu araç bu kişi için neden önemli — somut kariyer/iş faydası\n2. Bu profile özel ilk kurulum ve kullanım senaryosu\n3. Bu kişinin işinde kullanabileceği en kritik özellik\n4. Bu profile özel prompt ve komut şablonları\n5. Bu kişinin sık yaptığı hatalar ve çözümleri\n\n${FORMAT}`,

    `Sen fütürist AI danışmanısın. ${tool} için içerik üretiyorsun.\n${ctx}\n\nBu profile ÖZEL 5 kart üret:\n1. Bu kişi için en değerli entegrasyonlar ve otomasyon senaryoları\n2. Bu profile özel iş akışı otomasyonu — adım adım kurulum\n3. Bu kişinin sektöründe rekabet avantajı\n4. Bu profile özel gelir/verimlilik artışı senaryoları\n5. Bu kişi için 2025-2030 fırsatları\n\n${FORMAT}`,

    `Sen hem ${tool} uzmanısın hem AI pedagogusun.\n${ctx}\n\nBu profile ÖZEL 5 eğitim kartı üret:\n1. Bu kişi için kişiselleştirilmiş 30 günlük öğrenme planı\n2. Bu profile özel pratik egzersizler ve görevler\n3. Bu seviyedeki kişilerin en çok kafasını karıştıran konular\n4. Bu kişinin bir sonraki seviyeye geçmesi için yol haritası\n5. Bu profile özel başarı hikayeleri ve ilham kaynakları\n\n${FORMAT}`
  ];
}

async function generateForProfile(tool, profile) {
  const prompts = buildPrompts(tool, profile);
  const allCards = [];

  for (let i = 0; i < prompts.length; i++) {
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
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompts[i] }]
        })
      });
      const data = await resp.json();
      const text = (data.content || []).map(c => c.text || '').join('');
      const clean = text.replace(/```json|```/g, '').trim();
      const start = clean.indexOf('[');
      const end = clean.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        const parsed = JSON.parse(clean.slice(start, end + 1));
        if (Array.isArray(parsed)) allCards.push(...parsed);
      }
      await new Promise(r => setTimeout(r, 800));
    } catch(e) {
      console.error(`Batch ${i} failed for ${tool}/${profile.key}:`, e.message);
    }
  }
  return allCards;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const cronKey = req.headers['x-cron-key'] || req.query.key;
  if (cronKey !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const targetTool = req.query.tool;
  const targetProfile = req.query.profile;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const today = new Date().toISOString().split('T')[0];
  const results = [];

  const toolsToProcess = targetTool ? [targetTool] : TOOLS;
  const profilesToProcess = targetProfile
    ? PROFILES.filter(p => p.key === targetProfile)
    : PROFILES;

  for (const tool of toolsToProcess) {
    for (const profile of profilesToProcess) {
      try {
        console.log(`Generating: ${tool} / ${profile.key}`);
        const cards = await generateForProfile(tool, profile);
        if (cards.length === 0) {
          results.push({ tool, profile: profile.key, status: 'failed', count: 0 });
          continue;
        }

        const sbResp = await fetch(`${SUPABASE_URL}/rest/v1/lesson_cards`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify({
            tool_name: tool,
            profile_key: profile.key,
            batch_date: today,
            cards
          })
        });

        results.push({
          tool,
          profile: profile.key,
          status: sbResp.ok ? 'ok' : 'db-error',
          count: cards.length
        });
      } catch(e) {
        results.push({ tool, profile: profile.key, status: 'error', error: e.message });
      }
    }
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 2);
  const cutoffDate = cutoff.toISOString().split('T')[0];

  await fetch(`${SUPABASE_URL}/rest/v1/lesson_cards?batch_date=lt.${cutoffDate}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  return res.status(200).json({ date: today, total: results.length, results });
}
