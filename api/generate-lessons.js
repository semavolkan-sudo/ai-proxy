export const config = { maxDuration: 60 };

const TOOLS = [
  "ChatGPT","Claude","Gemini","Perplexity","Deepseek","Copilot","Grok",
  "Midjourney","Leonardo AI","Stable Diffusion","Canva AI",
  "ElevenLabs","Runway ML","Make.com","Zapier AI","Notion AI",
  "Lovable","Manus","Meta AI","Assembly AI",
  "Prompt Engineering","AI İş Stratejisi"
];

const PROFILES = [
  { key: "baslangic_kariyer",   level: "Yeni başlayan",   goal: "Kariyerini geliştirmek isteyen profesyonel" },
  { key: "baslangic_is",        level: "Yeni başlayan",   goal: "Kendi işini kurmak isteyen girişimci" },
  { key: "baslangic_freelance", level: "Yeni başlayan",   goal: "Freelance gelir elde etmek isteyen serbest çalışan" },
  { key: "orta_kariyer",        level: "Orta seviye",     goal: "Kariyerinde hızla ilerlemek isteyen profesyonel" },
  { key: "orta_is",             level: "Orta seviye",     goal: "İşini büyütmek isteyen girişimci" },
  { key: "ileri_kariyer",       level: "İleri seviye",    goal: "Sektöründe AI lideri olmak isteyen uzman" },
  { key: "default",             level: "Genel kullanıcı", goal: "AI araçlarını öğrenmek isteyen kişi" }
];

const FORMAT = `Her kart şu yapıda olmalı:\n- 4-5 cümle detaylı açıklama\n- Gerçek ve uygulanabilir senaryo\n- Her adımın yanında somut örnek\n\nSADECE JSON:\n[{"title":"başlık","content":"detaylı açıklama\\n\\n💡 Gerçek Örnek: [isim ve meslek belirt] nasıl kullandı — somut sonuç\\n\\n📊 Adımlar:\\n1️⃣ [Adım adı]: [Bu adımın somut örneği]\\n2️⃣ [Adım adı]: [Bu adımın somut örneği]\\n3️⃣ [Adım adı]: [Bu adımın somut örneği]\\n\\n⚡ Pro İpucu: [Somut ipucu — rakam veya oran içersin]","icon":"emoji"}]`;

function buildPrompts(tool, profile) {
  const ctx = `Öğrenci profili: ${profile.level}, ${profile.goal}`;
  return [
    `Sen dünyaca tanınan bir AI eğitim uzmanısın. ${tool} aracını öğretiyorsun.\n${ctx}\n\nBu profile ÖZEL 5 ders kartı üret:\n1. Bu araç bu kişi için neden önemli\n2. Bu profile özel ilk kurulum ve kullanım\n3. Bu kişinin işinde en kritik özellik\n4. Bu profile özel prompt şablonları\n5. Bu kişinin sık yaptığı hatalar\n\n${FORMAT}`,
