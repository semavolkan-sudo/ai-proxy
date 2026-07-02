// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import logoAsset from "@/assets/ai-cert-academy-logo.png.asset.json";


// ─── SSR-SAFE STORAGE ────────────────────────────────────────────────────────
var isClient = typeof window !== "undefined";

function lsGet(key) {
  if (!isClient) return null;
  try { return localStorage.getItem(key); } catch(e) { return null; }
}

function lsSet(key, value) {
  if (!isClient) return;
  try { localStorage.setItem(key, value); } catch(e) {}
}

function lsRemove(key) {
  if (!isClient) return;
  try { localStorage.removeItem(key); } catch(e) {}
}

// ─── AUTH TOKEN HELPERS ──────────────────────────────────────────────────────
function getAuthToken() { return lsGet("auth_token"); }
function setAuthToken(t) { if (t) lsSet("auth_token", t); }
function clearAuthToken() { lsRemove("auth_token"); }
function authJsonHeaders() {
  var h = { "Content-Type": "application/json" };
  var t = getAuthToken();
  if (t) h["Authorization"] = "Bearer " + t;
  return h;
}
function handleUnauthorized() {
  try {
    clearAuthToken();
    lsRemove("aica-user");
    lsSet("auth_expired_msg", "1");
    if (typeof window !== "undefined") window.location.reload();
  } catch(e) {}
}


// ─── CONFIG ──────────────────────────────────────────────────────────────────
var PROXY_URL = "https://ai-proxy-two-pi.vercel.app/api/proxy";
// Lovable'a yükledikten sonra yukarıdaki URL'yi Supabase'den aldiginla degistir
var USERS_API = "https://ai-proxy-two-pi.vercel.app/api/users";
var ADMIN_EMAIL = "admin@aicert.com";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
var BG = "#070711";
var BG2 = "#0d0d1f";
var GOLD = "#c9a84c";
var GOLD2 = "#f5cc6a";
var PURPLE = "#7c5cfc";
var TEAL = "#00c9a7";
var CARD_BG = "rgba(255,255,255,0.035)";
var CARD_BG2 = "rgba(255,255,255,0.06)";
var CARD_BORDER = "rgba(255,255,255,0.09)";
var CARD_BORDER2 = "rgba(255,255,255,0.16)";
var TEXT = "#e8e8f0";
var TEXT2 = "#9999b8";
var FONT = "'DM Sans','Segoe UI',system-ui,sans-serif";
var FONT_MONO = "'JetBrains Mono','Fira Code',monospace";
var FONT_SERIF = "'Playfair Display','Georgia',serif";
var RADIUS = "16px";
var SHADOW = "0 8px 32px rgba(0,0,0,0.4)";
var SHADOW_GOLD = "0 4px 24px rgba(201,168,76,0.25)";

var PLAN_PERMS = {
  Starter:  { mentor: false, mentorSessions: 0,  bonus: false, team: false, teamLimit: 0,  cert: "Temel",    lockAfter: 14  },
  Pro:      { mentor: true,  mentorSessions: 4,   bonus: true,  team: false, teamLimit: 0,  cert: "Premium",  lockAfter: null },
  Business: { mentor: true,  mentorSessions: 999, bonus: true,  team: true,  teamLimit: 5,  cert: "Kurumsal", lockAfter: null },
};

function getPerms(user) {
  if (!user || !user.plan) return PLAN_PERMS.Starter;
  return PLAN_PERMS[user.plan.name] || PLAN_PERMS.Starter;
}

var XP_LEVELS = [
  { level: 1, name: "AI Acemi",       xp: 0,    color: "#888899" },
  { level: 2, name: "AI Öğrenci",     xp: 100,  color: "#6366f1" },
  { level: 3, name: "AI Pratisyen",   xp: 300,  color: "#3b82f6" },
  { level: 4, name: "AI Uzman",       xp: 600,  color: "#10a37f" },
  { level: 5, name: "AI Üstat",       xp: 1000, color: "#d4a853" },
  { level: 6, name: "AI Sertifikalı", xp: 1500, color: "#ef4444" },
];

function getLvl(xp) {
  var l = XP_LEVELS[0];
  for (var i = 0; i < XP_LEVELS.length; i++) { if (xp >= XP_LEVELS[i].xp) l = XP_LEVELS[i]; }
  return l;
}
function getNextLvl(xp) {
  for (var i = 0; i < XP_LEVELS.length; i++) { if (XP_LEVELS[i].xp > xp) return XP_LEVELS[i]; }
  return XP_LEVELS[XP_LEVELS.length - 1];
}
function xpFor(score) { return 20 + score * 16; }

var PLANS = [
  { name: "Starter",  price: 29,  color: "#6366f1", popular: false,
    features: ["İlk 14 günün müfredatı (Gün 1-14)", "Ders içerikleri", "Günlük quizler", "XP ve Streak sistemi", "Temel sertifika"] },
  { name: "Pro",      price: 79,  color: "#d4a853", popular: true,
    features: ["28 gün tam erişim", "Tüm dersler", "XP ve Streak sistemi", "AI Mentor (4 seans)", "Bonus içerikler", "Premium sertifika"] },
  { name: "Business", price: 199, color: "#10a37f", popular: false,
    features: ["5 kullanıcı lisansı", "Sınırsız AI Mentor", "Ekip yönetim paneli", "Ekip liderboard", "Kurumsal sertifika", "Öncelikli destek"] },
];

var COURSES = [
  { day:1,  tool:"ChatGPT",            icon:"\uD83E\uDD16", color:"#10a37f", desc:"Dünyanın en popüler AI asistanını ustaca kullanın" },
  { day:2,  tool:"Claude",             icon:"\uD83E\uDDE0", color:"#d4a853", desc:"Anthropic'in gelişmiş dil modeliyle çalışın" },
  { day:3,  tool:"Gemini",             icon:"\u2728",         color:"#4285f4", desc:"Google'ın multimodal AI sistemini keşfedin" },
  { day:4,  tool:"Perplexity",         icon:"\uD83D\uDD0D", color:"#6366f1", desc:"AI destekli araştırma motorunu öğrenin" },
  { day:5,  tool:"Deepseek",           icon:"\uD83D\uDE80", color:"#ef4444", desc:"Çin'in güçlü açık kaynak modelini kullanın" },
  { day:6,  tool:"Copilot",            icon:"\uD83D\uDCBB", color:"#0078d4", desc:"Microsoft AI asistanıyla üretkenlik" },
  { day:7,  tool:"Grok",               icon:"\u26A1",         color:"#1d9bf0", desc:"xAI gerçek zamanlı AI modelini keşfedin" },
  { day:8,  tool:"Lovable",            icon:"\uD83D\uDC9C", color:"#8b5cf6", desc:"AI ile uygulama geliştirmeyi öğrenin" },
  { day:9,  tool:"Manus",              icon:"\uD83E\uDD1D", color:"#f59e0b", desc:"Otonom AI ajan sistemini kullanın" },
  { day:10, tool:"NanoBanana",         icon:"\uD83C\uDF4C", color:"#fbbf24", desc:"Yeni nesil AI araçlarını keşfedin" },
  { day:11, tool:"Leonardo AI",        icon:"\uD83C\uDFA8", color:"#ec4899", desc:"AI görsel üretiminde uzmanlaşın" },
  { day:12, tool:"Meta AI",            icon:"\uD83C\uDF10", color:"#0668e1", desc:"Meta AI ekosistemini ogreyin" },
  { day:13, tool:"Assembly AI",        icon:"\uD83C\uDF99", color:"#14b8a6", desc:"Ses transkripsiyon AI kullanın" },
  { day:14, tool:"Canva AI",           icon:"\uD83D\uDD8C", color:"#7c3aed", desc:"AI destekli tasarım araçlarını öğrenin" },
  { day:15, tool:"Veo 3",              icon:"\uD83C\uDFAC", color:"#dc2626", desc:"Google video üretim AI keşfedin" },
  { day:16, tool:"Sora 2",             icon:"\uD83C\uDFA5", color:"#059669", desc:"OpenAI video AI modelini kullanın" },
  { day:17, tool:"Kimi",               icon:"\uD83C\uDF19", color:"#7c3aed", desc:"Moonshot AI guclu modelini ogreyin" },
  { day:18, tool:"Kling",              icon:"\uD83C\uDFAD", color:"#b45309", desc:"Kuaishou video AI keşfedin" },
  { day:19, tool:"Midjourney",         icon:"\uD83C\uDF0C", color:"#4f46e5", desc:"En popüler gorsel AI aracinda uzmanlasin" },
  { day:20, tool:"Runway ML",          icon:"\u2702",         color:"#16a34a", desc:"AI video duzenleme platformu ogreyin" },
  { day:21, tool:"ElevenLabs",         icon:"\uD83D\uDD0A", color:"#ea580c", desc:"AI ses klonlama teknolojisini kullanın" },
  { day:22, tool:"Pika Labs",          icon:"\u26A1",         color:"#0891b2", desc:"Hizli video olusturma AI keşfedin" },
  { day:23, tool:"Stable Diffusion",   icon:"\uD83C\uDF0A", color:"#7c3aed", desc:"Acik kaynak gorsel AI uzmanlasin" },
  { day:24, tool:"Make.com",           icon:"\uD83D\uDD17", color:"#9333ea", desc:"AI otomasyon akışları kurun" },
  { day:25, tool:"Zapier AI",          icon:"\u26A1",         color:"#ff6b35", desc:"AI destekli is akislarini otomatize edin" },
  { day:26, tool:"Notion AI",          icon:"\uD83D\uDCDD", color:"#374151", desc:"AI destekli verimlilik sistemleri kurun" },
  { day:27, tool:"Prompt Engineering", icon:"\uD83C\uDFAF", color:"#b91c1c", desc:"Etkili prompt yazma tekniklerini ogreyin" },
  { day:28, tool:"AI Is Stratejisi",   icon:"\uD83D\uDCBC", color:"#065f46", desc:"AI ile gelir modelleri oluşturun" },
];

var MOCK_LB = [
  { name:"Ayşe K.",   xp:1240, streak:18 },
  { name:"Mehmet T.", xp:1180, streak:22 },
  { name:"Zeynep A.", xp:980,  streak:12 },
  { name:"Can B.",    xp:860,  streak:9  },
  { name:"Fatma Y.",  xp:720,  streak:7  },
];

var DEFAULT_QUIZ = [
  { q:"Bu AI aracının temel kullanım amacı nedir?",          opts:["Yalnızca görsel üretim","Yalnızca kod yazma","Genel amaçlı üretkenlik","Yalnızca veri analizi"],                          ans:2 },
  { q:"Prompt engineering'de en önemli unsur nedir?",        opts:["Kısa yazmak","Net ve bağlamlı talimatlar","İngilizce kullanmak","Büyük harf kullanmak"],                                  ans:1 },
  { q:"AI araçlarının iş dünyasındaki en büyük avantajı?",    opts:["Maliyeti sıfırlamak","Çalışanları işten çıkarmak","Tekrarlayan görevleri otomatize etmek","İnternetsiz çalışmak"],         ans:2 },
  { q:"AI çıktılarını kullanırken en kritik adım?",           opts:["Hepsini direkt kullanmak","Doğrulamak ve düzenlemek","İngilizce çevirmek","Kaydetmek"],                                    ans:1 },
  { q:"En verimli çalışma yöntemi hangisidir?",               opts:["Tek seferlik uzun soru","Iteratif prompt zinciri","Şablonları kopyalamak","Başkasının promptlarini kullanmak"],            ans:1 },
];

// ─── PAYMENT LINKS ───────────────────────────────────────────────────────────
var PAYMENT_LINKS = {
  Starter:  "https://ai-cert-academy.lemonsqueezy.com/checkout/buy/f9a71b5d-1f89-481e-9fc3-8d90cc2783b6",
  Pro:      "https://ai-cert-academy.lemonsqueezy.com/checkout/buy/1e6783f3-22a7-449c-8946-6c43d5c5e4b7",
  Business: "https://ai-cert-academy.lemonsqueezy.com/checkout/buy/e1487643-af1b-414f-b79b-75d38cc5ff9b",
};

// ─── TEST USERS (geliştirme amaçlı ödeme atlama) ─────────────────────────────
var TEST_USERS = {
  "test@aicert.com":     { name:"Test",         plan:"Starter",  pass:"", paid:true, profileKey:"baslangic_kariyer" },
  "testpro@aicert.com":  { name:"TestPro",      plan:"Pro",      pass:"", paid:true, profileKey:"orta_kariyer"      },
  "testbiz@aicert.com":  { name:"TestBusiness", plan:"Business", pass:"", paid:true, profileKey:"ileri_kariyer"     },
};

var TERMS_TEXT = `
KULLANIM KOŞULLARI
Son güncelleme: Haziran 2026

1. TARAFLAR
Bu Kullanım Koşulları, AI Certification Academy ("Platform") ile platformu kullanan kişi ("Kullanıcı") arasındaki ilişkiyi düzenler.

2. HİZMET KAPSAMI
Platform; yapay zeka araçlarına yönelik online eğitim içerikleri, interaktif dersler, sınavlar ve sertifika programları sunmaktadır. İçerikler yalnızca abonelik planı satın alınmış kullanıcılara açıktır.

3. ÜYELİK VE GÜVENLİK
- Kayıt sırasında doğru bilgi vermek zorunludur.
- Hesap bilgilerinizin güvenliğinden siz sorumlusunuz.
- Hesabınızı başkasıyla paylaşmak yasaktır.
- Şüpheli aktivite tespit edilirse hesap askıya alınabilir.

4. ÖDEME VE İADE
- Abonelik ücretleri Lemon Squeezy altyapısı üzerinden tahsil edilir.
- Aylık abonelikler, iptal edilmediği sürece otomatik yenilenir.
- Satın alma tarihinden itibaren 7 gün içinde iade talep edilebilir.
- Sertifika alındıktan sonra iade yapılmaz.

5. İÇERİK KULLANIMI
- Platform içerikleri yalnızca kişisel eğitim amaçlıdır.
- İçeriklerin kopyalanması, dağıtılması veya satılması yasaktır.
- AI Mentor ile yapılan konuşmalar eğitim amaçlıdır; profesyonel tavsiye niteliği taşımaz.

6. HİZMET DEĞİŞİKLİKLERİ
Platform, önceden bildirim yapmaksızın içerik ve özellikleri güncelleyebilir. Abonelik fiyatları değiştiğinde kullanıcılara e-posta ile bildirim yapılır.

7. SORUMLULUK SINIRI
Platform, kullanıcının öğrendiklerini uygulayarak elde ettiği sonuçlardan sorumlu tutulamaz. Hizmet kesintilerinden doğan zararlar için tazminat ödenmez.

8. UYGULANACAK HUKUK
Bu sözleşme Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda İstanbul mahkemeleri yetkilidir.

İletişim: info@cert-academy.ai
`;

var PRIVACY_TEXT = `
GİZLİLİK POLİTİKASI
Son güncelleme: Haziran 2026

1. VERİ SORUMLUSU
AI Certification Academy, 6698 sayılı KVKK kapsamında veri sorumlusudur.

2. TOPLANAN VERİLER
- Kimlik: Ad, soyad, e-posta adresi
- Kullanım: Ders ilerlemesi, sınav sonuçları, XP puanı, giriş zamanları
- Teknik: IP adresi, tarayıcı türü, cihaz bilgisi
- Ödeme: Ödeme işlemleri Lemon Squeezy tarafından yönetilir; kart bilgisi platformda saklanmaz.

3. VERİLERİN KULLANIMI
Toplanan veriler şu amaçlarla kullanılır:
- Eğitim içeriklerinin kişiselleştirilmesi
- Abonelik ve fatura yönetimi
- Platform güvenliğinin sağlanması
- Kullanıcı desteği
- Yasal yükümlülüklerin yerine getirilmesi

4. VERİ SAKLAMA
Veriler, üyelik süresince ve sonrasında 3 yıl boyunca saklanır. Hesap silme talebinde veriler 30 gün içinde imha edilir.

5. VERİLERİN PAYLAŞIMI
Verileriniz üçüncü taraflarla satılmaz. Yalnızca şu durumlarda paylaşılır:
- Lemon Squeezy (ödeme altyapısı)
- Supabase (veri tabanı altyapısı)
- Yasal zorunluluk halleri

6. KVKK HAKLARI
KVKK madde 11 kapsamında şu haklarınız bulunmaktadır:
- Verilerinizin işlenip işlenmediğini öğrenme
- İşlenen verilere erişim
- Hatalı verilerin düzeltilmesini isteme
- Verilerin silinmesini talep etme
- İşlemeye itiraz etme

Talepleriniz için: info@cert-academy.ai

7. ÇEREZLER
Platform, oturum yönetimi için localStorage kullanır. Üçüncü taraf reklam çerezi kullanılmaz.

8. DEĞİŞİKLİKLER
Politika değişikliklerinde kullanıcılara e-posta ile bildirim yapılır.

İletişim: info@cert-academy.ai
`;

function buildPaymentUrl(planName, email) {
  var base = PAYMENT_LINKS[planName];
  if (!base) return "";
  if (!email) return base;
  return base + "?checkout[email]=" + encodeURIComponent(email);
}
function saveUser(user) {
  try {
    lsSet("aica-user", JSON.stringify(user));
    if (user.email) addToRegistry(user.email, user);
    try {
      fetch(USERS_API, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({ action: getAuthToken() ? "update" : "register", user: user })
      }).catch(function() {});
    } catch(e) {}
  } catch(e) {}
}
function deleteUser() {
  try { lsRemove("aica-user"); } catch(e) {}
}

// ─── USER REGISTRY (email uniqueness + login) ────────────────────────────────
function getRegistry() {
  try { var r = lsGet("aica-registry"); return r ? JSON.parse(r) : {}; } catch(e) { return {}; }
}
function emailExists(email) {
  return !!getRegistry()[email.toLowerCase()];
}
function addToRegistry(email, userData) {
  try {
    var reg = getRegistry();
    reg[email.toLowerCase()] = JSON.stringify(userData);
    lsSet("aica-registry", JSON.stringify(reg));
  } catch(e) {}
}
function getUserByEmail(email) {
  try {
    var reg = getRegistry();
    var raw = reg[email.toLowerCase()];
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

// ─── TEAM HELPERS (storage-based) ────────────────────────────────────────────
function getTeamKey(ownerId) { return "team-" + ownerId; }

function loadTeam(ownerId) {
  return new Promise(function(resolve) {
    try {
      var val = lsGet(getTeamKey(ownerId));
      resolve(val ? JSON.parse(val) : null);
    } catch(e) { resolve(null); }
  });
}

function saveTeam(ownerId, team) {
  try { lsSet(getTeamKey(ownerId), JSON.stringify(team)); } catch(e) {}
}

// ─── LEGAL MODAL ─────────────────────────────────────────────────────────────
function LegalModal(props) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.80)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", zIndex:800, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:FONT }}>
      <div style={{ background:"linear-gradient(145deg, rgba(13,13,31,0.95), rgba(7,7,17,0.95))", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", border:"1px solid "+CARD_BORDER2, borderRadius:24, padding:0, maxWidth:600, width:"100%", maxHeight:"80vh", display:"flex", flexDirection:"column", boxShadow:"0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 28px", borderBottom:"1px solid "+CARD_BORDER }}>
          <h2 style={{ color:"#fff", fontWeight:700, fontSize:18, margin:0 }}>{props.title}</h2>
          <button onClick={props.onClose} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid "+CARD_BORDER, color:TEXT2, cursor:"pointer", fontSize:18, width:32, height:32, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ padding:"20px 28px", overflowY:"auto", flex:1, color:TEXT, fontSize:13, lineHeight:1.8, whiteSpace:"pre-wrap" }}>
          {props.text}
        </div>
        <div style={{ padding:"16px 28px", borderTop:"1px solid "+CARD_BORDER, display:"flex", justifyContent:"flex-end" }}>
          <button onClick={props.onClose} style={{ background:"linear-gradient(135deg,#c9a84c,#f5cc6a)", color:"#08080f", border:"none", borderRadius:10, padding:"10px 22px", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:FONT }}>Anladım, Kapat</button>
        </div>
      </div>
    </div>
  );
}


function createTeam(owner) {
  var team = {
    id: "team-" + Date.now(),
    ownerId: owner.email,
    ownerName: owner.name,
    limit: 5,
    members: [{ email: owner.email, name: owner.name, role: "admin", status: "active", joinedAt: Date.now() }],
    invites: [],
    createdAt: Date.now(),
  };
  saveTeam(owner.email, team);
  return team;
}

function generateInviteCode(teamId, email) {
  return btoa(teamId + "|" + email + "|" + Date.now()).replace(/=/g, "");
}

function parseInviteCode(code) {
  try {
    var decoded = atob(code);
    var parts = decoded.split("|");
    return { teamId: parts[0], email: parts[1], ts: parseInt(parts[2]) };
  } catch(e) { return null; }
}

// ─── CERTIFICATE ─────────────────────────────────────────────────────────────
function generateCertificate(userName, tier, totalXP) {
  var cv = document.createElement("canvas");
  cv.width = 1400; cv.height = 900;
  var ctx = cv.getContext("2d");
  var g = ctx.createLinearGradient(0, 0, 1400, 900);
  g.addColorStop(0, "#0a0a1a"); g.addColorStop(0.5, "#0f0f25"); g.addColorStop(1, "#0a0a1a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1400, 900);
  ctx.strokeStyle = "#d4a853"; ctx.lineWidth = 10; ctx.strokeRect(30, 30, 1340, 840);
  ctx.lineWidth = 2; ctx.strokeStyle = "rgba(212,168,83,0.25)"; ctx.strokeRect(50, 50, 1300, 800);
  for (var i = 0; i < 6; i++) {
    ctx.beginPath(); ctx.arc(70 + i * 60, 70, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(212,168,83,0.3)"; ctx.fill();
  }
  ctx.fillStyle = "#d4a853"; ctx.font = "bold 88px Georgia"; ctx.textAlign = "center"; ctx.fillText("AI", 700, 200);
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 52px Georgia"; ctx.fillText("Certification Academy", 700, 270);
  ctx.fillStyle = "rgba(212,168,83,0.35)"; ctx.fillRect(250, 295, 900, 3);
  ctx.fillStyle = "#9999bb"; ctx.font = "italic 26px Georgia"; ctx.fillText("Bu belge, aşağıdaki kişinin", 700, 345);
  ctx.fillStyle = "#d4a853"; ctx.font = "bold 60px Georgia"; ctx.fillText(userName || "Katılımcı", 700, 430);
  ctx.fillStyle = "rgba(212,168,83,0.35)"; ctx.fillRect(350, 455, 700, 2);
  ctx.fillStyle = "#ffffff"; ctx.font = "24px Georgia";
  ctx.fillText("28 Günlük AI Sertifika Programını başarıyla tamamladığını", 700, 505);
  ctx.fillText("ve tüm sınav ve değerlendirmelerden geçtiğini onaylar.", 700, 540);
  var tierColors = { Temel:"#6366f1", Premium:"#d4a853", Kurumsal:"#10a37f" };
  ctx.fillStyle = tierColors[tier] || "#d4a853"; ctx.font = "bold 22px Georgia";
  ctx.fillText(tier + " Sertifika | Toplam XP: " + totalXP, 700, 590);
  ctx.fillStyle = "#9999bb"; ctx.font = "18px Georgia";
  ctx.fillText("Tarih: " + new Date().toLocaleDateString("tr-TR", { year:"numeric", month:"long", day:"numeric" }), 700, 635);
  ctx.fillStyle = "#d4a853"; ctx.font = "bold 22px Georgia"; ctx.fillText("AI Certification Academy", 700, 700);
  ctx.font = "16px Georgia"; ctx.fillStyle = "#666688";
  ctx.fillText("Sertifika No: AIC-" + Math.random().toString(36).substr(2,9).toUpperCase(), 700, 730);
  ctx.globalAlpha = 0.04; ctx.fillStyle = "#d4a853"; ctx.font = "bold 220px Georgia"; ctx.fillText("AI", 700, 530); ctx.globalAlpha = 1;
  return cv.toDataURL("image/png");
}

// ─── XP TOAST ────────────────────────────────────────────────────────────────
function XPToast(props) {
  useEffect(function() { var t = setTimeout(props.onDone, 2800); return function() { clearTimeout(t); }; }, []);
  return (
    <div style={{ position:"fixed", top:20, right:20, zIndex:9999, background:"linear-gradient(135deg,#c9a84c,#f5cc6a)", color:"#08080f", borderRadius:14, padding:"14px 24px", fontWeight:800, fontSize:18, fontFamily:FONT_MONO, boxShadow:"0 8px 32px rgba(201,168,76,0.5)", letterSpacing:"0.5px", border:"1px solid rgba(255,255,255,0.2)" }}>
      {"+ " + props.xp + " XP"}
    </div>
  );
}

// ─── UPGRADE MODAL ───────────────────────────────────────────────────────────
function UpgradeModal(props) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.80)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", zIndex:800, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:FONT }}>
      <div style={{ background:"linear-gradient(145deg, rgba(13,13,31,0.95), rgba(7,7,17,0.95))", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", border:"1px solid rgba(201,168,76,0.4)", borderRadius:24, padding:44, maxWidth:440, textAlign:"center", boxShadow:"0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🔒</div>
        <h2 style={{ background:"linear-gradient(135deg,#f5cc6a,#7c5cfc)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", fontWeight:800, fontSize:22, marginBottom:12, letterSpacing:"-0.01em" }}>Pro Özellik</h2>
        <p style={{ color:TEXT, marginBottom:28, lineHeight:1.7, fontSize:14 }}><span style={{ color:GOLD2, fontWeight:600 }}>{props.feature}</span> — Pro veya Business plana geçiş yaparak bu özelliği kullanabilirsin.</p>
        <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
          <button onClick={props.onClose} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid "+CARD_BORDER2, borderRadius:12, padding:"12px 24px", color:TEXT2, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:FONT, transition:"all 0.2s ease" }}>Vazgeç</button>
          <button onClick={props.onClose}
            onMouseEnter={function(e){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(201,168,76,0.45)"; }}
            onMouseLeave={function(e){ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=SHADOW_GOLD; }}
            style={{ background:"linear-gradient(135deg,#c9a84c,#f5cc6a)", color:"#08080f", border:"none", borderRadius:12, padding:"12px 26px", fontWeight:700, cursor:"pointer", fontSize:13, boxShadow:SHADOW_GOLD, transition:"all 0.2s ease", fontFamily:FONT, letterSpacing:"0.3px" }}>Planı Yükselt</button>
        </div>
      </div>
    </div>
  );
}

// ─── ONBOARDING ──────────────────────────────────────────────────────────────
function Onboarding(props) {
  var [step, setStep] = useState(0);
  var [ans, setAns] = useState({});
  var qs = [
    { q:"AI araçları hakkinda deneyim seviyeniz?",       opts:["Hiç kullanmadim","Birkac kez denedim","Duzenli kullaniyorum","Profesyonel duzey"] },
    { q:"Öncelikli hedefiniz nedir?",                    opts:["Kariyerimi geliştirmek","Kendi işimi kurmak","Freelance gelir","Genel merak"] },
    { q:"Günde ne kadar sure ayirabilirsiniz?",          opts:["10-15 dakika","30 dakika","1 saat","1 saatten fazla"] },
    { q:"Hangi AI kategorisi en çok ilginizi çekiyor?",  opts:["Metin ve Yazarlık","Görsel ve Video","Otomasyon","Hepsi eşit"] },
  ];
  function pick(i) {
    var na = Object.assign({}, ans); na[step] = i; setAns(na);
    if (step < qs.length - 1) {
      setStep(step + 1);
    } else {
      var level = na[0] <= 1 ? "baslangic" : na[0] <= 2 ? "orta" : "ileri";
      var goalMap = ["kariyer", "is", "freelance", "genel"];
      var goal = goalMap[na[1]] || "kariyer";
      var profileKey = level + "_" + goal;
      props.onDone({
        level: level,
        goal: qs[1].opts[na[1]],
        time: qs[2].opts[na[2]],
        focus: qs[3].opts[na[3]],
        profileKey: profileKey
      });
    }
  }
  return (
    <div style={{ minHeight:"100vh", background:BG, color:"#fff", fontFamily:FONT, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:500 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:36, fontWeight:800, color:GOLD }}>AI</div>
          <div style={{ color:"#888899", fontSize:13, marginTop:4 }}>Kişiselleştirilmiş öğrenme yolu oluşturuluyor</div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:100, height:4, marginBottom:28, overflow:"hidden" }}>
          <div style={{ width:(((step+1)/qs.length)*100)+"%", height:"100%", background:GOLD, borderRadius:100 }} />
        </div>
        <div style={{ background:CARD_BG, border:"1px solid "+CARD_BORDER, borderRadius:16, padding:28 }}>
          <div style={{ fontSize:11, color:GOLD, fontFamily:FONT_MONO, marginBottom:10 }}>{"SORU "+(step+1)+"/"+qs.length}</div>
          <h2 style={{ color:"#fff", fontWeight:700, fontSize:18, marginBottom:24, lineHeight:1.4 }}>{qs[step].q}</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {qs[step].opts.map(function(opt, i) {
              return (
                <button key={i} onClick={function() { pick(i); }}
                  style={{ background:CARD_BG, border:"1px solid "+CARD_BORDER, borderRadius:11, padding:"13px 18px", color:"#ccccdd", cursor:"pointer", fontSize:14, textAlign:"left" }}>
                  {["A","B","C","D"][i] + ") " + opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MENTOR CHAT ─────────────────────────────────────────────────────────────
function MentorChat(props) {
  var user = props.user;
  var p = getPerms(user);
  var lvl = getLvl(user.xp || 0);
  var [msgs, setMsgs] = useState([{ role:"ai", text:"Merhaba " + user.name + "! Ben AI Mentor'ünüm. Seviye " + lvl.level + " - " + lvl.name + " olarak kayıtlısın. " + (p.mentor ? (p.mentorSessions === 999 ? "Sınırsız seans hakkın var." : p.mentorSessions + " seans hakkın kaldı.") : "") + " Ne öğrenelim?" }]);
  var [inp, setInp] = useState("");
  var [loading, setLoading] = useState(false);
  var [left, setLeft] = useState(p.mentorSessions);
  var botRef = useRef(null);
  useEffect(function() { if (botRef.current) botRef.current.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  function send() {
    if (!inp.trim() || loading) return;
    if (p.mentorSessions !== 999 && left <= 0) return;
    var msg = inp.trim(); setInp("");
    var newMsgs = msgs.concat([{ role:"user", text:msg }]);
    setMsgs(newMsgs); setLoading(true);
    if (p.mentorSessions !== 999) setLeft(left - 1);
    var history = msgs.map(function(m) { return { role: m.role === "ai" ? "assistant" : "user", content: m.text }; });
    history.push({ role:"user", content:msg });
    fetch(PROXY_URL, {
      method:"POST", headers: authJsonHeaders(),
      body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:800,
        system:"Sen bir AI egitim mentorusun. Öğrenci: "+user.name+". Plan: "+(user.plan?user.plan.name:"")+". Seviye: "+lvl.name+" ("+( user.xp||0)+" XP). Türkçe, samimi, motive edici, kısa ve pratik yanitlar ver.",
        messages:history })
    }).then(function(r) {
      if (r.status === 401) { handleUnauthorized(); throw new Error("unauthorized"); }
      return r.json();
    }).then(function(d) {
      var text = ""; if (d.content) for (var i = 0; i < d.content.length; i++) text += d.content[i].text || "";
      setMsgs(newMsgs.concat([{ role:"ai", text: text || "Hata olustu, tekrar dene." }]));
      setLoading(false);
    }).catch(function() {
      setMsgs(newMsgs.concat([{ role:"ai", text:"Baglanti hatası." }]));
      setLoading(false);
    });
  }

  var suggested = ["Hangi araçla başlamalıyım?","Prompt engineering ipuçları","AI ile nasıl para kazanırım?","Öğrenme planımı optimize et"];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", zIndex:700, display:"flex", alignItems:"center", justifyContent:"center", padding:12, fontFamily:FONT }}>
      <div style={{ width:"100%", maxWidth:680, height:"88vh", background:"linear-gradient(145deg, rgba(13,13,31,0.98), rgba(7,7,17,0.98))", border:"1px solid "+CARD_BORDER2, borderRadius:24, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 16px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid "+CARD_BORDER, display:"flex", alignItems:"center", gap:12, background:"rgba(201,168,76,0.05)", backdropFilter:"blur(12px)" }}>
          <div style={{ width:42, height:42, borderRadius:"50%", background:"linear-gradient(135deg,#c9a84c,#f5cc6a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:"#08080f", boxShadow:"0 4px 16px rgba(201,168,76,0.4)" }}>🧠</div>
          <div style={{ flex:1 }}><div style={{ fontWeight:700, color:TEXT, fontSize:15 }}>AI Mentor</div><div style={{ fontSize:11, color:TEAL, fontFamily:FONT_MONO, marginTop:2 }}>● Çevrimiçi</div></div>
          <div style={{ background:"rgba(201,168,76,0.12)", border:"1px solid rgba(201,168,76,0.35)", borderRadius:10, padding:"5px 12px", fontSize:11, color:GOLD2, fontFamily:FONT_MONO, fontWeight:700 }}>
            {p.mentorSessions === 999 ? "Sınırsız" : left + " seans"}
          </div>
          <button onClick={props.onClose} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid "+CARD_BORDER, color:TEXT2, cursor:"pointer", fontSize:18, width:32, height:32, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s ease" }}>×</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:16, display:"flex", flexDirection:"column", gap:12 }}>
          {msgs.map(function(m, i) {
            return (
              <div key={i} style={{ display:"flex", gap:8, justifyContent: m.role === "ai" ? "flex-start" : "flex-end" }}>
                {m.role === "ai" && <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#c9a84c,#f5cc6a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0, boxShadow:"0 2px 8px rgba(201,168,76,0.3)" }}>🧠</div>}
                <div style={{ maxWidth:"78%", background: m.role === "ai" ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(124,92,252,0.10))", border:"1px solid "+(m.role==="ai"?CARD_BORDER:"rgba(201,168,76,0.35)"), borderRadius: m.role==="ai" ? "16px 16px 16px 4px" : "16px 16px 4px 16px", padding:"12px 16px", boxShadow:"0 2px 8px rgba(0,0,0,0.2)" }}>
                  <p style={{ color: m.role==="ai" ? TEXT : GOLD2, fontSize:14, lineHeight:1.7, margin:0, whiteSpace:"pre-wrap", fontFamily:FONT }}>{m.text}</p>
                </div>
                {m.role === "user" && <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#7c5cfc,#a78bfa)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#fff", fontSize:13, flexShrink:0 }}>{user.name[0]}</div>}
              </div>
            );
          })}
          {loading && (
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#c9a84c,#f5cc6a)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🧠</div>
              <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid "+CARD_BORDER, borderRadius:"16px 16px 16px 4px", padding:"14px 18px", display:"flex", gap:6, alignItems:"center" }}>
                <div className="shimmer" style={{ width:8, height:8, borderRadius:"50%", background:GOLD }} />
                <div className="shimmer" style={{ width:8, height:8, borderRadius:"50%", background:GOLD, animationDelay:"0.2s" }} />
                <div className="shimmer" style={{ width:8, height:8, borderRadius:"50%", background:GOLD, animationDelay:"0.4s" }} />
              </div>
            </div>
          )}
          <div ref={botRef} />
        </div>
        {msgs.length <= 1 && (
          <div style={{ padding:"0 16px 12px", display:"flex", flexWrap:"wrap", gap:8 }}>
            {suggested.map(function(q) {
              return <button key={q} onClick={function() { setInp(q); }} style={{ background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.25)", borderRadius:20, padding:"6px 14px", fontSize:12, color:GOLD2, cursor:"pointer", fontFamily:FONT, transition:"all 0.2s ease" }}>{q}</button>;
            })}
          </div>
        )}
        <div style={{ padding:"12px 16px", borderTop:"1px solid "+CARD_BORDER, display:"flex", gap:10, background:"rgba(7,7,17,0.6)" }}>
          {p.mentorSessions !== 999 && left <= 0 ? (
            <div style={{ flex:1, textAlign:"center", color:TEXT2, fontSize:13, padding:"12px 0", fontFamily:FONT_MONO }}>Seans hakkın doldu — Pro'ya geç</div>
          ) : (
            <>
              <input value={inp} onChange={function(e) { setInp(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") send(); }}
                placeholder="Sorunuzu yazin..."
                onFocus={function(e){ e.currentTarget.style.borderColor=GOLD; }}
                onBlur={function(e){ e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"; }}
                style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"12px 16px", color:"#fff", fontSize:14, outline:"none", fontFamily:FONT, transition:"border-color 0.2s ease" }} />
              <button onClick={send} disabled={loading || !inp.trim()}
                style={{ background: loading || !inp.trim() ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#c9a84c,#f5cc6a)", color: loading || !inp.trim() ? TEXT2 : "#08080f", border: loading || !inp.trim() ? "1px solid "+CARD_BORDER : "none", borderRadius:12, padding:"10px 22px", fontWeight:700, cursor: loading||!inp.trim() ? "not-allowed" : "pointer", fontSize:18, boxShadow: loading || !inp.trim() ? "none" : SHADOW_GOLD, transition:"all 0.2s ease" }}>
                →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LANDING ─────────────────────────────────────────────────────────────────
function Landing(props) {
  var reviews = [
    { name:"Ayşe K.", role:"Pazarlama Müdürü", text:"28 günde tüm AI araçları öğrendim. Ekibimden çok daha hızlıyım.", r:5 },
    { name:"Mehmet T.", role:"Freelancer", text:"AI Mentor özelliği inanılmaz. Sorularımı anında yanıtlıyor.", r:5 },
    { name:"Zeynep A.", role:"Girişimci", text:"Sertifikamı LinkedIn'e ekledim, 3 yeni müşteri geldi!", r:5 },
  ];
  return (
    <div style={{ minHeight:"100vh", background:BG, color:TEXT, fontFamily:FONT, backgroundImage:"radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize:"32px 32px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 24px" }}>
        <img src={logoAsset.url} alt="AI Certification Academy" style={{ width:48, height:48, flexShrink:0, borderRadius:"50%" }} />
        <div style={{ fontSize:18, fontWeight:700, color:"#fff", whiteSpace:"nowrap" }}><span style={{ background:"linear-gradient(135deg,#f5cc6a,#7c5cfc)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>AI</span> Certification Academy</div>
      </div>
      <div style={{ position:"relative", textAlign:"center", padding:"72px 20px 80px", background:"radial-gradient(ellipse at 50% 0%,rgba(124,92,252,0.18) 0%,rgba(201,168,76,0.10) 30%,transparent 70%)" }}>
        <div style={{ display:"inline-block", background:"rgba(201,168,76,0.10)", border:"1px solid rgba(201,168,76,0.4)", borderRadius:100, padding:"7px 18px", fontSize:12, color:GOLD2, marginBottom:28, fontFamily:FONT_MONO }}>{"28 araç · 28 gün · Günde 15 dakika"}</div>
        <div style={{ fontSize:80, fontWeight:800, lineHeight:1, background:"linear-gradient(135deg,#f5cc6a,#7c5cfc)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>AI</div>
        <div style={{ fontSize:36, fontWeight:700, marginBottom:20, color:TEXT }}>Certification Academy</div>
        <p style={{ fontSize:16, color:TEXT2, maxWidth:460, margin:"0 auto 40px", lineHeight:1.65 }}>28 araç - 28 gün - Günde 15 dakika<br/><span style={{ color:GOLD2 }}>AI sertifikanı kazan, kariyerini dönüştür.</span></p>
        <div style={{ display:"flex", gap:40, justifyContent:"center", marginBottom:44, flexWrap:"wrap" }}>
          {[["28","Arac"],["28","Gun"],["6","Seviye"],["28","Sınav"]].map(function(item) {
            return (
              <div key={item[1]} style={{ textAlign:"center" }}>
                <div style={{ fontSize:38, fontWeight:800, color:GOLD2, fontFamily:FONT_MONO, letterSpacing:"-0.02em" }}>{item[0]}</div>
                <div style={{ fontSize:12, color:TEXT2, marginTop:4, textTransform:"uppercase", letterSpacing:"1px" }}>{item[1]}</div>
              </div>
            );
          })}
        </div>
        <button onClick={function() { props.onGo && props.onGo("auth"); }}
          onMouseEnter={function(e){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(201,168,76,0.4)"; }}
          onMouseLeave={function(e){ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=SHADOW_GOLD; }}
          style={{ background:"linear-gradient(135deg,#c9a84c,#f5cc6a)", color:"#08080f", border:"none", borderRadius:14, padding:"16px 44px", fontSize:17, fontWeight:700, cursor:"pointer", boxShadow:SHADOW_GOLD, transition:"all 0.2s ease", fontFamily:FONT }}>
          Hemen Başla
        </button>
      </div>
      <div style={{ maxWidth:960, margin:"0 auto", padding:"0 20px 72px" }}>
        <h2 style={{ textAlign:"center", fontSize:28, fontWeight:800, marginBottom:36, color:TEXT, letterSpacing:"-0.02em" }}>Öğrencilerimiz Ne Diyor?</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:18 }}>
          {reviews.map(function(r, i) {
            return (
              <div key={i}
                onMouseEnter={function(e){ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.borderColor=CARD_BORDER2; }}
                onMouseLeave={function(e){ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.borderColor=CARD_BORDER; }}
                style={{ background:"linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border:"1px solid "+CARD_BORDER, borderRadius:20, padding:26, transition:"all 0.2s ease", boxShadow:"0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)", fontFamily:FONT }}>
                <div style={{ color:GOLD2, fontSize:15, marginBottom:12, letterSpacing:"2px" }}>{"★★★★★"}</div>
                <p style={{ color:TEXT, fontSize:14, lineHeight:1.7, marginBottom:18, fontStyle:"italic" }}>{"\"" + r.text + "\""}</p>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg, rgba(201,168,76,0.25), rgba(124,92,252,0.20))", border:"1px solid rgba(201,168,76,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:GOLD2 }}>{r.name[0]}</div>
                  <div><div style={{ fontWeight:600, fontSize:13, color:TEXT }}>{r.name}</div><div style={{ color:TEXT2, fontSize:11, fontFamily:FONT_MONO, marginTop:2 }}>{r.role}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ maxWidth:1060, margin:"0 auto", padding:"0 20px 72px" }}>
        <h2 style={{ textAlign:"center", fontSize:32, fontWeight:800, marginBottom:10, color:TEXT, letterSpacing:"-0.02em" }}>28 Günlük Program</h2>
        <p style={{ textAlign:"center", color:TEXT2, marginBottom:40, fontSize:14, fontFamily:FONT_MONO }}>Her gün yeni bir AI aracı, her gün yeni bir süper güç</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:14 }}>
          {COURSES.map(function(c) {
            return (
              <div key={c.day}
                onMouseEnter={function(e){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.borderColor=CARD_BORDER2; }}
                onMouseLeave={function(e){ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.borderColor=CARD_BORDER; }}
                style={{ background:"linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border:"1px solid "+CARD_BORDER, borderRadius:14, padding:"16px 16px", display:"flex", gap:12, alignItems:"flex-start", transition:"all 0.2s ease", boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)", fontFamily:FONT }}>
                <div style={{ fontSize:26, flexShrink:0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize:10, color:GOLD, fontFamily:FONT_MONO, marginBottom:3, fontWeight:700, letterSpacing:"1px" }}>{"GÜN " + c.day.toString().padStart(2,"0")}</div>
                  <div style={{ fontWeight:700, fontSize:13, marginBottom:3, color:TEXT }}>{c.tool}</div>
                  {c.day > 14 && <div style={{ fontSize:10, color:PURPLE, fontFamily:FONT_MONO, fontWeight:600 }}>Pro+</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div id="pricing" style={{ background:"linear-gradient(180deg, rgba(124,92,252,0.04), rgba(201,168,76,0.04))", borderTop:"1px solid "+CARD_BORDER, padding:"72px 20px" }}>
        <div style={{ maxWidth:1000, margin:"0 auto" }}>
          <h2 style={{ textAlign:"center", fontSize:36, fontWeight:800, marginBottom:12, background:"linear-gradient(135deg,#f5cc6a,#7c5cfc)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", letterSpacing:"-0.02em" }}>Planını Seç</h2>
          <p style={{ textAlign:"center", color:TEXT2, marginBottom:44, fontSize:14, fontFamily:FONT }}>Hedefine uygun plani seç ve bugün başla</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:22 }}>
            {PLANS.map(function(plan) {
              return (
                <div key={plan.name}
                  onMouseEnter={function(e){ e.currentTarget.style.transform="translateY(-4px)"; }}
                  onMouseLeave={function(e){ e.currentTarget.style.transform="translateY(0)"; }}
                  style={{ background: plan.popular ? "linear-gradient(145deg, rgba(201,168,76,0.12), rgba(124,92,252,0.06))" : "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border:"1px solid "+(plan.popular?"rgba(201,168,76,0.45)":CARD_BORDER2), borderRadius:24, padding:32, position:"relative", boxShadow: plan.popular ? "0 8px 32px rgba(201,168,76,0.20), inset 0 1px 0 rgba(255,255,255,0.1)" : "0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)", transition:"all 0.2s ease", fontFamily:FONT }}>
                  {plan.popular && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#c9a84c,#f5cc6a)", color:"#08080f", fontSize:11, fontWeight:800, padding:"5px 18px", borderRadius:100, letterSpacing:"1px", boxShadow:SHADOW_GOLD, textTransform:"uppercase" }}>En Popüler</div>}
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:8, color:TEXT2, textTransform:"uppercase", letterSpacing:"1.5px" }}>{plan.name}</div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:24 }}>
                    <span style={{ fontSize:48, fontWeight:800, color: plan.popular ? GOLD2 : plan.color, fontFamily:FONT_MONO, letterSpacing:"-0.03em" }}>{"$"+plan.price}</span>
                    <span style={{ color:TEXT2, fontSize:13, fontFamily:FONT_MONO }}>/ay</span>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:26 }}>
                    {plan.features.map(function(f) {
                      return <div key={f} style={{ display:"flex", gap:10, alignItems:"flex-start", fontSize:13, color:TEXT, lineHeight:1.5 }}><span style={{ color: plan.popular ? GOLD2 : plan.color, fontWeight:800, flexShrink:0 }}>✓</span>{f}</div>;
                    })}
                  </div>
                  <button onClick={function() { window.open(buildPaymentUrl(plan.name, ""), "_blank"); }}
                    onMouseEnter={function(e){ if(plan.popular){ e.currentTarget.style.boxShadow="0 8px 32px rgba(201,168,76,0.45)"; } else { e.currentTarget.style.background="rgba(255,255,255,0.06)"; } }}
                    onMouseLeave={function(e){ if(plan.popular){ e.currentTarget.style.boxShadow=SHADOW_GOLD; } else { e.currentTarget.style.background="transparent"; } }}
                    style={{ width:"100%", background: plan.popular ? "linear-gradient(135deg,#c9a84c,#f5cc6a)" : "transparent", color: plan.popular ? "#08080f" : plan.color, border:"1px solid "+(plan.popular?"transparent":plan.color), borderRadius:14, padding:"14px 0", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow: plan.popular ? SHADOW_GOLD : "none", transition:"all 0.2s ease", fontFamily:FONT, letterSpacing:"0.3px" }}>
                    {plan.popular ? "Hemen Kayıt Ol" : "Seç"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REGISTER ────────────────────────────────────────────────────────────────
function B2BSection() {
  var [company, setCompany] = useState("");
  var [cname, setCname] = useState("");
  var [cemail, setCemail] = useState("");
  var [csize, setCsize] = useState("1-10");
  var [cphone, setCphone] = useState("");
  var [sent, setSent] = useState(false);
  var [sending, setSending] = useState(false);
  var [berr, setBerr] = useState("");
  function submitLead() {
    setBerr("");
    if (!company.trim() || !cname.trim() || !cemail.trim() || cemail.indexOf("@") < 1) { setBerr("Şirket adı, ad soyad ve geçerli bir e-posta gerekli."); return; }
    setSending(true);
    fetch(USERS_API, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "demo-request", lead: { company: company.trim(), name: cname.trim(), email: cemail.trim().toLowerCase(), size: csize, phone: cphone.trim() } }) })
      .then(function(r) { return r.json(); })
      .then(function(d) { setSending(false); if (d && d.ok) { setSent(true); } else { setBerr("Gönderilemedi. Lütfen tekrar deneyin."); } })
      .catch(function() { setSending(false); setBerr("Bağlantı hatası. Lütfen tekrar deneyin."); });
  }
  var inputSt = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"12px 14px", color:TEXT, fontSize:14, fontFamily:FONT, outline:"none", boxSizing:"border-box" };
  var labelSt = { display:"block", color:TEXT2, fontSize:11, fontWeight:600, marginBottom:6, textTransform:"uppercase", letterSpacing:"1px" };
  return (
    <div style={{ background:BG, color:TEXT, fontFamily:FONT, padding:"72px 20px 88px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth:980, margin:"0 auto", display:"flex", gap:48, flexWrap:"wrap", alignItems:"flex-start" }}>
        <div style={{ flex:"1 1 380px", minWidth:300 }}>
          <div style={{ display:"inline-block", background:"rgba(201,168,76,0.10)", border:"1px solid rgba(201,168,76,0.4)", borderRadius:100, padding:"6px 16px", fontSize:12, color:GOLD2, marginBottom:20, fontFamily:FONT_MONO }}>ŞİRKETLER İÇİN</div>
          <div style={{ fontSize:32, fontWeight:800, lineHeight:1.25, marginBottom:16 }}>Ekibinize AI yetkinliğini<br/>28 günde kazandırın</div>
          <p style={{ color:TEXT2, fontSize:15, lineHeight:1.7, marginBottom:28 }}>Eğitmen maliyeti yok, kurulum yok. Çalışanlarınız günde 15 dakikayla 28 AI aracını uygulayarak öğrenir; siz ilerlemeyi tek panelden izlersiniz.</p>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}><span style={{ color:GOLD2, fontSize:18 }}>✓</span><span style={{ color:TEXT2, fontSize:14, lineHeight:1.6 }}><b style={{ color:TEXT }}>Toplu lisans:</b> Ekibinizin tamamı için tek pakette atanmış erişim kodları.</span></div>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}><span style={{ color:GOLD2, fontSize:18 }}>✓</span><span style={{ color:TEXT2, fontSize:14, lineHeight:1.6 }}><b style={{ color:TEXT }}>İlerleme raporu:</b> Kim hangi günde, tamamlama oranı ne — ekip paneli ve lider tablosu.</span></div>
            <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}><span style={{ color:GOLD2, fontSize:18 }}>✓</span><span style={{ color:TEXT2, fontSize:14, lineHeight:1.6 }}><b style={{ color:TEXT }}>Kurumsal sertifika:</b> Programı bitiren her çalışana isimli sertifika.</span></div>
          </div>
        </div>
        <div style={{ flex:"1 1 360px", minWidth:300, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:16, padding:28 }}>
          {sent ? (
            <div style={{ textAlign:"center", padding:"36px 8px" }}>
              <div style={{ fontSize:40, marginBottom:14 }}>🤝</div>
              <div style={{ fontSize:19, fontWeight:700, marginBottom:8 }}>Talebiniz alındı</div>
              <p style={{ color:TEXT2, fontSize:14, lineHeight:1.6 }}>24 saat içinde {cemail} adresinden size ulaşıp ekibinize özel demo planlayacağız.</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize:18, fontWeight:700, marginBottom:18 }}>Demo talep edin</div>
              <div style={{ marginBottom:14 }}><label style={labelSt}>Şirket Adı</label><input value={company} onChange={function(e){ setCompany(e.target.value); }} style={inputSt} placeholder="Örn. Acme Teknoloji" /></div>
              <div style={{ marginBottom:14 }}><label style={labelSt}>Ad Soyad</label><input value={cname} onChange={function(e){ setCname(e.target.value); }} style={inputSt} placeholder="Adınız Soyadınız" /></div>
              <div style={{ marginBottom:14 }}><label style={labelSt}>İş E-postası</label><input value={cemail} onChange={function(e){ setCemail(e.target.value); }} style={inputSt} placeholder="ad@sirket.com" /></div>
              <div style={{ display:"flex", gap:12, marginBottom:14, flexWrap:"wrap" }}>
                <div style={{ flex:"1 1 140px" }}><label style={labelSt}>Çalışan Sayısı</label>
                  <select value={csize} onChange={function(e){ setCsize(e.target.value); }} style={inputSt}>
                    <option value="1-10">1-10</option><option value="11-50">11-50</option><option value="51-200">51-200</option><option value="200+">200+</option>
                  </select></div>
                <div style={{ flex:"1 1 140px" }}><label style={labelSt}>Telefon (opsiyonel)</label><input value={cphone} onChange={function(e){ setCphone(e.target.value); }} style={inputSt} placeholder="05xx xxx xx xx" /></div>
              </div>
              {berr && <div style={{ color:"#ef4444", fontSize:13, marginBottom:12 }}>{berr}</div>}
              <button onClick={submitLead} disabled={sending}
                style={{ width:"100%", background: sending ? "#444" : "linear-gradient(135deg,#d4a853,#f0c060)", color:"#08080f", border:"none", borderRadius:10, padding:"13px 0", fontSize:15, fontWeight:700, cursor: sending ? "not-allowed" : "pointer" }}>
                {sending ? "Gönderiliyor..." : "Demo Talep Et"}
              </button>
              <p style={{ color:"#666677", fontSize:11, marginTop:12, lineHeight:1.5, textAlign:"center" }}>Bilgileriniz yalnızca sizinle iletişim için kullanılır.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Register(props) {
  var [name, setName] = useState("");
  var [email, setEmail] = useState("");
  var [pass, setPass] = useState("");
  var [err, setErr] = useState("");
  var [loading, setLoading] = useState(false);
  var [showTerms, setShowTerms] = useState(false);
  var [showPrivacy, setShowPrivacy] = useState(false);
  var inviteData = props.inviteData;

  function submit() {
    if (!name || !email || !pass) { setErr("Tüm alanlari doldurun"); return; }
    if (email.indexOf("@") < 0) { setErr("Geçerli email girin"); return; }
    if (pass.length < 6) { setErr("Şifre en az 6 karakter"); return; }
    if (emailExists(email)) { setErr("Bu email zaten kayıtlı. Giriş Yap butonunu kullan."); return; }
    try {
      var existing = lsGet("aica_users_registry");
      if (existing) {
        var registry = JSON.parse(existing);
        if (registry[email.toLowerCase().trim()]) {
          setErr("Bu email adresi zaten kayıtlı. Giriş yapmayı deneyin.");
          return;
        }
      }
    } catch(e) {}
    setLoading(true);
    fetch(USERS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check-email", email: email.toLowerCase().trim() })
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (d.exists) {
        setErr("Bu email adresi zaten kayıtlı. Giriş yapmayı deneyin.");
        setLoading(false);
        return;
      }
      devamEt();
    })
    .catch(function() {
      devamEt();
    });
    function devamEt() {
      setTimeout(function() {
        setLoading(false);
        var userData = {
          name: name, email: email, pass: pass,
          plan: props.plan || PLANS[1],
          progress: {}, scores: {}, xp: 0, streak: 0,
          teamId: inviteData ? inviteData.teamId : null,
          isTeamMember: inviteData ? true : false,
        };
        addToRegistry(email, userData);
        try {
          var reg = {};
          var existing2 = lsGet("aica_users_registry");
          if (existing2) reg = JSON.parse(existing2);
          reg[email.toLowerCase().trim()] = Date.now();
          lsSet("aica_users_registry", JSON.stringify(reg));
        } catch(e) {}
        props.onDone(userData);
      }, 1200);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:BG, color:"#fff", fontFamily:FONT, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:40, fontWeight:800, color:GOLD }}>AI</div>
          <div style={{ fontSize:17, fontWeight:600 }}>Certification Academy</div>
          {inviteData && <div style={{ marginTop:10, background:"rgba(16,163,127,0.1)", border:"1px solid rgba(16,163,127,0.3)", borderRadius:8, padding:"8px 16px", fontSize:13, color:"#10a37f" }}>Ekip davetini kabul ediyorsun</div>}
          {!inviteData && props.plan && <div style={{ marginTop:10, display:"inline-block", background:"rgba(212,168,83,0.1)", border:"1px solid rgba(212,168,83,0.3)", borderRadius:7, padding:"5px 14px", fontSize:12, color:GOLD }}>{props.plan.name + " - $" + props.plan.price + " · tek seferlik"}</div>}
        </div>
        <div style={{ background:CARD_BG, border:"1px solid "+CARD_BORDER, borderRadius:16, padding:28 }}>
          <h2 style={{ color:"#fff", fontWeight:700, marginBottom:20, fontSize:19 }}>Hesap Oluştur</h2>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", color:"#888899", fontSize:12, marginBottom:5 }}>Ad Soyad</label>
            <input type="text" value={name} onChange={function(e) { setName(e.target.value); }}
              style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 14px", color:"#fff", fontSize:15, outline:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", color:"#888899", fontSize:12, marginBottom:5 }}>Email</label>
            <input type="email" value={email} onChange={function(e) { setEmail(e.target.value); }}
              style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 14px", color:"#fff", fontSize:15, outline:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", color:"#888899", fontSize:12, marginBottom:5 }}>Şifre</label>
            <input type="password" value={pass} onChange={function(e) { setPass(e.target.value); }}
              style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 14px", color:"#fff", fontSize:15, outline:"none", boxSizing:"border-box" }} />
          </div>
          {err && <div style={{ color:"#ef4444", fontSize:12, marginBottom:12 }}>{"! " + err}</div>}
          <button onClick={submit} disabled={loading}
            style={{ width:"100%", background: loading ? "#444" : "linear-gradient(135deg,#d4a853,#f0c060)", color:"#08080f", border:"none", borderRadius:10, padding:"13px 0", fontSize:15, fontWeight:700, cursor: loading ? "not-allowed" : "pointer", marginTop:6 }}>
            {loading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
          </button>
          <p style={{ textAlign:"center", marginTop:12, fontSize:11, color:"#555577" }}>
            Kayıt olarak <button onClick={function() { setShowTerms(true); }} style={{ background:"transparent", border:"none", color:GOLD, cursor:"pointer", fontSize:11, textDecoration:"underline" }}>Kullanım Koşulları</button> ve <button onClick={function() { setShowPrivacy(true); }} style={{ background:"transparent", border:"none", color:GOLD, cursor:"pointer", fontSize:11, textDecoration:"underline" }}>Gizlilik Politikası</button>'nı kabul etmiş olursun.
          </p>
          <p style={{ textAlign:"center", marginTop:10, fontSize:12, color:"#555577" }}>
            Zaten hesabın var mi?
            <button onClick={props.onLogin} style={{ background:"transparent", border:"none", color:GOLD, cursor:"pointer", fontSize:12, marginLeft:4 }}>Giriş Yap</button>
          </p>
        </div>
      </div>
      {showTerms && <LegalModal title="Kullanım Koşulları" text={TERMS_TEXT} onClose={function() { setShowTerms(false); }} />}
      {showPrivacy && <LegalModal title="Gizlilik Politikası" text={PRIVACY_TEXT} onClose={function() { setShowPrivacy(false); }} />}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function AdminPanel(props) {

  var [users, setUsers] = useState([]);

  var [loading, setLoading] = useState(true);

  var [activeTab, setActiveTab] = useState("overview");

  var [selectedUser, setSelectedUser] = useState(null);

  var [search, setSearch] = useState("");

  var [planFilter, setPlanFilter] = useState("Tümü");

  var [fullAccess, setFullAccess] = useState(false);

  var [fullAccessPass, setFullAccessPass] = useState("");

  var [fullAccessErr, setFullAccessErr] = useState("");

  var [announcement, setAnnouncement] = useState("");

  var [announcementSent, setAnnouncementSent] = useState(false);

  var [batchRunning, setBatchRunning] = useState(false);

  var [batchProgress, setBatchProgress] = useState("");

  var [batchProgressPct, setBatchProgressPct] = useState(0);

  var [batchLogs, setBatchLogs] = useState([]);

  var [batchCompleted, setBatchCompleted] = useState(0);

  var [batchTotal, setBatchTotal] = useState(0);

  var [selectedTool, setSelectedTool] = useState("Tümü");

  var [selectedProfile, setSelectedProfile] = useState("Tümü");

  var TOOLS_LIST = ["ChatGPT","Claude","Gemini","Perplexity","Deepseek","Copilot","Grok","Midjourney","Leonardo AI","Stable Diffusion","Canva AI","ElevenLabs","Runway ML","Make.com","Zapier AI","Notion AI","Lovable","Manus","Meta AI","Assembly AI","Prompt Engineering","AI İş Stratejisi"];

  var PROFILES_MAP = {
    "default": "Genel kullanıcı, AI araçlarını öğrenmek isteyen kişi",
    "baslangic_kariyer": "Yeni başlayan, kariyerini geliştirmek isteyen profesyonel",
    "baslangic_is": "Yeni başlayan, kendi işini kurmak isteyen girişimci",
    "baslangic_freelance": "Yeni başlayan, freelance gelir elde etmek isteyen",
    "orta_kariyer": "Orta seviye, kariyerinde ilerlemek isteyen profesyonel",
    "orta_is": "Orta seviye, işini büyütmek isteyen girişimci",
    "ileri_kariyer": "İleri seviye, sektöründe AI lideri olmak isteyen uzman"
  };

  function runBatch() {
    if (batchRunning) return;
    setBatchRunning(true);
    setBatchProgress("Başlatılıyor...");
    setBatchProgressPct(0);
    var toolsToRun = selectedTool === "Tümü" ? TOOLS_LIST : [selectedTool];
    var profilesToRun = selectedProfile === "Tümü" ? Object.keys(PROFILES_MAP) : [selectedProfile];
    var total = toolsToRun.length * profilesToRun.length;
    var completed = 0;
    var success = 0;
    var failed = 0;
    setBatchCompleted(0);
    setBatchTotal(total);
    function processNext(toolIdx, profileIdx) {
      if (toolIdx >= toolsToRun.length) {
        setBatchProgress("✅ Tamamlandı! " + success + " başarılı, " + failed + " başarısız. Toplam: " + total);
        setBatchRunning(false);
        fetch("https://ai-proxy-two-pi.vercel.app/api/batch-logs", { headers: authJsonHeaders() })
          .then(function(r) { return r.json(); })
          .then(function(d) { setBatchLogs(d.logs || []); });
        return;
      }
      if (profileIdx >= profilesToRun.length) { processNext(toolIdx + 1, 0); return; }
      var tool = toolsToRun[toolIdx];
      var profile = profilesToRun[profileIdx];
      var profileCtx = PROFILES_MAP[profile] || "Genel kullanıcı";
      setBatchProgress("⚙️ " + tool + " / " + profile + " (" + (completed+1) + "/" + total + ")");
      var prompts = [
        "Sen AI eğitim uzmanısın. " + tool + " aracını öğretiyorsun.\nÖğrenci: " + profileCtx + "\n\n5 kart üret (Temel: bu araç nedir, neden önemli, kurulum, ilk adımlar, arayüz turu):\nSADECE JSON döndür, başka hiçbir şey yazma:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim belirt]\\nNe yaptı: [Somut adımlar - hangi butona bastı, ne yazdı, ne seçti]\\nSonuç: [Rakamsal veya somut çıktı - kaç dakika, yüzde kaç, ne kadar para]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam komut veya tıklanacak yer - kullanıcı kopyalayıp uygulayabilmeli]\\n2️⃣ [Adım adı]: [Tam olarak ne görüntülenir veya ne yapılır - ekran açıklaması ile]\\n3️⃣ [Adım adı]: [Beklenen çıktı - kullanıcı ne görüyor, ne elde ediyor]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir numara - hazır şablon, kısayol veya rakam içersin]\",\"icon\":\"emoji\"}]",
        "Sen AI eğitim uzmanısın. " + tool + " aracını öğretiyorsun.\nÖğrenci: " + profileCtx + "\n\n5 kart üret (Özellikler: en kritik 5 özellik, her biri için ayrı kart):\nSADECE JSON döndür, başka hiçbir şey yazma:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim belirt]\\nNe yaptı: [Somut adımlar - hangi butona bastı, ne yazdı, ne seçti]\\nSonuç: [Rakamsal veya somut çıktı - kaç dakika, yüzde kaç, ne kadar para]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam komut veya tıklanacak yer - kullanıcı kopyalayıp uygulayabilmeli]\\n2️⃣ [Adım adı]: [Tam olarak ne görüntülenir veya ne yapılır - ekran açıklaması ile]\\n3️⃣ [Adım adı]: [Beklenen çıktı - kullanıcı ne görüyor, ne elde ediyor]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir numara - hazır şablon, kısayol veya rakam içersin]\",\"icon\":\"emoji\"}]",
        "Sen AI eğitim uzmanısın. " + tool + " aracını öğretiyorsun.\nÖğrenci: " + profileCtx + "\n\n5 kart üret (Prompt şablonları: 5 farklı hazır komut şablonu, her biri için kullanım senaryosu):\nSADECE JSON döndür, başka hiçbir şey yazma:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim belirt]\\nNe yaptı: [Somut adımlar - hangi butona bastı, ne yazdı, ne seçti]\\nSonuç: [Rakamsal veya somut çıktı - kaç dakika, yüzde kaç, ne kadar para]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam komut veya tıklanacak yer - kullanıcı kopyalayıp uygulayabilmeli]\\n2️⃣ [Adım adı]: [Tam olarak ne görüntülenir veya ne yapılır - ekran açıklaması ile]\\n3️⃣ [Adım adı]: [Beklenen çıktı - kullanıcı ne görüyor, ne elde ediyor]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir numara - hazır şablon, kısayol veya rakam içersin]\",\"icon\":\"emoji\"}]",
        "Sen AI eğitim uzmanısın. " + tool + " aracını öğretiyorsun.\nÖğrenci: " + profileCtx + "\n\n5 kart üret (Hatalar: sık yapılan 5 hata, her biri için önce-sonra karşılaştırması):\nSADECE JSON döndür, başka hiçbir şey yazma:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim belirt]\\nNe yaptı: [Somut adımlar - hangi butona bastı, ne yazdı, ne seçti]\\nSonuç: [Rakamsal veya somut çıktı - kaç dakika, yüzde kaç, ne kadar para]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam komut veya tıklanacak yer - kullanıcı kopyalayıp uygulayabilmeli]\\n2️⃣ [Adım adı]: [Tam olarak ne görüntülenir veya ne yapılır - ekran açıklaması ile]\\n3️⃣ [Adım adı]: [Beklenen çıktı - kullanıcı ne görüyor, ne elde ediyor]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir numara - hazır şablon, kısayol veya rakam içersin]\",\"icon\":\"emoji\"}]",
        "Sen AI eğitim uzmanısın. " + tool + " aracını öğretiyorsun.\nÖğrenci: " + profileCtx + "\n\n5 kart üret (Entegrasyonlar: Zapier, Make, API, Chrome eklentisi, diğer araçlarla bağlantı):\nSADECE JSON döndür, başka hiçbir şey yazma:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim belirt]\\nNe yaptı: [Somut adımlar - hangi butona bastı, ne yazdı, ne seçti]\\nSonuç: [Rakamsal veya somut çıktı - kaç dakika, yüzde kaç, ne kadar para]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam komut veya tıklanacak yer - kullanıcı kopyalayıp uygulayabilmeli]\\n2️⃣ [Adım adı]: [Tam olarak ne görüntülenir veya ne yapılır - ekran açıklaması ile]\\n3️⃣ [Adım adı]: [Beklenen çıktı - kullanıcı ne görüyor, ne elde ediyor]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir numara - hazır şablon, kısayol veya rakam içersin]\",\"icon\":\"emoji\"}]",
        "Sen AI eğitim uzmanısın. " + tool + " aracını öğretiyorsun.\nÖğrenci: " + profileCtx + "\n\n5 kart üret (Otomasyon: iş akışı otomasyonu, zaman tasarrufu, tekrar eden görevler):\nSADECE JSON döndür, başka hiçbir şey yazma:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim belirt]\\nNe yaptı: [Somut adımlar - hangi butona bastı, ne yazdı, ne seçti]\\nSonuç: [Rakamsal veya somut çıktı - kaç dakika, yüzde kaç, ne kadar para]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam komut veya tıklanacak yer - kullanıcı kopyalayıp uygulayabilmeli]\\n2️⃣ [Adım adı]: [Tam olarak ne görüntülenir veya ne yapılır - ekran açıklaması ile]\\n3️⃣ [Adım adı]: [Beklenen çıktı - kullanıcı ne görüyor, ne elde ediyor]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir numara - hazır şablon, kısayol veya rakam içersin]\",\"icon\":\"emoji\"}]",
        "Sen AI eğitim uzmanısın. " + tool + " aracını öğretiyorsun.\nÖğrenci: " + profileCtx + "\n\n5 kart üret (Kariyer: bu araçla kariyer avantajı, sektörel kullanım, rekabet üstünlüğü):\nSADECE JSON döndür, başka hiçbir şey yazma:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim belirt]\\nNe yaptı: [Somut adımlar - hangi butona bastı, ne yazdı, ne seçti]\\nSonuç: [Rakamsal veya somut çıktı - kaç dakika, yüzde kaç, ne kadar para]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam komut veya tıklanacak yer - kullanıcı kopyalayıp uygulayabilmeli]\\n2️⃣ [Adım adı]: [Tam olarak ne görüntülenir veya ne yapılır - ekran açıklaması ile]\\n3️⃣ [Adım adı]: [Beklenen çıktı - kullanıcı ne görüyor, ne elde ediyor]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir numara - hazır şablon, kısayol veya rakam içersin]\",\"icon\":\"emoji\"}]",
        "Sen AI eğitim uzmanısın. " + tool + " aracını öğretiyorsun.\nÖğrenci: " + profileCtx + "\n\n5 kart üret (ROI ve verimlilik: somut rakamlar, zaman/para tasarrufu, iş hayatına katkı):\nSADECE JSON döndür, başka hiçbir şey yazma:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim belirt]\\nNe yaptı: [Somut adımlar - hangi butona bastı, ne yazdı, ne seçti]\\nSonuç: [Rakamsal veya somut çıktı - kaç dakika, yüzde kaç, ne kadar para]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam komut veya tıklanacak yer - kullanıcı kopyalayıp uygulayabilmeli]\\n2️⃣ [Adım adı]: [Tam olarak ne görüntülenir veya ne yapılır - ekran açıklaması ile]\\n3️⃣ [Adım adı]: [Beklenen çıktı - kullanıcı ne görüyor, ne elde ediyor]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir numara - hazır şablon, kısayol veya rakam içersin]\",\"icon\":\"emoji\"}]",
        "Sen AI eğitim uzmanısın. " + tool + " aracını öğretiyorsun.\nÖğrenci: " + profileCtx + "\n\n5 kart üret (Gelecek: 2025-2030 fırsatları, AGI yolculuğu, dönüşen meslekler):\nSADECE JSON döndür, başka hiçbir şey yazma:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim belirt]\\nNe yaptı: [Somut adımlar - hangi butona bastı, ne yazdı, ne seçti]\\nSonuç: [Rakamsal veya somut çıktı - kaç dakika, yüzde kaç, ne kadar para]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam komut veya tıklanacak yer - kullanıcı kopyalayıp uygulayabilmeli]\\n2️⃣ [Adım adı]: [Tam olarak ne görüntülenir veya ne yapılır - ekran açıklaması ile]\\n3️⃣ [Adım adı]: [Beklenen çıktı - kullanıcı ne görüyor, ne elde ediyor]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir numara - hazır şablon, kısayol veya rakam içersin]\",\"icon\":\"emoji\"}]",
        "Sen AI eğitim uzmanısın. " + tool + " aracını öğretiyorsun.\nÖğrenci: " + profileCtx + "\n\n5 kart üret (Öğrenme planı: 30 günlük kişiselleştirilmiş plan, haftalık hedefler, milestones):\nSADECE JSON döndür, başka hiçbir şey yazma:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim belirt]\\nNe yaptı: [Somut adımlar - hangi butona bastı, ne yazdı, ne seçti]\\nSonuç: [Rakamsal veya somut çıktı - kaç dakika, yüzde kaç, ne kadar para]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam komut veya tıklanacak yer - kullanıcı kopyalayıp uygulayabilmeli]\\n2️⃣ [Adım adı]: [Tam olarak ne görüntülenir veya ne yapılır - ekran açıklaması ile]\\n3️⃣ [Adım adı]: [Beklenen çıktı - kullanıcı ne görüyor, ne elde ediyor]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir numara - hazır şablon, kısayol veya rakam içersin]\",\"icon\":\"emoji\"}]",
        "Sen AI eğitim uzmanısın. " + tool + " aracını öğretiyorsun.\nÖğrenci: " + profileCtx + "\n\n5 kart üret (Pratik egzersizler: hemen yapılabilecek 5 görev, her biri 10-15 dakika):\nSADECE JSON döndür, başka hiçbir şey yazma:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim belirt]\\nNe yaptı: [Somut adımlar - hangi butona bastı, ne yazdı, ne seçti]\\nSonuç: [Rakamsal veya somut çıktı - kaç dakika, yüzde kaç, ne kadar para]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam komut veya tıklanacak yer - kullanıcı kopyalayıp uygulayabilmeli]\\n2️⃣ [Adım adı]: [Tam olarak ne görüntülenir veya ne yapılır - ekran açıklaması ile]\\n3️⃣ [Adım adı]: [Beklenen çıktı - kullanıcı ne görüyor, ne elde ediyor]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir numara - hazır şablon, kısayol veya rakam içersin]\",\"icon\":\"emoji\"}]",
        "Sen AI eğitim uzmanısın. " + tool + " aracını öğretiyorsun.\nÖğrenci: " + profileCtx + "\n\n5 kart üret (Sık sorular: bu seviyedeki kullanıcıların en çok kafasını karıştıran 5 soru ve detaylı cevapları):\nSADECE JSON döndür, başka hiçbir şey yazma:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim belirt]\\nNe yaptı: [Somut adımlar - hangi butona bastı, ne yazdı, ne seçti]\\nSonuç: [Rakamsal veya somut çıktı - kaç dakika, yüzde kaç, ne kadar para]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam komut veya tıklanacak yer - kullanıcı kopyalayıp uygulayabilmeli]\\n2️⃣ [Adım adı]: [Tam olarak ne görüntülenir veya ne yapılır - ekran açıklaması ile]\\n3️⃣ [Adım adı]: [Beklenen çıktı - kullanıcı ne görüyor, ne elde ediyor]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir numara - hazır şablon, kısayol veya rakam içersin]\",\"icon\":\"emoji\"}]",
        "Sen AI eğitim uzmanısın. " + tool + " aracını öğretiyorsun.\nÖğrenci: " + profileCtx + "\n\n5 kart üret (Gelişmiş teknikler: çoğu kullanıcının bilmediği 5 ileri seviye ipucu):\nSADECE JSON döndür, başka hiçbir şey yazma:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim belirt]\\nNe yaptı: [Somut adımlar - hangi butona bastı, ne yazdı, ne seçti]\\nSonuç: [Rakamsal veya somut çıktı - kaç dakika, yüzde kaç, ne kadar para]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam komut veya tıklanacak yer - kullanıcı kopyalayıp uygulayabilmeli]\\n2️⃣ [Adım adı]: [Tam olarak ne görüntülenir veya ne yapılır - ekran açıklaması ile]\\n3️⃣ [Adım adı]: [Beklenen çıktı - kullanıcı ne görüyor, ne elde ediyor]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir numara - hazır şablon, kısayol veya rakam içersin]\",\"icon\":\"emoji\"}]",
        "Sen AI eğitim uzmanısın. " + tool + " aracını öğretiyorsun.\nÖğrenci: " + profileCtx + "\n\n5 kart üret (Başarı hikayeleri: bu araçla gerçek başarı elde etmiş 5 farklı profil hikayesi):\nSADECE JSON döndür, başka hiçbir şey yazma:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim belirt]\\nNe yaptı: [Somut adımlar - hangi butona bastı, ne yazdı, ne seçti]\\nSonuç: [Rakamsal veya somut çıktı - kaç dakika, yüzde kaç, ne kadar para]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam komut veya tıklanacak yer - kullanıcı kopyalayıp uygulayabilmeli]\\n2️⃣ [Adım adı]: [Tam olarak ne görüntülenir veya ne yapılır - ekran açıklaması ile]\\n3️⃣ [Adım adı]: [Beklenen çıktı - kullanıcı ne görüyor, ne elde ediyor]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir numara - hazır şablon, kısayol veya rakam içersin]\",\"icon\":\"emoji\"}]",
        "Sen AI eğitim uzmanısın. " + tool + " aracını öğretiyorsun.\nÖğrenci: " + profileCtx + "\n\n5 kart üret (Sonraki adımlar: bu araçtan sonra hangi araçları öğrenmeli, nasıl bir öğrenme yolu izlemeli):\nSADECE JSON döndür, başka hiçbir şey yazma:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim belirt]\\nNe yaptı: [Somut adımlar - hangi butona bastı, ne yazdı, ne seçti]\\nSonuç: [Rakamsal veya somut çıktı - kaç dakika, yüzde kaç, ne kadar para]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam komut veya tıklanacak yer - kullanıcı kopyalayıp uygulayabilmeli]\\n2️⃣ [Adım adı]: [Tam olarak ne görüntülenir veya ne yapılır - ekran açıklaması ile]\\n3️⃣ [Adım adı]: [Beklenen çıktı - kullanıcı ne görüyor, ne elde ediyor]\\n\\n⚡ Pro İpucu: [Hemen uygulanabilir numara - hazır şablon, kısayol veya rakam içersin]\",\"icon\":\"emoji\"}]"
      ];
      var allCards = [];
      var promptIdx = 0;
      function fetchPrompt() {
        if (promptIdx >= prompts.length) {
          if (allCards.length > 0) {
            fetch("https://ai-proxy-two-pi.vercel.app/api/generate-lessons", {
              method: "POST",
              headers: authJsonHeaders(),
              body: JSON.stringify({ tool: tool, profileKey: profile, cards: allCards, triggeredBy: "manual" })
            }).then(function() {
              success++;
              completed++;
              setBatchProgressPct(Math.round((completed / total) * 100));
              setBatchCompleted(completed);
              processNext(toolIdx, profileIdx + 1);
            }).catch(function() { failed++; completed++; setBatchProgressPct(Math.round((completed / total) * 100)); setBatchCompleted(completed); processNext(toolIdx, profileIdx + 1); });
          } else {
            failed++;
            completed++;
            setBatchProgressPct(Math.round((completed / total) * 100));
            setBatchCompleted(completed);
            processNext(toolIdx, profileIdx + 1);
          }
          return;
        }
        fetch(PROXY_URL, {
          method: "POST",
          headers: authJsonHeaders(),
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 3000,
            messages: [{ role: "user", content: prompts[promptIdx] }]
          })
        })
        .then(function(r) {
          if (r.status === 401) { handleUnauthorized(); throw new Error("unauthorized"); }
          return r.json();
        })
        .then(function(d) {
          var text = "";
          if (d && d.content) { for (var i = 0; i < d.content.length; i++) text += d.content[i].text || ""; }
          var clean = text.replace(/```json|```/g, "").trim();
          var start = clean.indexOf("[");
          var end = clean.lastIndexOf("]");
          if (start !== -1 && end !== -1) {
            try { allCards = allCards.concat(JSON.parse(clean.slice(start, end + 1))); } catch(e) {}
          }
          promptIdx++;
          var promptProgress = Math.round(((completed + (promptIdx / prompts.length)) / total) * 100);
          setBatchProgressPct(Math.min(99, promptProgress));
          setTimeout(function() { fetchPrompt(); }, 800);
        })
        .catch(function() {
          promptIdx++;
          var promptProgress = Math.round(((completed + (promptIdx / prompts.length)) / total) * 100);
          setBatchProgressPct(Math.min(99, promptProgress));
          setTimeout(function() { fetchPrompt(); }, 800);
        });
      }
      fetchPrompt();
    }
    processNext(0, 0);
  }

  useEffect(function() {

    fetch(USERS_API, {

      method: "POST",

      headers: authJsonHeaders(),
      body: JSON.stringify({ action: "list" })

    })

    .then(function(r) { return r.json(); })

    .then(function(data) {

      var list = Array.isArray(data) ? data : (data && data.users ? data.users : []);

      setUsers(list || []);

      setLoading(false);

    })

    .catch(function() { setLoading(false); });

  }, []);

  function fmt(ts) {

    if (!ts) return "-";

    try {

      var d = new Date(ts);

      if (isNaN(d.getTime())) return "-";

      return d.toLocaleDateString("tr-TR") + " " + d.toLocaleTimeString("tr-TR", { hour:"2-digit", minute:"2-digit" });

    } catch(e) { return "-"; }

  }

  function planName(u) {

    if (!u || !u.plan) return "Starter";

    if (typeof u.plan === "string") return u.plan;

    if (u.plan.name) return u.plan.name;

    return "Starter";

  }

  function planColor(name) {

    if (name === "Business") return "#10a37f";

    if (name === "Pro") return "#d4a853";

    return "#6366f1";

  }

  function planRevenue(name) {

    if (name === "Business") return 199;

    if (name === "Pro") return 79;

    return 29;

  }

  var todayStart = new Date(); todayStart.setHours(0,0,0,0);

  var weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);

  var totalUsers = users.length;

  var starterCount = users.filter(function(u) { return planName(u) === "Starter"; }).length;

  var proCount = users.filter(function(u) { return planName(u) === "Pro"; }).length;

  var bizCount = users.filter(function(u) { return planName(u) === "Business"; }).length;

  var todayCount = users.filter(function(u) {

    var t = u.created_at || u.createdAt;

    return t && new Date(t).getTime() >= todayStart.getTime();

  }).length;

  var weekCount = users.filter(function(u) {

    var t = u.created_at || u.createdAt;

    return t && new Date(t).getTime() >= weekStart.getTime();

  }).length;

  var totalRevenue = users.reduce(function(acc, u) { return acc + planRevenue(planName(u)); }, 0);

  var avgXP = totalUsers > 0 ? Math.round(users.reduce(function(acc, u) { return acc + (u.xp || 0); }, 0) / totalUsers) : 0;

  var filteredUsers = users.filter(function(u) {

    var matchPlan = planFilter === "Tümü" || planName(u) === planFilter;

    var matchSearch = !search || (u.name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase());

    return matchPlan && matchSearch;

  });

  var tabs = [

    { id:"overview", label:"📊 Genel Bakış" },

    { id:"users", label:"👥 Kullanıcılar" },

    { id:"revenue", label:"💰 Gelir" },

    { id:"platform", label:"⚙️ Platform Yönetimi" },

  ];

  function unlockFullAccess() {

    fetch("https://ai-proxy-two-pi.vercel.app/api/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, pass: fullAccessPass })
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.ok && d.token && d.user && d.user.admin) {
          setAuthToken(d.token);
          setFullAccess(true);
          setFullAccessErr("");
        } else {
          setFullAccessErr("Hatalı şifre");
        }
      })
      .catch(function() { setFullAccessErr("Bağlantı hatası"); });

  }

  function enterAsUser(u) {

    if (!fullAccess) return;

    var fakeUser = { ...u, plan: { name: planName(u), price: planRevenue(planName(u)), color: planColor(planName(u)), popular: planName(u)==="Pro", features: [] } };

    props.onEnterAsUser && props.onEnterAsUser(fakeUser);

  }

  function getUserStatus(u) {
    if (u && u._status) return u._status;
    return lsGet("user-status-" + (u && u.email ? u.email : "")) === "pasif" ? "pasif" : "aktif";
  }

  function toggleStatus(u) {
    var key = "user-status-" + u.email;
    var current = lsGet(key);
    if (current === "pasif") {
      lsRemove(key);
    } else {
      lsSet(key, "pasif");
    }
    setUsers(function(prev) { return prev.map(function(x) { return x.email === u.email ? Object.assign({}, x, { _status: current === "pasif" ? "aktif" : "pasif" }) : x; }); });
  }

  function profileColor(key) {
    if (!key || key === "default") return "#888899";
    if (key.indexOf("baslangic") === 0) return "#6366f1";
    if (key.indexOf("orta") === 0) return "#d4a853";
    return "#10a37f";
  }

  function profileLabel(key) {
    var labels = {
      "default": "Genel",
      "baslangic_kariyer": "Başlangıç·K",
      "baslangic_is": "Başlangıç·İ",
      "baslangic_freelance": "Başlangıç·F",
      "orta_kariyer": "Orta·K",
      "orta_is": "Orta·İ",
      "ileri_kariyer": "İleri·K"
    };
    return labels[key] || key;
  }

  function userProfileKey(u) {
    if (!u) return "default";
    if (u.profile_key) return u.profile_key;
    if (u.profileKey) return u.profileKey;
    if (u.profile && u.profile.profileKey) return u.profile.profileKey;
    return "default";
  }

  function updateUserProfile(email, profileKey) {
    if (typeof fetch === "undefined") return;
    fetch(USERS_API, {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify({ action: "admin-update", user: { email: email, profileKey: profileKey } })
    })
    .then(function(r) { return r.json(); })
    .then(function() {
      setUsers(function(prev) {
        return prev.map(function(u) {
          return u.email === email ? Object.assign({}, u, { profile_key: profileKey }) : u;
        });
      });
    })
    .catch(function() {});
  }

  return (

    <div style={{ minHeight:"100vh", background:"#070711", color:"#fff", fontFamily:"'Inter',sans-serif" }}>

      <div style={{ background:"rgba(7,7,17,0.98)", borderBottom:"1px solid rgba(255,255,255,0.08)", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:60, position:"sticky", top:0, zIndex:100 }}>

        <div style={{ display:"flex", alignItems:"center", gap:16 }}>

          <div style={{ fontSize:20, fontWeight:800, color:"#d4a853" }}>⚡ Admin</div>

          <div style={{ width:1, height:24, background:"rgba(255,255,255,0.1)" }} />

          <div style={{ fontSize:13, color:"#888899" }}>AI Certification Academy</div>

          {fullAccess && <span style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.4)", borderRadius:6, padding:"2px 10px", fontSize:11, color:"#ef4444", fontWeight:700 }}>TAM YETKİ</span>}

        </div>

        <button onClick={props.onLogout} style={{ background:"rgba(239,68,68,0.1)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, padding:"8px 16px", fontSize:13, cursor:"pointer", fontWeight:600 }}>Çıkış</button>

      </div>

      <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"0 24px", overflowX:"auto" }}>

        {tabs.map(function(t) {

          return (

            <button key={t.id} onClick={function() { setActiveTab(t.id); }}

              style={{ background:"transparent", border:"none", borderBottom: activeTab===t.id ? "2px solid #d4a853" : "2px solid transparent", color: activeTab===t.id ? "#d4a853" : "#666677", padding:"16px 20px", fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.2s" }}>

              {t.label}

            </button>

          );

        })}

      </div>

      <div style={{ padding:24, maxWidth:1300, margin:"0 auto" }}>

        {activeTab === "overview" && (

          <div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:28 }}>

              {[

                { label:"Toplam Üye", val:totalUsers, color:"#d4a853", icon:"👥" },

                { label:"Bugün Kayıt", val:todayCount, color:"#10a37f", icon:"🆕" },

                { label:"Bu Hafta", val:weekCount, color:"#6366f1", icon:"📅" },

                { label:"Pro Üye", val:proCount, color:"#d4a853", icon:"⭐" },

                { label:"Business Üye", val:bizCount, color:"#10a37f", icon:"💼" },

                { label:"Tahmini Gelir", val:"$"+totalRevenue, color:"#10a37f", icon:"💰" },

                { label:"Ortalama XP", val:avgXP, color:"#6366f1", icon:"⚡" },

              ].map(function(s) {

                return (

                  <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"20px 18px" }}>

                    <div style={{ fontSize:20, marginBottom:8 }}>{s.icon}</div>

                    <div style={{ fontSize:11, color:"#666677", marginBottom:6, textTransform:"uppercase", letterSpacing:1 }}>{s.label}</div>

                    <div style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.val}</div>

                  </div>

                );

              })}

            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:24 }}>

                <div style={{ fontSize:14, fontWeight:700, marginBottom:20, color:"#fff" }}>Plan Dağılımı</div>

                {[["Starter", starterCount, "#6366f1"], ["Pro", proCount, "#d4a853"], ["Business", bizCount, "#10a37f"]].map(function(item) {

                  var pct = totalUsers > 0 ? Math.round((item[1]/totalUsers)*100) : 0;

                  return (

                    <div key={item[0]} style={{ marginBottom:16 }}>

                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>

                        <span style={{ fontSize:13, color:item[2], fontWeight:600 }}>{item[0]}</span>

                        <span style={{ fontSize:13, color:"#888899" }}>{item[1]} kişi ({pct}%)</span>

                      </div>

                      <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden" }}>

                        <div style={{ width:pct+"%", height:"100%", background:item[2], borderRadius:4, transition:"width 0.8s ease" }} />

                      </div>

                    </div>

                  );

                })}

              </div>

              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:24 }}>

                <div style={{ fontSize:14, fontWeight:700, marginBottom:20, color:"#fff" }}>Son Kayıt Olanlar</div>

                {users.slice(0,5).map(function(u, i) {

                  var pn = planName(u);

                  var pc = planColor(pn);

                  return (

                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>

                      <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(212,168,83,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#d4a853", fontSize:14, flexShrink:0 }}>

                        {(u.name || "?")[0].toUpperCase()}

                      </div>

                      <div style={{ flex:1, minWidth:0 }}>

                        <div style={{ fontSize:13, fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.name || "-"}</div>

                        <div style={{ fontSize:11, color:"#666677", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>

                      </div>

                      <span style={{ background:pc+"22", color:pc, border:"1px solid "+pc+"44", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700, flexShrink:0 }}>{pn}</span>

                    </div>

                  );

                })}

              </div>

            </div>

          </div>

        )}

        {activeTab === "users" && (

          <div>

            <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>

              <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="İsim veya email ara..." style={{ flex:1, minWidth:200, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:13, outline:"none" }} />

              {["Tümü","Starter","Pro","Business"].map(function(p) {

                return (

                  <button key={p} onClick={function() { setPlanFilter(p); }}

                    style={{ background: planFilter===p ? "rgba(212,168,83,0.15)" : "rgba(255,255,255,0.04)", border:"1px solid "+(planFilter===p ? "rgba(212,168,83,0.4)" : "rgba(255,255,255,0.08)"), borderRadius:10, padding:"10px 16px", color: planFilter===p ? "#d4a853" : "#888899", fontSize:13, cursor:"pointer", fontWeight: planFilter===p ? 700 : 400 }}>

                    {p}

                  </button>

                );

              })}

              <div style={{ fontSize:13, color:"#666677", display:"flex", alignItems:"center" }}>{filteredUsers.length} kullanıcı</div>

            </div>

            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, overflow:"hidden", overflowX:"auto" }}>

              <div style={{ overflowX:"auto" }}>

                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>

                  <thead style={{ position:"sticky", top:0, background:"#0d0d1f", zIndex:10 }}>

                    <tr style={{ background:"#0d0d1f" }}>

                      {["#","Ad Soyad","Email","Durum","Plan","Profil","XP","İlerleme","Kayıt","Son Giriş","İşlem"].map(function(h) {
                        var mw = h==="#"?32:h==="Ad Soyad"?140:h==="Email"?180:h==="Durum"?80:h==="Plan"?90:h==="Profil"?160:h==="XP"?50:h==="İlerleme"?120:h==="Kayıt"?130:h==="Son Giriş"?130:200;
                        return <th key={h} style={{ padding:"13px 14px", color:"#555577", fontWeight:600, textAlign:"left", whiteSpace:"nowrap", fontSize:11, textTransform:"uppercase", letterSpacing:1, minWidth:mw }}>{h}</th>;

                      })}

                    </tr>

                  </thead>

                  <tbody>

                    {filteredUsers.map(function(u, i) {

                      var pn = planName(u);

                      var pc = planColor(pn);

                      var prog = u.progress || {};

                      var done = Object.keys(prog).filter(function(k) { return prog[k] === true || prog[k] === "done"; }).length;
                      var st = getUserStatus(u);
                      return (

                        <tr key={(u.email||"")+i} style={{ borderTop:"1px solid rgba(255,255,255,0.05)", opacity: st === "pasif" ? 0.5 : 1 }}>

                          <td style={{ padding:"12px 14px", color:"#444466", minWidth:32 }}>{i+1}</td>

                          <td style={{ padding:"12px 14px", minWidth:140 }}>

                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>

                              <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(212,168,83,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:"#d4a853", fontSize:13, flexShrink:0 }}>

                                {(u.name||"?")[0].toUpperCase()}

                              </div>

                              <span style={{ color:"#fff", fontWeight:600 }}>{u.name||"-"}</span>

                            </div>

                          </td>

                          <td style={{ padding:"12px 14px", color:"#9999b8", minWidth:180 }}>{u.email||"-"}</td>
                          <td style={{ padding:"12px 14px", minWidth:80 }}>
                            {st === "pasif" ? (
                              <span style={{ background:"rgba(239,68,68,0.1)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.25)", borderRadius:20, padding:"3px 8px", fontSize:10, fontWeight:700, display:"inline-flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>● Pasif</span>
                            ) : (
                              <span style={{ background:"rgba(16,163,127,0.15)", color:"#10a37f", border:"1px solid rgba(16,163,127,0.3)", borderRadius:20, padding:"3px 8px", fontSize:10, fontWeight:700, display:"inline-flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>● Aktif</span>
                            )}
                          </td>
                          <td style={{ padding:"12px 14px", minWidth:90 }}>

                            <span style={{ background:pc+"22", color:pc, border:"1px solid "+pc+"44", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700 }}>{pn}</span>

                          </td>

                          <td style={{ padding:"12px 14px", minWidth:160 }}>
                            {fullAccess ? (
                              <select
                                value={userProfileKey(u)}
                                onChange={function(e) { updateUserProfile(u.email, e.target.value); }}
                                style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"4px 8px", color:"#fff", fontSize:11, cursor:"pointer" }}>
                                <option value="default">Genel</option>
                                <option value="baslangic_kariyer">Başlangıç - Kariyer</option>
                                <option value="baslangic_is">Başlangıç - İş</option>
                                <option value="baslangic_freelance">Başlangıç - Freelance</option>
                                <option value="orta_kariyer">Orta - Kariyer</option>
                                <option value="orta_is">Orta - İş</option>
                                <option value="ileri_kariyer">İleri - Kariyer</option>
                              </select>
                            ) : (
                              (function() {
                                var pk = userProfileKey(u);
                                var col = profileColor(pk);
                                return <span style={{ background:col+"22", color:col, border:"1px solid "+col+"44", borderRadius:20, padding:"4px 10px", fontSize:11, fontWeight:700 }}>{profileLabel(pk)}</span>;
                              })()
                            )}
                          </td>

                          <td style={{ padding:"12px 14px", color:"#d4a853", fontWeight:700, minWidth:50 }}>{u.xp||0}</td>

                          <td style={{ padding:"12px 14px", minWidth:120 }}>

                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>

                              <div style={{ width:64, height:5, background:"rgba(255,255,255,0.08)", borderRadius:3, overflow:"hidden" }}>

                                <div style={{ width:Math.min(100,(done/28)*100)+"%", height:"100%", background:"linear-gradient(90deg,#d4a853,#f0c060)", borderRadius:3 }} />

                              </div>

                              <span style={{ fontSize:11, color:"#666677" }}>{done}/28</span>

                            </div>

                          </td>

                          <td style={{ padding:"12px 14px", color:"#666677", whiteSpace:"nowrap", minWidth:130 }}>{fmt(u.created_at||u.createdAt)}</td>

                          <td style={{ padding:"12px 14px", color:"#666677", whiteSpace:"nowrap", minWidth:130 }}>{fmt(u.last_seen||u.lastSeen)}</td>

                          <td style={{ padding:"12px 14px", minWidth:200 }}>

                            <div style={{ display:"flex", flexDirection:"row", gap:6, alignItems:"center", flexWrap:"nowrap" }}>
                              <button onClick={function() { setSelectedUser(u); }} style={{ background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.3)", borderRadius:7, padding:"5px 10px", color:"#a5b4fc", fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}>Detay</button>

                              {fullAccess && <button onClick={function() { enterAsUser(u); }} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:7, padding:"5px 10px", color:"#fca5a5", fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}>Giriş Yap</button>}
                              {fullAccess && (
                                st === "pasif"
                                  ? <button onClick={function() { toggleStatus(u); }} style={{ background:"rgba(16,163,127,0.1)", border:"1px solid rgba(16,163,127,0.25)", borderRadius:7, padding:"5px 10px", color:"#6ee7b7", fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}>Aktif Yap</button>
                                  : <button onClick={function() { toggleStatus(u); }} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:7, padding:"5px 10px", color:"#fca5a5", fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }}>Pasif Yap</button>
                              )}
                            </div>
                          </td>

                        </tr>

                      );

                    })}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        )}

        {activeTab === "revenue" && (

          <div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14, marginBottom:28 }}>

              {[

                { label:"Aylık Tahmini Gelir", val:"$"+totalRevenue, sub:"Tüm aktif üyeler", color:"#10a37f" },

                { label:"Yıllık Projeksiyon", val:"$"+(totalRevenue*12), sub:"Mevcut üye bazında", color:"#d4a853" },

                { label:"Starter Geliri", val:"$"+(starterCount*29), sub:starterCount+" üye × $29", color:"#6366f1" },

                { label:"Pro Geliri", val:"$"+(proCount*79), sub:proCount+" üye × $79", color:"#d4a853" },

                { label:"Business Geliri", val:"$"+(bizCount*199), sub:bizCount+" üye × $199", color:"#10a37f" },

              ].map(function(s) {

                return (

                  <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"22px 20px" }}>

                    <div style={{ fontSize:11, color:"#555577", marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>{s.label}</div>

                    <div style={{ fontSize:30, fontWeight:800, color:s.color, marginBottom:4 }}>{s.val}</div>

                    <div style={{ fontSize:12, color:"#444466" }}>{s.sub}</div>

                  </div>

                );

              })}

            </div>

            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:24 }}>

              <div style={{ fontSize:14, fontWeight:700, color:"#fff", marginBottom:6 }}>💡 Büyüme Hedefi</div>

              <div style={{ fontSize:13, color:"#888899", lineHeight:1.7 }}>

                10 Business üye → <span style={{ color:"#10a37f", fontWeight:700 }}>$1,990/ay</span> · 

                50 Pro üye → <span style={{ color:"#d4a853", fontWeight:700 }}>$3,950/ay</span> · 

                100 Starter üye → <span style={{ color:"#6366f1", fontWeight:700 }}>$2,900/ay</span>

              </div>

            </div>

          </div>

        )}

        {activeTab === "platform" && (

          <div>

            {!fullAccess ? (

              <div style={{ maxWidth:420, margin:"60px auto", textAlign:"center" }}>

                <div style={{ fontSize:48, marginBottom:16 }}>🔐</div>

                <div style={{ fontSize:20, fontWeight:700, color:"#fff", marginBottom:8 }}>Tam Yetki Gerekli</div>

                <div style={{ fontSize:14, color:"#888899", marginBottom:28, lineHeight:1.6 }}>Platform yönetimi için ek güvenlik doğrulaması gerekiyor. Bu alan kullanıcı verilerine tam erişim sağlar.</div>

                <input type="password" value={fullAccessPass} onChange={function(e) { setFullAccessPass(e.target.value); }} onKeyDown={function(e) { if(e.key==="Enter") unlockFullAccess(); }} placeholder="Süper admin şifresi" style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid "+(fullAccessErr?"#ef4444":"rgba(255,255,255,0.12)"), borderRadius:12, padding:"14px 16px", color:"#fff", fontSize:14, outline:"none", marginBottom:8, boxSizing:"border-box" }} />

                {fullAccessErr && <div style={{ color:"#ef4444", fontSize:12, marginBottom:12 }}>{fullAccessErr}</div>}

                <button onClick={unlockFullAccess} style={{ width:"100%", background:"linear-gradient(135deg,#d4a853,#f0c060)", color:"#08080f", border:"none", borderRadius:12, padding:"14px", fontSize:15, fontWeight:700, cursor:"pointer" }}>Doğrula ve Giriş</button>

                

              </div>

            ) : (

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:24 }}>

                  <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:6 }}>📢 Duyuru Gönder</div>

                  <div style={{ fontSize:12, color:"#666677", marginBottom:16 }}>Tüm kullanıcılara bildirim mesajı gönder</div>

                  <textarea value={announcement} onChange={function(e) { setAnnouncement(e.target.value); }} placeholder="Duyuru metni..." rows={4} style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 14px", color:"#fff", fontSize:13, outline:"none", resize:"vertical", boxSizing:"border-box", marginBottom:12 }} />

                  <button onClick={function() { setAnnouncementSent(true); setTimeout(function() { setAnnouncementSent(false); setAnnouncement(""); }, 2000); }} style={{ background:"linear-gradient(135deg,#d4a853,#f0c060)", color:"#08080f", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>

                    {announcementSent ? "✅ Gönderildi!" : "Gönder"}

                  </button>

                </div>

                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:24 }}>

                  <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:6 }}>🎭 Kullanıcı Olarak Giriş</div>

                  <div style={{ fontSize:12, color:"#666677", marginBottom:16 }}>Herhangi bir kullanıcının hesabına giriş yap (test/destek)</div>

                  <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:240, overflowY:"auto" }}>

                    {users.slice(0,8).map(function(u, i) {

                      var pn = planName(u);

                      var pc = planColor(pn);

                      return (

                        <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.06)" }}>

                          <div>

                            <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{u.name||"-"}</div>

                            <div style={{ fontSize:11, color:"#666677" }}>{u.email}</div>

                          </div>

                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>

                            <span style={{ background:pc+"22", color:pc, borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700 }}>{pn}</span>

                            <button onClick={function() { enterAsUser(u); }} style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:7, padding:"5px 10px", color:"#fca5a5", fontSize:11, cursor:"pointer" }}>Giriş</button>

                          </div>

                        </div>

                      );

                    })}

                  </div>

                </div>

                <div style={{ background:"rgba(239,68,68,0.04)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:16, padding:24 }}>

                  <div style={{ fontSize:15, fontWeight:700, color:"#ef4444", marginBottom:6 }}>⚠️ Tehlikeli Alan</div>

                  <div style={{ fontSize:12, color:"#888899", marginBottom:16 }}>Bu işlemler geri alınamaz</div>

                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

                    <button style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"11px 16px", color:"#fca5a5", fontSize:13, cursor:"pointer", textAlign:"left" }}>🗑️ Tüm cache'i temizle</button>

                    <button style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"11px 16px", color:"#fca5a5", fontSize:13, cursor:"pointer", textAlign:"left" }}>📊 Test kullanıcılarını sil</button>

                  </div>

                </div>

                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:24 }}>

                  <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:6 }}>📈 Platform Durumu</div>

                  <div style={{ display:"flex", flexDirection:"column", gap:12, marginTop:16 }}>

                    {[["🟢 Proxy API","Aktif"],["🟢 Supabase DB","Bağlı"],["🟢 Lemon Squeezy","Aktif"],["🟡 Lemon Squeezy Store","İncelemede"]].map(function(item) {

                      return (

                        <div key={item[0]} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>

                          <span style={{ fontSize:13, color:"#ccccdd" }}>{item[0]}</span>

                          <span style={{ fontSize:12, color: item[1]==="Aktif"||item[1]==="Bağlı" ? "#10a37f" : "#f59e0b", fontWeight:600 }}>{item[1]}</span>

                        </div>

                      );

                    })}

                  </div>

                </div>

                <CouponPanel />

                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:24, gridColumn:"1 / -1" }}>

                  <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:6 }}>🤖 Toplu Ders Üretimi</div>

                  <div style={{ fontSize:12, color:"#666677", marginBottom:16 }}>Seçili araç ve profil için AI ile ders kartları üret, Vercel'e kaydet</div>

                  <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>

                    <select value={selectedTool} onChange={function(e) { setSelectedTool(e.target.value); }} disabled={batchRunning} style={{ flex:1, minWidth:160, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"10px 12px", color:"#fff", fontSize:13, outline:"none" }}>
                      <option value="Tümü" style={{ color:"#070711", backgroundColor:"#f0f0f5" }}>Tüm Araçlar</option>
                      {TOOLS_LIST.map(function(t) { return <option key={t} value={t} style={{ color:"#070711", backgroundColor:"#f0f0f5" }}>{t}</option>; })}
                    </select>

                    <select value={selectedProfile} onChange={function(e) { setSelectedProfile(e.target.value); }} disabled={batchRunning} style={{ flex:1, minWidth:160, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"10px 12px", color:"#fff", fontSize:13, outline:"none" }}>
                      <option value="Tümü" style={{ color:"#070711", backgroundColor:"#f0f0f5" }}>Tüm Profiller</option>
                      {Object.keys(PROFILES_MAP).map(function(p) { return <option key={p} value={p} style={{ color:"#070711", backgroundColor:"#f0f0f5" }}>{p}</option>; })}
                    </select>

                    <button onClick={runBatch} disabled={batchRunning} style={{ background: batchRunning ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#d4a853,#f0c060)", color: batchRunning ? "#888899" : "#08080f", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor: batchRunning ? "not-allowed" : "pointer" }}>
                      {batchRunning ? "Çalışıyor..." : "Başlat"}
                    </button>

                  </div>

                  {batchRunning && (
                    <div style={{ marginTop:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <span style={{ fontSize:13, color:"#ccccdd" }}>{batchProgress}</span>
                        <span style={{ fontSize:13, color:"#d4a853", fontWeight:700, fontFamily:"monospace" }}>{batchProgressPct}%</span>
                      </div>
                      <div style={{ height:8, background:"rgba(255,255,255,0.07)", borderRadius:100, overflow:"hidden" }}>
                        <div style={{ width:batchProgressPct+"%", height:"100%", background:"linear-gradient(90deg,#d4a853,#f0c060)", borderRadius:100, transition:"width 0.3s ease" }} />
                      </div>
                      <div style={{ fontSize:11, color:"#555577", marginTop:6 }}>
                        {batchCompleted} / {batchTotal} tamamlandı
                      </div>
                    </div>
                  )}

                  {!batchRunning && batchProgress && (
                    <div style={{ marginTop:12, background:"rgba(16,163,127,0.08)", border:"1px solid rgba(16,163,127,0.2)", borderRadius:10, padding:"10px 16px", fontSize:13, color:"#6ee7b7" }}>
                      {batchProgress}
                    </div>
                  )}

                  {batchLogs.length > 0 && (
                    <div style={{ marginTop:16, maxHeight:400, overflowY:"auto", background:"rgba(0,0,0,0.3)", borderRadius:8 }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, color:"#ccccdd" }}>
                        <thead style={{ position:"sticky", top:0, background:"#0d0d1f", zIndex:1 }}>
                          <tr>
                            {["Tarih","Başlangıç","Süre","Tetikleyen","Durum","Başarı/Hata","Detay"].map(function(h) {
                              return <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#888899", textTransform:"uppercase", letterSpacing:0.5, borderBottom:"1px solid rgba(255,255,255,0.1)" }}>{h}</th>;
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {batchLogs.map(function(log, i) {
                            var results = log.results || [];
                            var duration = log.finished_at && log.started_at
                              ? Math.round((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000) + "s"
                              : "⏳";
                            var statusColor = log.status === "success" ? "#10a37f" : log.status === "partial" ? "#f59e0b" : log.status === "running" ? "#6366f1" : "#ef4444";
                            return (
                              <React.Fragment key={i}>
                                <tr style={{ borderTop:"2px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.02)" }}>
                                  <td style={{ padding:"10px 14px", color:"#fff", fontWeight:700 }}>{log.batch_date}</td>
                                  <td style={{ padding:"10px 14px", color:"#888899" }}>{log.started_at ? new Date(log.started_at).toLocaleTimeString("tr-TR") : "-"}</td>
                                  <td style={{ padding:"10px 14px", color:"#888899", fontFamily:"monospace" }}>{duration}</td>
                                  <td style={{ padding:"10px 14px", color:"#888899" }}>{log.triggered_by || "cron"}</td>
                                  <td style={{ padding:"10px 14px" }}>
                                    <span style={{ background:statusColor+"22", color:statusColor, border:"1px solid "+statusColor+"44", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>
                                      {log.status === "success" ? "✅ Başarılı" : log.status === "partial" ? "⚠️ Kısmi" : log.status === "running" ? "⏳ Çalışıyor" : "❌ Başarısız"}
                                    </span>
                                  </td>
                                  <td style={{ padding:"10px 14px", color:"#d4a853", fontWeight:700 }}>{log.success_count || 0} ✅ / {log.fail_count || 0} ❌</td>
                                  <td style={{ padding:"10px 14px", color:"#555577", fontSize:11 }}>{results.length} kayıt</td>
                                </tr>
                                {results.map(function(r, j) {
                                  return (
                                    <tr key={i+"-"+j} style={{ borderTop:"1px solid rgba(255,255,255,0.04)", background:"rgba(255,255,255,0.01)" }}>
                                      <td style={{ padding:"6px 14px 6px 28px", color:"#555577", fontSize:11 }} colSpan={2}>└ {r.tool}</td>
                                      <td style={{ padding:"6px 14px", color:"#555577", fontSize:11 }}></td>
                                      <td style={{ padding:"6px 14px", color:"#555577", fontSize:11 }}></td>
                                      <td style={{ padding:"6px 14px" }}>
                                        <span style={{ background: r.status==="ok" ? "rgba(16,163,127,0.1)" : "rgba(239,68,68,0.1)", color: r.status==="ok" ? "#10a37f" : "#ef4444", borderRadius:20, padding:"2px 8px", fontSize:10 }}>
                                          {r.status === "ok" ? "✅" : "❌"} {r.status}
                                        </span>
                                      </td>
                                      <td style={{ padding:"6px 14px", color:"#888899", fontSize:11 }}>{r.profile}</td>
                                      <td style={{ padding:"6px 14px", color:"#d4a853", fontSize:11, fontFamily:"monospace" }}>{r.count} kart</td>
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>

              </div>

            )}

          </div>

        )}

      </div>

      {selectedUser && (

        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }} onClick={function() { setSelectedUser(null); }}>

          <div style={{ background:"#0d0d1f", border:"1px solid rgba(255,255,255,0.12)", borderRadius:20, padding:32, maxWidth:460, width:"100%", boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }} onClick={function(e) { e.stopPropagation(); }}>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>

              <div style={{ display:"flex", alignItems:"center", gap:14 }}>

                <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(212,168,83,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#d4a853", fontSize:22 }}>

                  {(selectedUser.name||"?")[0].toUpperCase()}

                </div>

                <div>

                  <div style={{ fontSize:18, fontWeight:700, color:"#fff" }}>{selectedUser.name||"-"}</div>

                  <div style={{ fontSize:13, color:"#888899" }}>{selectedUser.email}</div>

                </div>

              </div>

              <button onClick={function() { setSelectedUser(null); }} style={{ background:"transparent", border:"none", color:"#666677", fontSize:22, cursor:"pointer" }}>✕</button>

            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>

              {[

                { label:"Plan", val:planName(selectedUser), color:planColor(planName(selectedUser)) },

                { label:"XP", val:(selectedUser.xp||0)+" XP", color:"#d4a853" },

                { label:"Streak", val:(selectedUser.streak||0)+" gün", color:"#10a37f" },

                { label:"Kayıt", val:fmt(selectedUser.created_at||selectedUser.createdAt), color:"#6366f1" },

                { label:"Son Giriş", val:fmt(selectedUser.last_seen||selectedUser.lastSeen), color:"#888899" },

                { label:"İlerleme", val:Object.keys(selectedUser.progress||{}).length+"/28 ders", color:"#d4a853" },

              ].map(function(item) {

                return (

                  <div key={item.label} style={{ background:"rgba(255,255,255,0.03)", borderRadius:12, padding:"14px 16px" }}>

                    <div style={{ fontSize:11, color:"#555577", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>{item.label}</div>

                    <div style={{ fontSize:15, fontWeight:700, color:item.color }}>{item.val}</div>

                  </div>

                );

              })}

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

function Login(props) {
  var [email, setEmail] = useState("");
  var [pass, setPass] = useState("");
  var [err, setErr] = useState("");
  var [loading, setLoading] = useState(false);
  var [showAdmin, setShowAdmin] = useState(false);

  async function submit() {
    if (!email || !pass) { setErr("Tüm alanlari doldurun"); return; }
    if (pass.length < 6) { setErr("Şifre en az 6 karakter"); return; }
    setLoading(true);

    function normalLogin() {
      setTimeout(function() {
        setLoading(false);
        var existing = getUserByEmail(email);
        if (!existing) {
          setErr("Bu email ile kayıtlı hesap bulunamadı. Lütfen önce kayıt ol.");
          return;
        }
        // Basit şifre kontrolü - gerçek uygulamada Supabase Auth kullanılır
        if (pass.length < 6) {
          setErr("Şifre hatali.");
          return;
        }
        var isAdminL = existing.email === ADMIN_EMAIL;
        var isTestL = existing.email === "test@aicert.com" || existing.email === "testpro@aicert.com" || existing.email === "testbiz@aicert.com";
        if (!isAdminL && !isTestL && lsGet("user-status-" + existing.email) === "pasif") {
          setErr("Hesabınız askıya alınmıştır. Destek için info@cert-academy.ai adresine yazın.");
          return;
        }
        saveUser(existing);
        props.onDone(existing);
      }, 1000);
    }

    if (typeof fetch === "undefined") { normalLogin(); return; }
    fetch("https://ai-proxy-two-pi.vercel.app/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.toLowerCase().trim(), pass: pass })
    })
      .then(function(r) {
        if (r.status === 401) {
          setLoading(false);
          setErr("Hatalı e-posta veya şifre");
          return null;
        }
        return r.json();
      })
      .then(function(data) {
        if (!data) return;
        if (data.ok === true && data.token) {
          setAuthToken(data.token);
          if (data.user && data.user.admin) { setLoading(false); setShowAdmin(true); return; }
          var PLAN_MAP = { "Starter": PLANS[0], "Pro": PLANS[1], "Business": PLANS[2] };
          var du = data.user || {};
          var loggedUser = {
            name: du.name || "",
            email: (du.email || email).toLowerCase().trim(),
            plan: PLAN_MAP[du.plan] || (du.plan && du.plan.name ? du.plan : PLANS[0]),
            profileKey: du.profileKey || "default",
            profile: { profileKey: du.profileKey || "default" },
            profile_key: du.profileKey || "default",
            xp: du.xp || 0,
            streak: du.streak || 0,
            progress: du.progress || {},
            scores: du.scores || {}
          };
          saveUser(loggedUser);
          setLoading(false);
          props.onLogin && props.onLogin(loggedUser);
          if (props.onDone) props.onDone(loggedUser);
          return;
        }
        if (data.ok === false) {
          setErr("Hatalı e-posta veya şifre");
          setLoading(false);
          return;
        }
        normalLogin();
      })
      .catch(function() {
        normalLogin();
      });
  }

  if (showAdmin) {
    return <AdminPanel onLogout={function() { setShowAdmin(false); setEmail(""); setPass(""); }} />;
  }

  return (
    <div style={{ minHeight:"100vh", background:BG, color:"#fff", fontFamily:FONT, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:40, fontWeight:800, color:GOLD }}>AI</div>
          <div style={{ fontSize:17, fontWeight:600 }}>Certification Academy</div>
        </div>
        <div style={{ background:CARD_BG, border:"1px solid "+CARD_BORDER, borderRadius:16, padding:28 }}>
          <h2 style={{ color:"#fff", fontWeight:700, marginBottom:20, fontSize:19 }}>Giriş Yap</h2>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", color:"#888899", fontSize:12, marginBottom:5 }}>Email</label>
            <input type="email" value={email} onChange={function(e) { setEmail(e.target.value); }}
              style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 14px", color:"#fff", fontSize:15, outline:"none", boxSizing:"border-box" }} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", color:"#888899", fontSize:12, marginBottom:5 }}>Şifre</label>
            <input type="password" value={pass} onChange={function(e) { setPass(e.target.value); }}
              style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 14px", color:"#fff", fontSize:15, outline:"none", boxSizing:"border-box" }} />
          </div>
          {err && <div style={{ color:"#ef4444", fontSize:12, marginBottom:12 }}>{err}</div>}
          <button onClick={submit} disabled={loading}
            style={{ width:"100%", background: loading ? "#444" : "linear-gradient(135deg,#d4a853,#f0c060)", color:"#08080f", border:"none", borderRadius:10, padding:"13px 0", fontSize:15, fontWeight:700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Kontrol ediliyor..." : "Giriş Yap"}
          </button>
          <p style={{ textAlign:"center", marginTop:16, fontSize:12, color:"#555577" }}>
            Hesabın yok mu?
            <button onClick={props.onRegister} style={{ background:"transparent", border:"none", color:GOLD, cursor:"pointer", fontSize:12, marginLeft:4 }}>Kayıt Ol</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── TEAM MANAGEMENT ─────────────────────────────────────────────────────────
function TeamPanel(props) {
  var user = props.user;
  var [team, setTeam] = useState(null);
  var [loading, setLoading] = useState(true);
  var [inviteEmail, setInviteEmail] = useState("");
  var [inviteMsg, setInviteMsg] = useState("");
  var [inviteLink, setInviteLink] = useState("");

  useEffect(function() {
    loadTeam(user.email).then(function(t) {
      if (!t) {
        var newTeam = createTeam(user);
        setTeam(newTeam);
      } else {
        setTeam(t);
      }
      setLoading(false);
    });
  }, []);

  function sendInvite() {
    if (!inviteEmail || inviteEmail.indexOf("@") < 0) { setInviteMsg("Geçerli email girin"); return; }
    if (!team) return;
    var activeMembers = team.members.filter(function(m) { return m.status === "active"; }).length;
    if (activeMembers >= team.limit) { setInviteMsg("Takım limiti doldu (maks. " + team.limit + " kişi)"); return; }
    var existingMember = team.members.find(function(m) { return m.email === inviteEmail; });
    if (existingMember) { setInviteMsg("Bu kullanıcı zaten takımda"); return; }
    var code = generateInviteCode(team.id, inviteEmail);
    var newMember = { email: inviteEmail, name: "Davet Bekleniyor", role:"member", status:"pending", inviteCode: code, invitedAt: Date.now() };
    var updatedTeam = Object.assign({}, team, { members: team.members.concat([newMember]) });
    setTeam(updatedTeam);
    saveTeam(user.email, updatedTeam);
    var link = window.location.origin + "?invite=" + code;
    setInviteLink(link);
    setInviteMsg("Davet linki oluşturuldu!");
    setInviteEmail("");
  }

  function removeMember(email) {
    if (email === user.email) return;
    var updatedTeam = Object.assign({}, team, { members: team.members.filter(function(m) { return m.email !== email; }) });
    setTeam(updatedTeam);
    saveTeam(user.email, updatedTeam);
  }

  function copyLink() {
    if (inviteLink) {
      try { navigator.clipboard.writeText(inviteLink); } catch(e) {}
      setInviteMsg("Link kopyalandı!");
    }
  }

  if (loading) return <div style={{ padding:40, textAlign:"center", color:"#666688" }}>Yükleniyor...</div>;
  if (!team) return null;

  var activeCount = team.members.filter(function(m) { return m.status === "active"; }).length;
  var pendingCount = team.members.filter(function(m) { return m.status === "pending"; }).length;
  var remaining = team.limit - activeCount;

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14, marginBottom:28 }}>
        {[
          { label:"Aktif Üye",   val:activeCount,  color:"#10a37f" },
          { label:"Davet Bekleyen", val:pendingCount, color:GOLD },
          { label:"Boş Slot",    val:remaining,    color:"#6366f1" },
          { label:"Limit",       val:team.limit,   color:"#888899" },
        ].map(function(s) {
          return (
            <div key={s.label} style={{ background:CARD_BG, border:"1px solid "+CARD_BORDER, borderRadius:14, padding:16, textAlign:"center" }}>
              <div style={{ fontSize:30, fontWeight:800, color:s.color, fontFamily:FONT_MONO }}>{s.val}</div>
              <div style={{ fontSize:11, color:"#555577", marginTop:3 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {remaining > 0 ? (
        <div style={{ background:CARD_BG, border:"1px solid "+CARD_BORDER, borderRadius:14, padding:20, marginBottom:24 }}>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16, color:GOLD }}>Kullanıcı Davet Et</h3>
          <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
            <input value={inviteEmail} onChange={function(e) { setInviteEmail(e.target.value); }}
              placeholder="örnek@şirket.com" type="email"
              style={{ flex:1, minWidth:200, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:13, outline:"none" }} />
            <button onClick={sendInvite}
              style={{ background:"linear-gradient(135deg,#d4a853,#f0c060)", color:"#08080f", border:"none", borderRadius:10, padding:"10px 20px", fontWeight:700, cursor:"pointer", fontSize:13 }}>
              Davet Gönder
            </button>
          </div>
          {inviteMsg && (
            <div style={{ fontSize:13, color: inviteMsg.indexOf("doldu") >= 0 || inviteMsg.indexOf("zaten") >= 0 ? "#ef4444" : "#10a37f", marginBottom:8 }}>{inviteMsg}</div>
          )}
          {inviteLink && (
            <div style={{ background:"rgba(16,163,127,0.08)", border:"1px solid rgba(16,163,127,0.3)", borderRadius:10, padding:12 }}>
              <div style={{ fontSize:11, color:"#10a37f", marginBottom:6 }}>Davet Linki - Bu linki kullanıcıya gönder:</div>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                <code style={{ flex:1, fontSize:10, color:"#888899", wordBreak:"break-all" }}>{inviteLink}</code>
                <button onClick={copyLink} style={{ background:"rgba(212,168,83,0.15)", border:"1px solid rgba(212,168,83,0.3)", borderRadius:8, padding:"6px 12px", color:GOLD, cursor:"pointer", fontSize:12 }}>Kopyala</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:12, padding:16, marginBottom:24, textAlign:"center" }}>
          <div style={{ color:"#ef4444", fontWeight:700, marginBottom:4 }}>Takım Limiti Doldu</div>
          <div style={{ color:"#888899", fontSize:13 }}>5 kullanıcı limitine ulaşıldı. Üye çıkararak yer açabilirsiniz.</div>
        </div>
      )}

      <div>
        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Takım Üyeleri</h3>
        {team.members.map(function(m, i) {
          return (
            <div key={i} style={{ background:CARD_BG, border:"1px solid "+CARD_BORDER, borderRadius:12, padding:"14px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background: m.role === "admin" ? "rgba(212,168,83,0.2)" : "rgba(99,102,241,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color: m.role === "admin" ? GOLD : "#a5b4fc", flexShrink:0 }}>
                {m.name[0]}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13 }}>{m.name}</div>
                <div style={{ fontSize:11, color:"#555577" }}>{m.email}</div>
              </div>
              <div style={{ fontSize:11, color:"#888899" }}>{m.role === "admin" ? "Admin" : "Üye"}</div>
              <div style={{ fontSize:11, color: m.status === "active" ? "#10a37f" : GOLD, background: m.status === "active" ? "rgba(16,163,127,0.1)" : "rgba(212,168,83,0.1)", border:"1px solid "+(m.status==="active"?"rgba(16,163,127,0.3)":"rgba(212,168,83,0.3)"), borderRadius:20, padding:"2px 9px" }}>
                {m.status === "active" ? "Aktif" : "Davet Bekleniyor"}
              </div>
              {m.role !== "admin" && (
                <button onClick={function() { removeMember(m.email); }}
                  style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:8, padding:"4px 10px", color:"#ef4444", cursor:"pointer", fontSize:11 }}>
                  Cikar
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard(props) {
  var user = props.user;
  var [tab, setTab] = useState("lessons");
  var [upgrade, setUpgrade] = useState(null);
  var p = getPerms(user);
  var progress = user.progress || {};
  var scores = user.scores || {};
  var doneKeys = Object.keys(progress).filter(function(k) { return progress[k] === "done"; });
  var done = doneKeys.length;
  var total = COURSES.length;
  var pct = Math.round((done / total) * 100);
  var xp = user.xp || 0;
  var streak = user.streak || 0;
  var lvl = getLvl(xp);
  var nxt = getNextLvl(xp);
  var xpToNext = nxt.xp - xp;
  var xpPct = lvl.xp === nxt.xp ? 100 : Math.round((xp - lvl.xp) / (nxt.xp - lvl.xp) * 100);
  var lbEntries = MOCK_LB.concat([{ name: user.name + " (Sen)", xp: xp, streak: streak }]);
  lbEntries.sort(function(a, b) { return b.xp - a.xp; });
  var myRank = 1;
  for (var i = 0; i < lbEntries.length; i++) { if (lbEntries[i].name.indexOf("(Sen)") >= 0) { myRank = i + 1; break; } }

  var tabs = [
    ["lessons",      "Dersler"],
    ["leaderboard",  "Liderboard"],
    ["bonus",        "Bonus" + (p.bonus ? "" : " (Pro)")],
    ["team",         "Ekip" + (p.team ? "" : " (Business)")],
  ];

  return (
    <div style={{ minHeight:"100vh", background:BG, color:TEXT, fontFamily:FONT, backgroundImage:"radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)", backgroundSize:"32px 32px" }}>
      {upgrade && <UpgradeModal feature={upgrade} onClose={function() { setUpgrade(null); }} />}
      <div style={{ position:"sticky", top:0, zIndex:50, background:"rgba(7,7,17,0.92)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:"1px solid "+CARD_BORDER, padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:22, fontWeight:800, background:"linear-gradient(135deg,#f5cc6a,#7c5cfc)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>AI</span>
          <span style={{ fontSize:12, color:TEXT2 }}>Certification Academy</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ background:"rgba(239,68,68,0.10)", backdropFilter:"blur(12px)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"6px 12px", fontSize:13, color:"#ef4444", fontFamily:FONT_MONO, fontWeight:700 }}>{"x " + streak + "g"}</div>
          <div style={{ background:"rgba(255,255,255,0.04)", backdropFilter:"blur(12px)", border:"1px solid "+CARD_BORDER2, borderRadius:10, padding:"6px 12px", fontSize:12, color:lvl.color, fontFamily:FONT_MONO, fontWeight:700 }}>{"Lv." + lvl.level + " " + xp + "XP"}</div>
          <button onClick={function() { p.mentor ? props.onMentor() : setUpgrade("AI Mentor"); }}
            style={{ background: p.mentor ? "rgba(201,168,76,0.12)" : CARD_BG, border:"1px solid "+(p.mentor?"rgba(201,168,76,0.45)":CARD_BORDER), borderRadius:10, padding:"6px 14px", color: p.mentor ? GOLD2 : TEXT2, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:FONT, transition:"all 0.2s ease" }}>
            {"AI Mentor" + (p.mentor ? "" : " (Pro)")}
          </button>
          <div style={{ background:"rgba(201,168,76,0.10)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:8, padding:"5px 12px", fontSize:11, color:GOLD2, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>{user.plan ? user.plan.name : ""}</div>
          <span style={{ color:TEXT2, fontSize:12 }}>{user.name}</span>
          <button onClick={props.onLogout} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid "+CARD_BORDER, borderRadius:10, padding:"6px 14px", color:TEXT2, cursor:"pointer", fontSize:12, fontFamily:FONT, transition:"all 0.2s ease" }}>Çıkış</button>
        </div>
      </div>
      <div style={{ maxWidth:1040, margin:"0 auto", padding:"28px 20px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:28 }}>
          <div style={{ background:"linear-gradient(145deg, rgba(201,168,76,0.12), rgba(201,168,76,0.03))", backdropFilter:"blur(12px)", border:"1px solid rgba(201,168,76,0.25)", borderRadius:16, padding:22, boxShadow:"inset 0 1px 0 rgba(255,255,255,0.08)", transition:"all 0.2s ease" }}>
            <div style={{ fontSize:10, color:TEXT2, marginBottom:8, textTransform:"uppercase", letterSpacing:"1px", fontWeight:600 }}>Kurs İlerlemesi</div>
            <div style={{ fontSize:36, fontWeight:800, color:GOLD2, fontFamily:FONT_MONO, letterSpacing:"-0.02em" }}>{pct + "%"}</div>
            <div style={{ color:TEXT2, fontSize:11, marginTop:4 }}>{done + "/" + total + " ders"}</div>
            <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:4, height:8, overflow:"hidden", marginTop:10 }}>
              <div style={{ width:pct+"%", height:"100%", background:"linear-gradient(90deg,#c9a84c,#f5cc6a)", borderRadius:4, transition:"width 0.6s ease" }} />
            </div>
          </div>
          <div style={{ background:"linear-gradient(145deg, rgba(124,92,252,0.12), rgba(124,92,252,0.03))", backdropFilter:"blur(12px)", border:"1px solid rgba(124,92,252,0.25)", borderRadius:16, padding:22, boxShadow:"inset 0 1px 0 rgba(255,255,255,0.08)", transition:"all 0.2s ease" }}>
            <div style={{ fontSize:10, color:TEXT2, marginBottom:8, textTransform:"uppercase", letterSpacing:"1px", fontWeight:600 }}>Seviye ve XP</div>
            <div style={{ fontSize:18, fontWeight:800, color:lvl.color }}>{lvl.name}</div>
            <div style={{ color:TEXT2, fontSize:11, marginTop:4, fontFamily:FONT_MONO }}>{xp + " XP +" + xpToNext}</div>
            <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:4, height:8, overflow:"hidden", marginTop:10 }}>
              <div style={{ width:xpPct+"%", height:"100%", background:"linear-gradient(90deg,"+lvl.color+",#7c5cfc)", borderRadius:4, transition:"width 0.6s ease" }} />
            </div>
          </div>
          <div style={{ background:"linear-gradient(145deg, rgba(239,68,68,0.10), rgba(239,68,68,0.02))", backdropFilter:"blur(12px)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:16, padding:22, boxShadow:"inset 0 1px 0 rgba(255,255,255,0.08)", transition:"all 0.2s ease" }}>
            <div style={{ fontSize:10, color:TEXT2, marginBottom:8, textTransform:"uppercase", letterSpacing:"1px", fontWeight:600 }}>Streak</div>
            <div style={{ fontSize:36, fontWeight:800, color:"#ef4444", fontFamily:FONT_MONO, letterSpacing:"-0.02em" }}>{streak}</div>
            <div style={{ color:TEXT2, fontSize:11, marginTop:4 }}>Ardışık gün</div>
          </div>
          <div style={{ background:"linear-gradient(145deg, rgba(0,201,167,0.12), rgba(0,201,167,0.03))", backdropFilter:"blur(12px)", border:"1px solid rgba(0,201,167,0.25)", borderRadius:16, padding:22, boxShadow:"inset 0 1px 0 rgba(255,255,255,0.08)", transition:"all 0.2s ease" }}>
            <div style={{ fontSize:10, color:TEXT2, marginBottom:8, textTransform:"uppercase", letterSpacing:"1px", fontWeight:600 }}>Liderboard</div>
            <div style={{ fontSize:36, fontWeight:800, color:TEAL, fontFamily:FONT_MONO, letterSpacing:"-0.02em" }}>{"#"+myRank}</div>
            <div style={{ color:TEXT2, fontSize:11, marginTop:4 }}>{lbEntries.length + " kişi arasinda"}</div>
          </div>
        </div>

        <div style={{ display:"flex", gap:3, marginBottom:22, background:"rgba(255,255,255,0.03)", borderRadius:10, padding:3, width:"fit-content", flexWrap:"wrap" }}>
          {tabs.map(function(item) {
            var t = item[0]; var label = item[1];
            return (
              <button key={t} onClick={function() {
                if (t === "bonus" && !p.bonus) { setUpgrade("Bonus İçerikler"); return; }
                if (t === "team" && !p.team) { setUpgrade("Ekip Yonetimi"); return; }
                setTab(t);
              }} style={{ background: tab===t ? "rgba(212,168,83,0.14)" : "transparent", border: tab===t ? "1px solid rgba(212,168,83,0.3)" : "1px solid transparent", borderRadius:7, padding:"7px 14px", color: tab===t ? GOLD : "#555577", cursor:"pointer", fontSize:12, fontWeight: tab===t ? 600 : 400 }}>
                {label}
              </button>
            );
          })}
        </div>

        {tab === "lessons" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14 }}>
              {COURSES.map(function(c) {
                var isDone = progress[c.day] === "done";
                var isLocked = p.lockAfter && c.day > p.lockAfter;
                var sc = scores[c.day];
                return (
                  <div key={c.day} onClick={function() {
                    if (isLocked) { setUpgrade("Gün " + c.day + ": " + c.tool); return; }
                    props.onLesson(c);
                  }}
                  onMouseEnter={function(e){ if(!isLocked){ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.borderColor= isDone ? "rgba(0,201,167,0.5)" : CARD_BORDER2; e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"; } }}
                  onMouseLeave={function(e){ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.borderColor= isDone?"rgba(0,201,167,0.28)":isLocked?"rgba(255,255,255,0.04)":CARD_BORDER; e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)"; }}
                  style={{ background: isDone ? "linear-gradient(145deg, rgba(0,201,167,0.10), rgba(0,201,167,0.02))" : "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border:"1px solid "+(isDone?"rgba(0,201,167,0.28)":isLocked?"rgba(255,255,255,0.04)":CARD_BORDER), borderRadius:16, padding:18, cursor: isLocked ? "not-allowed" : "pointer", position:"relative", opacity: isLocked ? 0.45 : 1, transition:"all 0.2s ease", boxShadow:"0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)", fontFamily:FONT }}>
                    {isDone && <div style={{ position:"absolute", top:10, right:10, background:"linear-gradient(135deg,#00c9a7,#10a37f)", borderRadius:100, width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#04150f", fontWeight:800, boxShadow:"0 2px 8px rgba(0,201,167,0.4)" }}>✓</div>}
                    {isLocked && <div style={{ position:"absolute", top:10, right:10, fontSize:14, color:TEXT2 }}>🔒</div>}
                    <div style={{ fontSize:28, marginBottom:10 }}>{c.icon}</div>
                    <div style={{ fontSize:10, color:GOLD, fontFamily:FONT_MONO, marginBottom:4, fontWeight:700, letterSpacing:"1px" }}>{"GÜN " + c.day.toString().padStart(2,"0")}</div>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:4, color:TEXT }}>{c.tool}</div>
                    {isDone && sc !== undefined && <div style={{ fontSize:11, color:TEAL, fontFamily:FONT_MONO, fontWeight:600 }}>{sc + "/5 · +" + xpFor(sc) + "XP"}</div>}
                    {isLocked && <div style={{ fontSize:10, color:TEXT2, fontFamily:FONT_MONO }}>Pro gerekli</div>}
                    {!isDone && !isLocked && <div style={{ fontSize:11, color:TEXT2 }}>Başla →</div>}
                  </div>
                );
              })}
            </div>
            {done === total && (
              <div style={{ marginTop:32, textAlign:"center", background:"linear-gradient(145deg, rgba(201,168,76,0.12), rgba(124,92,252,0.06))", border:"1px solid rgba(201,168,76,0.4)", borderRadius:24, padding:40, boxShadow:SHADOW_GOLD+", inset 0 1px 0 rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize:56, marginBottom:12 }}>🏆</div>
                <h2 style={{ fontSize:28, fontWeight:800, background:"linear-gradient(135deg,#f5cc6a,#7c5cfc)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", marginBottom:8, letterSpacing:"-0.02em" }}>Programı Tamamladın!</h2>
                <p style={{ color:TEXT2, marginBottom:24, fontSize:13, fontFamily:FONT_MONO }}>{"Sertifika: " + p.cert + " · Toplam " + xp + " XP"}</p>
                <button onClick={function() {
                  var dataUrl = generateCertificate(user.name, p.cert, xp);
                  var a = document.createElement("a"); a.href = dataUrl; a.download = "AI-Sertifika.png"; a.click();
                }}
                onMouseEnter={function(e){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(201,168,76,0.45)"; }}
                onMouseLeave={function(e){ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=SHADOW_GOLD; }}
                style={{ background:"linear-gradient(135deg,#c9a84c,#f5cc6a)", color:"#08080f", border:"none", borderRadius:14, padding:"15px 40px", fontSize:16, fontWeight:700, cursor:"pointer", boxShadow:SHADOW_GOLD, transition:"all 0.2s ease", fontFamily:FONT }}>
                  Sertifikamı İndir
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "leaderboard" && (
          <div style={{ maxWidth:580 }}>
            <p style={{ color:TEXT2, fontSize:13, marginBottom:20, fontFamily:FONT_MONO }}>Tüm kullanıcılar arasındaki XP siralaması</p>
            {lbEntries.map(function(e, i) {
              var isMe = e.name.indexOf("(Sen)") >= 0;
              var medal = String(i + 1).padStart(2,"0");
              var rankBg = i === 0 ? "linear-gradient(135deg,#f5cc6a,#c9a84c)" : i === 1 ? "linear-gradient(135deg,#d8d8e0,#9999b8)" : i === 2 ? "linear-gradient(135deg,#cd7f32,#a0522d)" : "rgba(255,255,255,0.06)";
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:14, background: isMe ? "linear-gradient(145deg, rgba(201,168,76,0.12), rgba(201,168,76,0.03))" : "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))", border:"1px solid "+(isMe?"rgba(201,168,76,0.4)":CARD_BORDER), borderRadius:14, padding:"14px 18px", marginBottom:10, transition:"all 0.2s ease", boxShadow: isMe ? "0 4px 16px rgba(201,168,76,0.15), inset 0 1px 0 rgba(255,255,255,0.08)" : "inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                  <div style={{ width:36, height:36, borderRadius:10, background: rankBg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color: i<3?"#08080f":TEXT2, fontFamily:FONT_MONO, boxShadow: i<3 ? "0 2px 8px rgba(201,168,76,0.3)" : "none" }}>{medal}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, color: isMe ? GOLD2 : TEXT, fontSize:14 }}>{e.name}</div>
                    <div style={{ fontSize:11, color:TEXT2, fontFamily:FONT_MONO, marginTop:2 }}>{"🔥 " + e.streak + "g streak"}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:FONT_MONO, fontWeight:700, color: isMe ? GOLD2 : TEXT, fontSize:15 }}>{e.xp + " XP"}</div>
                    <div style={{ fontSize:11, color:TEXT2, marginTop:2 }}>{getLvl(e.xp).name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "bonus" && p.bonus && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:18 }}>
            {[
              { icon:"P", title:"500+ Prompt Şablonu",   desc:"Her araç için hazır kullanışlı promptlar" },
              { icon:"G", title:"AI ile Gelir Rehberi",  desc:"AI araçlarıyla $1000+ kazanma stratejileri" },
              { icon:"O", title:"Otomasyon Akışları",    desc:"Make + Zapier entegrasyon şablonları" },
              { icon:"D", title:"Discord Topluluğu",     desc:"Pro üyelere özel kanal ve sorular" },
            ].map(function(m) {
              return (
                <div key={m.title}
                  onMouseEnter={function(e){ e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.borderColor=CARD_BORDER2; }}
                  onMouseLeave={function(e){ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.borderColor=CARD_BORDER; }}
                  style={{ background:"linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border:"1px solid "+CARD_BORDER, borderRadius:20, padding:26, transition:"all 0.2s ease", boxShadow:"0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)", fontFamily:FONT }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:"linear-gradient(135deg, rgba(201,168,76,0.20), rgba(124,92,252,0.15))", border:"1px solid rgba(201,168,76,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:GOLD2, marginBottom:14, fontSize:18, fontFamily:FONT_MONO }}>{m.icon}</div>
                  <div style={{ fontWeight:700, marginBottom:8, fontSize:15, color:TEXT }}>{m.title}</div>
                  <div style={{ color:TEXT2, fontSize:13, lineHeight:1.6, marginBottom:18 }}>{m.desc}</div>
                  <button style={{ background:"rgba(201,168,76,0.10)", border:"1px solid rgba(201,168,76,0.35)", borderRadius:10, padding:"9px 18px", color:GOLD2, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:FONT, transition:"all 0.2s ease", textTransform:"uppercase", letterSpacing:"0.5px" }}>Erişim Sağla</button>
                </div>
              );
            })}
          </div>
        )}

        {tab === "team" && p.team && <TeamPanel user={user} />}
      </div>
    </div>
  );
}

// ─── TOOL USECASES ─────────────────────────────────────────────────────────────
var TOOL_USECASES = {

  "ChatGPT": { tagline: "Dünyanın en popüler AI asistanı", usecases: ["📧 Saniyeler içinde profesyonel e-postalar yaz","📊 Toplantı notlarını otomatik özetle","💼 CV ve kapak mektubunu AI ile hazırla","🔍 Karmaşık konuları sade Türkçe ile anla"] },

  "Claude": { tagline: "Uzun belgeleri anlayan, derin düşünen AI", usecases: ["📄 50 sayfalık sözleşmeyi 2 dakikada özetle","✍️ Makale ve rapor taslakları oluştur","🧠 Karmaşık kararlar için detaylı analiz al","💬 Doğal, insan gibi diyaloglarla çalış"] },

  "Gemini": { tagline: "Google'ın çok modlu AI sistemi", usecases: ["🖼️ Fotoğraf yükle, içeriği analiz ettir","🔎 Gerçek zamanlı Google araması ile yanıtlar al","📱 Gmail ve Drive ile entegre çalış","🌍 100+ dilde çeviri ve içerik üret"] },

  "Midjourney": { tagline: "Hayal ettiğin her görseli saniyede üret", usecases: ["🎨 Ürün için profesyonel reklam görseli üret","🏠 İç mekan tasarımı konseptleri oluştur","👔 Marka kimliği için özgün illüstrasyonlar yap","🖼️ Sosyal medya için viral içerik görselleri"] },

  "Perplexity": { tagline: "Kaynak gösteren AI araştırma motoru", usecases: ["📰 Güncel haberleri kaynaklarıyla öğren","🔬 Akademik araştırma raporları hazırla","📈 Rakip analizi ve pazar araştırması yap","✅ Bilgileri gerçek kaynaklarla doğrula"] },

  "Lovable": { tagline: "Kod yazmadan uygulama geliştir", usecases: ["🚀 Fikrini 10 dakikada çalışan uygulamaya dönüştür","💰 SaaS ürünü kur, abonelik sistemi ekle","🛒 E-ticaret sitesi oluştur ve yayınla","🎯 Müşteri için MVP prototip hızla sun"] },

  "ElevenLabs": { tagline: "Sesinizi klonlayın, içerik üretin", usecases: ["🎙️ Kendi sesini klonla, video seslendirmesi yap","🎧 Yazılı içerikleri podcast'e dönüştür","🌐 İçeriklerini 30 dile seslendir","📺 YouTube videoları için profesyonel seslendirme"] },

  "Runway ML": { tagline: "AI ile profesyonel video düzenleme", usecases: ["🎬 Metin yazarak video sahnesi oluştur","✂️ Videoda arka planı tek tıkla kaldır","🎨 Videona sinematik efektler ekle","⚡ Saatlik düzenlemeyi dakikada bitir"] },

  "Make.com": { tagline: "Tekrarlayan işleri otomatikleştir", usecases: ["📬 Gelen e-postaları otomatik sınıflandır","🔄 Formdan gelen veriyi CRM'e otomatik aktar","📱 Sosyal medyayı otomatik yönet","⏰ Haftalık raporları otomatik gönder"] },

  "Notion AI": { tagline: "Düşüncelerini organize eden AI sistemi", usecases: ["📋 Proje planını otomatik oluştur","📝 Toplantı notlarını aksiyonlara dönüştür","🗂️ Tüm bilgi tabanını AI ile yönet","✅ Haftalık görev listeni otomatik hazırla"] },

  "Leonardo AI": { tagline: "Profesyonel AI görsel üretim stüdyosu", usecases: ["🛍️ Ürün fotoğraflarını AI ile yeniden çek","👗 Moda tasarımı konseptleri oluştur","🎮 Oyun karakteri ve ortam görselleri üret","📣 Reklam kampanyası için özgün görseller"] },

  "Canva AI": { tagline: "Tasarımcı olmadan profesyonel tasarım", usecases: ["📊 Sunum slaytlarını saniyede tasarla","📱 Instagram ve TikTok içerikleri üret","🎴 Marka kiti ve logo tasarımı oluştur","📰 Bülten ve katalog tasarımla"] },

  "Stable Diffusion": { tagline: "Açık kaynak görsel AI — tam kontrol", usecases: ["🖥️ Kendi bilgisayarında ücretsiz görsel üret","🎨 Özel model eğiterek kendi stilini oluştur","🔧 Fotoğraf restorasyon ve iyileştirme","🏭 Toplu içerik üretimi için otomatize et"] },

  "Sora 2": { tagline: "OpenAI'ın çığır açan video AI modeli", usecases: ["🎬 Metinden gerçekçi video sahnesi üret","🌅 Ürün tanıtım videosu oluştur","📽️ Kısa film konsepti hayata geçir","✨ Özel efektlerle yaratıcı içerikler"] },

  "Veo 3": { tagline: "Google'ın en gelişmiş video üretim AI'ı", usecases: ["🎥 Sinematik kalitede video üret","🎵 Sesli ve müzikli video içerikler oluştur","📺 Reklam filmi konseptleri hazırla","🌍 Çok dilli video içerik üretimi"] },

  "Grok": { tagline: "X (Twitter) entegreli gerçek zamanlı AI", usecases: ["📡 Anlık gelişmeleri AI ile analiz et","🐦 Twitter trendlerini yorumla","😄 Mizahi ve özgün içerik üret","🔥 Viral içerik fikirleri geliştir"] },

  "Copilot": { tagline: "Microsoft Office'i AI ile güçlendir", usecases: ["📊 Excel'de veri analizi ve grafik oluştur","📝 Word belgeleri otomatik taslak","📧 Outlook'ta e-posta özetleme","🎯 Teams toplantılarını AI ile yönet"] },

  "Deepseek": { tagline: "Güçlü açık kaynak Çin AI modeli", usecases: ["💻 Kod yaz, hata bul ve düzelt","🧮 Karmaşık matematik problemleri çöz","📖 Uzun metinleri analiz et ve özetle","🔬 Araştırma ve veri analizi yap"] },

  "Manus": { tagline: "Tamamen otonom AI ajan sistemi", usecases: ["🤖 Görevi ver, AI baştan sona tamamlasın","🌐 Web araştırması yapıp rapor hazırlasın","💼 İş akışlarını AI ajana devret","📱 Çoklu uygulama görevlerini otomatize et"] },

  "Meta AI": { tagline: "Meta'nın ücretsiz AI ekosistemi", usecases: ["💬 WhatsApp'ta AI asistan olarak kullan","📸 Instagram için içerik fikirleri üret","🎨 Ücretsiz görsel üretimi yap","👥 Sosyal medya stratejisi geliştir"] },

  "Assembly AI": { tagline: "Ses ve video transkripsiyon AI", usecases: ["🎙️ Toplantı kayıtlarını otomatik metne çevir","📝 Podcast bölümlerini yazıya dönüştür","🔍 Video içeriklerinde kelime ara","🌍 Çok dilli transkripsiyon yap"] },

  "Kimi": { tagline: "Moonshot AI'ın güçlü dil modeli", usecases: ["📚 200.000 token ile dev belgeler analiz et","🔬 Akademik makaleler üzerinde çalış","💡 Uzun araştırma projeleri yönet","🌏 Çince içeriklerle çalış"] },

  "Kling": { tagline: "Kuaishou'nun video üretim AI platformu", usecases: ["🎬 Fotoğraftan video animasyonu oluştur","👤 Karakter animasyonları üret","🎭 Yüz ifadesi ve hareket senkronizasyonu","📱 Kısa form video içerik üretimi"] },

  "Pika Labs": { tagline: "Hızlı ve erişilebilir video AI", usecases: ["⚡ Saniyeler içinde kısa video oluştur","🎨 Görselleri animasyona dönüştür","🎬 Sosyal medya için kısa klipler","✨ Yaratıcı video efektleri ekle"] },

  "Zapier AI": { tagline: "7000+ uygulamayı AI ile bağla", usecases: ["🔗 CRM, e-posta ve takvimi otomatik senkronize et","📊 Veri toplama iş akışları kur","🛒 E-ticaret siparişlerini otomatik yönet","📬 Lead'leri otomatik besle ve takip et"] },

  "Prompt Engineering": { tagline: "AI'dan maksimum verim alma sanatı", usecases: ["🎯 Mükemmel sonuç veren promptlar yaz","⚡ AI verimliliğini 10 katına çıkar","🔧 Özel görevler için prompt şablonları oluştur","💡 Chain-of-thought teknikleriyle derin analiz"] },

  "AI İş Stratejisi": { tagline: "AI ile gelir modeli ve iş büyütme", usecases: ["💰 AI tabanlı SaaS gelir modeli kur","📈 İş süreçlerini AI ile optimize et","🚀 Rakiplerden önce AI avantajı yakala","🌍 AI ile global pazara aç"] },

  "NanoBanana": { tagline: "Yeni nesil AI araçlarını keşfet", usecases: ["🔭 En yeni AI trendlerini takip et","⚡ Erken adopter avantajı kazan","🧪 Beta AI araçlarını ilk dene","🌟 Gelecekteki AI araçlarına hazırlan"] }

};

function LessonIntro(props) {

  var lesson = props.lesson;

  var data = TOOL_USECASES[lesson.tool] || { tagline: lesson.desc, usecases: ["🎯 Sıfırdan adım adım öğren","💡 Gerçek örneklerle pratik yap","⭐ XP kazan seviye atla","🏆 Sertifikanı al"] };

  var [phase, setPhase] = useState(0);

  var [visibleUC, setVisibleUC] = useState(0);

  var [progress, setProgress] = useState(0);

  var TOTAL = 16000;

  useEffect(function() {

    var t1 = setTimeout(function() { setPhase(1); }, 800);

    var t2 = setTimeout(function() { setPhase(2); }, 2000);

    var t3 = setTimeout(function() { setPhase(3); setVisibleUC(1); }, 4000);

    var t4 = setTimeout(function() { setVisibleUC(2); }, 6000);

    var t5 = setTimeout(function() { setVisibleUC(3); }, 8000);

    var t6 = setTimeout(function() { setVisibleUC(4); }, 10000);

    var t7 = setTimeout(function() { setPhase(4); }, 12000);

    var t8 = setTimeout(function() { props.onDone(); }, 16000);

    var start = Date.now();

    var ticker = setInterval(function() {

      setProgress(Math.min(100, ((Date.now() - start) / TOTAL) * 100));

    }, 50);

    return function() {

      [t1,t2,t3,t4,t5,t6,t7,t8].forEach(clearTimeout);

      clearInterval(ticker);

    };

  }, []);

  return (

    <div style={{ position:"fixed", inset:0, zIndex:2000, background:"radial-gradient(ellipse at 50% 30%, rgba(201,168,76,0.16) 0%, #070711 65%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px" }}>

      <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, backgroundImage:"radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)", backgroundSize:"32px 32px", pointerEvents:"none" }} />

      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"rgba(255,255,255,0.06)" }}>

        <div style={{ height:"100%", width:progress+"%", background:"linear-gradient(90deg,#c9a84c,#f5cc6a)", transition:"width 0.1s linear" }} />

      </div>

      <div style={{ textAlign:"center", maxWidth:540, width:"100%" }}>

        <div style={{ fontSize: phase >= 1 ? 88 : 56, marginBottom:16, transition:"font-size 0.9s cubic-bezier(0.34,1.56,0.64,1)", filter:"drop-shadow(0 0 48px rgba(201,168,76,0.6))" }}>

          {lesson.icon}

        </div>

        <div style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? "translateY(0)" : "translateY(24px)", transition:"all 0.7s ease", marginBottom:6 }}>

          <span style={{ fontSize:11, color:"rgba(201,168,76,0.6)", fontFamily:"monospace", letterSpacing:4, textTransform:"uppercase" }}>GÜN {lesson.day} · AI ARACI</span>

        </div>

        <div style={{ opacity: phase >= 1 ? 1 : 0, transform: phase >= 1 ? "translateY(0)" : "translateY(30px)", transition:"all 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.1s", marginBottom:10 }}>

          <span style={{ fontSize:40, fontWeight:800, color:"#fff", lineHeight:1.1 }}>{lesson.tool}</span>

        </div>

        <div style={{ opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? "translateY(0)" : "translateY(16px)", transition:"all 0.7s ease", marginBottom:28 }}>

          <span style={{ fontSize:16, color:"#9999b8", lineHeight:1.6 }}>{data.tagline}</span>

        </div>

        <div style={{ opacity: phase >= 3 ? 1 : 0, transition:"opacity 0.5s ease", marginBottom:8 }}>

          <div style={{ fontSize:12, color:"rgba(201,168,76,0.7)", fontFamily:"monospace", letterSpacing:2, textTransform:"uppercase", marginBottom:14 }}>

            🎯 Bunu öğrendikten sonra şunları yapabileceksin:

          </div>

        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28, textAlign:"left" }}>

          {data.usecases.map(function(uc, i) {

            var show = visibleUC > i;

            return (

              <div key={i} style={{ display:"flex", alignItems:"center", gap:14, background: show ? "rgba(201,168,76,0.07)" : "transparent", border:"1px solid "+(show ? "rgba(201,168,76,0.2)" : "transparent"), borderRadius:12, padding:"12px 16px", opacity: show ? 1 : 0, transform: show ? "translateX(0)" : "translateX(-24px)", transition:"all 0.5s cubic-bezier(0.34,1.56,0.64,1)" }}>

                <span style={{ fontSize:20 }}>{uc.split(" ")[0]}</span>

                <span style={{ fontSize:14, color:"#ccccdd", lineHeight:1.5 }}>{uc.split(" ").slice(1).join(" ")}</span>

              </div>

            );

          })}

        </div>

        <div style={{ opacity: phase >= 4 ? 1 : 0, transform: phase >= 4 ? "scale(1) translateY(0)" : "scale(0.92) translateY(12px)", transition:"all 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}>

          <button onClick={props.onDone} style={{ background:"linear-gradient(135deg,#c9a84c,#f5cc6a)", color:"#08080f", border:"none", borderRadius:14, padding:"16px 0", fontSize:17, fontWeight:800, cursor:"pointer", boxShadow:"0 6px 32px rgba(201,168,76,0.4)", width:"100%", maxWidth:360, display:"block", margin:"0 auto 10px" }}>

            🚀 Hadi Başlayalım!

          </button>

          <div style={{ fontSize:12, color:"rgba(255,255,255,0.2)" }}>⏱ Tahmini süre: 15 dakika · Dilediğinde devam edebilirsin</div>

        </div>

      </div>

      <button onClick={props.onDone} style={{ position:"absolute", top:18, right:18, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"7px 14px", color:"rgba(255,255,255,0.3)", fontSize:12, cursor:"pointer" }}>

        Atla ✕

      </button>

      <div style={{ position:"absolute", bottom:24, display:"flex", gap:5 }}>

        {[0,1,2,3,4].map(function(i) {

          return <div key={i} style={{ width: phase === i ? 20 : 6, height:6, borderRadius:3, background: phase >= i ? "rgba(201,168,76,0.8)" : "rgba(255,255,255,0.12)", transition:"all 0.3s ease" }} />;

        })}

      </div>

    </div>

  );

}

// ─── LESSON ──────────────────────────────────────────────────────────────────
function Lesson(props) {
  var lesson = props.lesson;
  var cacheKey = "lesson-v7-" + lesson.tool;
  var [phase, setPhase] = useState("intro");
  var [loading, setLoading] = useState(false);
  var [loadProgress, setLoadProgress] = useState(0);
  var [loadError, setLoadError] = useState(false);
  var [cards, setCards] = useState([]);
  var [cardIndex, setCardIndex] = useState(0);
  var [ans, setAns] = useState({});
  var [score, setScore] = useState(0);
  var [earnedXP, setEarnedXP] = useState(0);
  var [cached, setCached] = useState(null);
  var quiz = DEFAULT_QUIZ;

  useEffect(function() {
    try {
      var cv = lsGet(cacheKey);
      if (cv) {
        var cd = JSON.parse(cv);
        setCached(Date.now() - cd.ts < 24*60*60*1000);
      } else { setCached(false); }
    } catch(e) { setCached(false); }
  }, [cacheKey]);

  function normalizeCards(arr) {
    var out = [];
    if (!arr || !arr.length) return out;
    var palette = ["#d4a853","#10a37f","#8b5cf6","#4285f4","#ef4444","#f59e0b","#0891b2","#ec4899","#7c3aed","#059669"];
    for (var i = 0; i < arr.length; i++) {
      var c = arr[i] || {};
      out.push({
        icon: c.icon || "*",
        title: c.title || (lesson.tool + " - Kart " + (i+1)),
        body: c.content || c.body || "",
        color: palette[i % palette.length]
      });
    }
    return out;
  }

  function renderCardContent(content) {
    if (!content) return null;
    var lines = content.split("\n");
    return lines.map(function(line, i) {
      if (!line.trim()) return <div key={i} style={{ height:8 }} />;
      if (line.startsWith("💡 Örnek:")) {
        return <div key={i} style={{ background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:10, padding:"10px 14px", fontSize:14, color:"#e8d5a3", lineHeight:1.7, marginTop:4 }}>{line}</div>;
      }
      if (line.startsWith("⚡ İpucu:")) {
        return <div key={i} style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.2)", borderRadius:10, padding:"10px 14px", fontSize:14, color:"#a5b4fc", lineHeight:1.7, marginTop:4 }}>{line}</div>;
      }
      if (line.startsWith("🖼️") || line.includes("→") || line.includes("❌") || line.includes("✅") || line.match(/^[1-9]️⃣/)) {
        return <div key={i} style={{ background:"rgba(16,163,127,0.06)", border:"1px solid rgba(16,163,127,0.15)", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#6ee7b7", lineHeight:1.8, fontFamily:"monospace", marginTop:4, whiteSpace:"pre-wrap" }}>{line}</div>;
      }
      return <div key={i} style={{ fontSize:15, color:"#ccccdd", lineHeight:1.8 }}>{line}</div>;
    });
  }

  function parseCardsFromText(text) {
    if (!text) return [];
    var t = String(text).trim();
    // Strip markdown code fences if present
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/,"").trim();
    // Try to locate JSON array
    var start = t.indexOf("[");
    var end = t.lastIndexOf("]");
    if (start !== -1 && end !== -1 && end > start) {
      t = t.slice(start, end + 1);
    }
    try {
      var parsed = JSON.parse(t);
      if (Object.prototype.toString.call(parsed) === "[object Array]") return normalizeCards(parsed);
    } catch(e) {}
    return [];
  }

  function parseCards(text) {
    var sections = [
      { key:"NEDIR",           icon:"L", title:"Bu Araç Nedir?",              color:"#4285f4" },
      { key:"TARIHÇE",         icon:"T", title:"Tarihçe ve Gelisim",           color:"#6366f1" },
      { key:"TEMEL_ÖZELLIK_1", icon:"1", title:"Temel Özellik 1",              color:"#d4a853" },
      { key:"TEMEL_ÖZELLIK_2", icon:"2", title:"Temel Özellik 2",              color:"#d4a853" },
      { key:"TEMEL_ÖZELLIK_3", icon:"3", title:"Temel Özellik 3",              color:"#d4a853" },
      { key:"TEMEL_ÖZELLIK_4", icon:"4", title:"Temel Özellik 4",              color:"#d4a853" },
      { key:"TEMEL_ÖZELLIK_5", icon:"5", title:"Temel Özellik 5",              color:"#d4a853" },
      { key:"KULLANIM_1",      icon:"A", title:"Baslangic Adım 1",             color:"#10a37f" },
      { key:"KULLANIM_2",      icon:"B", title:"Baslangic Adım 2",             color:"#10a37f" },
      { key:"KULLANIM_3",      icon:"C", title:"Baslangic Adım 3",             color:"#10a37f" },
      { key:"KULLANIM_4",      icon:"D", title:"Baslangic Adım 4",             color:"#10a37f" },
      { key:"KULLANIM_ILERI_1",icon:"E", title:"Ileri Seviye Kullanım 1",      color:"#059669" },
      { key:"KULLANIM_ILERI_2",icon:"F", title:"Ileri Seviye Kullanım 2",      color:"#059669" },
      { key:"KULLANIM_ILERI_3",icon:"G", title:"Ileri Seviye Kullanım 3",      color:"#059669" },
      { key:"KULLANIM_ILERI_4",icon:"H", title:"Ileri Seviye Kullanım 4",      color:"#059669" },
      { key:"PROMPT_ZAYIF",    icon:"X", title:"Zayif Prompt - Kacin!",        color:"#ef4444" },
      { key:"PROMPT_GUCLU",    icon:"P", title:"Guclu Prompt Teknigi",         color:"#8b5cf6" },
      { key:"PROMPT_UZMAN",    icon:"U", title:"Uzman Prompt Teknigi",         color:"#7c3aed" },
      { key:"PROMPT_SEKTOR_1", icon:"S", title:"Pazarlama Promptları",         color:"#9333ea" },
      { key:"PROMPT_SEKTOR_2", icon:"K", title:"Teknoloji Promptları",         color:"#9333ea" },
      { key:"PROMPT_SEKTOR_3", icon:"M", title:"E-Ticaret Promptları",         color:"#9333ea" },
      { key:"ENTEGRASYON_1",   icon:"Z", title:"Entegrasyon 1",                color:"#0891b2" },
      { key:"ENTEGRASYON_2",   icon:"Y", title:"Entegrasyon 2",                color:"#0891b2" },
      { key:"ENTEGRASYON_3",   icon:"W", title:"Entegrasyon 3",                color:"#0891b2" },
      { key:"IS_MODELI_1",     icon:"$", title:"Para Kazanma Modeli 1",        color:"#f59e0b" },
      { key:"IS_MODELI_2",     icon:"$", title:"Para Kazanma Modeli 2",        color:"#f59e0b" },
      { key:"IS_MODELI_3",     icon:"$", title:"Para Kazanma Modeli 3",        color:"#f59e0b" },
      { key:"IPUCU_1",         icon:"I", title:"Uzman Ipucu 1",                color:"#dc2626" },
      { key:"IPUCU_2",         icon:"I", title:"Uzman Ipucu 2",                color:"#dc2626" },
      { key:"IPUCU_3",         icon:"I", title:"Uzman Ipucu 3",                color:"#dc2626" },
      { key:"IPUCU_4",         icon:"I", title:"Uzman Ipucu 4",                color:"#dc2626" },
      { key:"IPUCU_5",         icon:"I", title:"Uzman Ipucu 5",                color:"#dc2626" },
      { key:"HATA_1",          icon:"!", title:"Kacin: Hata 1",                color:"#ec4899" },
      { key:"HATA_2",          icon:"!", title:"Kacin: Hata 2",                color:"#ec4899" },
      { key:"HATA_3",          icon:"!", title:"Kacin: Hata 3",                color:"#ec4899" },
      { key:"HATA_4",          icon:"!", title:"Kacin: Hata 4",                color:"#ec4899" },
      { key:"HATA_5",          icon:"!", title:"Kacin: Hata 5",                color:"#ec4899" },
      { key:"KARSILASTIRMA_1", icon:"V", title:"Rakip Karsilastirma 1",        color:"#64748b" },
      { key:"KARSILASTIRMA_2", icon:"V", title:"Rakip Karsilastirma 2",        color:"#64748b" },
      { key:"KARSILASTIRMA_3", icon:"V", title:"Rakip Karsilastirma 3",        color:"#64748b" },
      { key:"GELECEK",         icon:"R", title:"Gelecek ve Trendler",          color:"#0ea5e9" },
      { key:"SEKTOR_KULLANIM_1",icon:"N",title:"Finans Sektöründe Kullanım",   color:"#10b981" },
      { key:"SEKTOR_KULLANIM_2",icon:"N",title:"Sağlık Sektöründe Kullanım",   color:"#10b981" },
      { key:"SEKTOR_KULLANIM_3",icon:"N",title:"Eğitim Sektöründe Kullanım",   color:"#10b981" },
      { key:"SEKTOR_KULLANIM_4",icon:"N",title:"Yaratici Endustriler",         color:"#10b981" },
      { key:"OTOMASYON_AKISI", icon:"O", title:"Otomasyon Akışı Kur",          color:"#8b5cf6" },
      { key:"VAKA_CALISMASI",  icon:"Q", title:"Gerçek Vaka Calismasi",        color:"#f59e0b" },
      { key:"SERTIFIKA_HAZIRLIK",icon:"J",title:"Sertifika Hazırlık",          color:"#d4a853" },
    ];
    var result = [];
    var keys = sections.map(function(s) { return s.key; });
    for (var i = 0; i < sections.length; i++) {
      var s = sections[i];
      var nextKeys = keys.slice(i + 1).join("|");
      var pattern = nextKeys ? s.key + "[:\\s]+([\\s\\S]*?)(?=\\n(?:" + nextKeys + ")[:\\s]|$)" : s.key + "[:\\s]+([\\s\\S]*)";
      try {
        var m = text.match(new RegExp(pattern));
        if (m && m[1] && m[1].trim().length > 15) {
          result.push({ icon:s.icon, title:s.title, body:m[1].trim(), color:s.color });
        }
      } catch(e) {}
    }
    if (result.length === 0) result.push({ icon:"?", title:lesson.tool + " Dersi", body:text, color:GOLD });
    return result;
  }

  function getFallbackCards() {
    console.log("FALLBACK CARDS CALLED - API failed");
    return [
      {
        icon: "L", title: "Bu Araç Nedir?", color: "#4285f4",
        body: lesson.tool + " — " + lesson.desc + "\n\nBu ders boyunca aracı sıfırdan öğrenecek, gerçek iş senaryolarında nasıl kullanacağını keşfedeceksin. Her kart somut bir beceri kazandırıyor."
      },
      {
        icon: "O", title: "Temel Özellikler", color: "#d4a853",
        body: "- Metin Üretimi: Tek bir açıklama ile profesyonel seviyede içerik, email, rapor ve kod üretir\n- Bağlamsal Anlama: Önceki mesajları hatırlar, uzun konuşmalarda tutarlı kalır\n- Çok Dilli Destek: Türkçe dahil 50+ dilde akıcı ve doğal yanıt verir\n- Dosya Analizi: PDF, Word, Excel ve görsel dosyaları yükleyerek analiz ettirebilirsin\n- Kod Yazma: Python, JavaScript, SQL ve daha fazlasında kod yazar, hata ayıklar"
      },
      {
        icon: "B", title: "Baslangic: Ilk 3 Adım", color: "#10a37f",
        body: "1. Hesap Oluştur: Platforma git, Google hesabınla 30 saniyede kaydol. Ücretsiz plan günlük kullanım için yeterli.\n\n2. Net Prompt Yaz: 'Bir şey yaz' değil, 'Hedef kitle: 30-45 yaş profesyoneller. Ton: samimi. 3 paragraflık LinkedIn gönderisi yaz' gibi spesifik talimatlar ver.\n\n3. İteratif Geliştir: İlk yanıt mükemmel olmayabilir. 'Daha kısa yap', 'Örnek ekle', 'Daha güvenilir ton kullan' diyerek adım adım iyileştir."
      },
      {
        icon: "P", title: "Gerçek Hayat Prompt Örneği", color: "#8b5cf6",
        body: "SENARYO: Bir e-ticaret sitesi için ürün açıklaması yazman gerekiyor.\n\nZAYIF PROMPT:\n'Ürün açıklaması yaz'\n\nGÜÇLÜ PROMPT:\n'Sen deneyimli bir e-ticaret metin yazarsın. Hedef kitle: 25-40 yaş kadın müşteriler. Ürün: el yapımı seramik kupa. Ton: sıcak ve hikaye anlatan. Format: başlık + 3 madde özellik + duygusal CTA. Maks 100 kelime.'\n\nFARK: Güçlü prompt ile üretilen içerik direkt kullanılabilir, zayıf prompt ile defalarca düzenleme gerekir."
      },
      {
        icon: "!", title: "En Çok Yapılan 3 Hata", color: "#ef4444",
        body: "HATA 1 - Belirsiz Sormak:\n'Bana bir şey anlat' yerine net hedef, format ve ton belirt. Belirsizlik = ortalama sonuç.\n\nHATA 2 - Tek Seferlik Kullanım:\nGerçek güç iterasyonda. 'Şu satırları düzenle', 'Daha kısa yap', 'B2B tona çevir' diyerek geliştir.\n\nHATA 3 - Doğrulamadan Kullanmak:\nYapay zeka yanılabilir. Özellikle tarih, istatistik ve hukuki bilgileri mutlaka doğrula."
      },
    ];
  }

  function startLesson() {
    setPhase("learn");
    setCardIndex(0);
    setCards([]);
    setLoading(true);
    setLoadProgress(0);
    setLoadError(false);

    var today = new Date().toISOString().split("T")[0];
    var profileKey = "default";

    try {

      var su = lsGet("aica_user");

      if (su) {

        var pu = JSON.parse(su);

        if (pu && pu.profile && pu.profile.profileKey) {

          profileKey = pu.profile.profileKey;

        } else if (pu && pu.profileKey) {

          profileKey = pu.profileKey;

        } else if (pu && pu.profile_key) {

          profileKey = pu.profile_key;

        }

      }

    } catch(e) {}

    console.log("profileKey:", profileKey);

    var cacheKey2 = "lesson-db-" + lesson.tool + "-" + profileKey + "-" + today;

    try {
      var lv = lsGet(cacheKey2);
      if (lv) {
        var ld = JSON.parse(lv);
        if (ld.cards && ld.cards.length > 0) {
          setCards(normalizeCards(ld.cards));
          setLoading(false);
          return;
        }
      }
    } catch(e) {}

    setLoadProgress(30);

    fetch("https://ai-proxy-two-pi.vercel.app/api/get-lesson?tool=" + encodeURIComponent(lesson.tool) + "&profile=" + encodeURIComponent(profileKey))
    .then(function(r) { return r.json(); })
    .then(function(data) {
      setLoadProgress(100);
      if (data && data.cards && data.cards.length > 0) {
        try { lsSet(cacheKey2, JSON.stringify({ cards: data.cards })); } catch(e) {}
        setCards(normalizeCards(data.cards));
        setLoading(false);
      } else {
        startLessonFallback(profileKey, cacheKey2);
      }
    })
    .catch(function() {
      startLessonFallback(profileKey, cacheKey2);
    });
  }

  function startLessonFallback(profileKey, cacheKey2) {
    setLoadProgress(0);
    var allCards = [];
    var totalBatches = 5;
    var CONCURRENT = 2;
    var completed = 0;

    var profileCtx = "Genel kullanıcı";
    if (profileKey === "baslangic_kariyer") profileCtx = "Yeni başlayan, kariyerini geliştirmek isteyen profesyonel";
    else if (profileKey === "baslangic_is") profileCtx = "Yeni başlayan, kendi işini kurmak isteyen girişimci";
    else if (profileKey === "baslangic_freelance") profileCtx = "Yeni başlayan, freelance gelir elde etmek isteyen";
    else if (profileKey === "orta_kariyer") profileCtx = "Orta seviye, kariyerinde ilerlemek isteyen profesyonel";
    else if (profileKey === "orta_is") profileCtx = "Orta seviye, işini büyütmek isteyen girişimci";
    else if (profileKey === "ileri_kariyer") profileCtx = "İleri seviye, sektöründe AI lideri olmak isteyen uzman";

    var batchPrompts = [
      "Sen dünyaca tanınan bir AI eğitim uzmanısın. " + lesson.tool + " aracını öğretiyorsun.\nÖğrenci profili: " + profileCtx + "\n\nBu profile ÖZEL 5 ders kartı üret:\n1. Bu araç bu kişi için neden önemli\n2. Bu profile özel kurulum ve ilk adımlar\n3. Bu kişinin işinde kullanabileceği en kritik özellik\n4. Bu profile özel prompt şablonları\n5. Bu kişinin sık yaptığı hatalar\n\nHer kart şu yapıda olmalı:\n- 4-5 cümle detaylı açıklama\n- Gerçek ve uygulanabilir senaryo\n- Her adımın yanında somut bir örnek\n- Pro ipucu\n\nSADECE JSON döndür:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim]\\nNe yaptı: [Somut senaryo — hangi aracı, nasıl kullandı]\\nSonuç: [Ölçülebilir, somut çıktı — süre, para, yüzde]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam olarak ne yapılır — örnek komut, tıklanacak yer veya yazılacak metin]\\n2️⃣ [Adım adı]: [Tam olarak ne yapılır — gerçek bir örnek ile göster]\\n3️⃣ [Adım adı]: [Beklenen sonuç — kullanıcı ne görmeli veya ne elde etmeli]\\n\\n⚡ Pro İpucu: [Çoğu kullanıcının bilmediği somut numara — rakam, kısayol veya hazır şablon içersin]\",\"icon\":\"emoji\"}]",
      "Sen fütürist AI danışmanısın. " + lesson.tool + " için içerik üretiyorsun.\nÖğrenci profili: " + profileCtx + "\n\nBu profile ÖZEL 5 kart üret:\n1. Bu kişi için en değerli entegrasyonlar\n2. Bu profile özel otomasyon senaryoları\n3. Bu kişinin sektöründe rekabet avantajı\n4. Gelir ve verimlilik artışı senaryoları\n5. 2025-2030 fırsatları\n\nHer kart şu yapıda olmalı:\n- 4-5 cümle detaylı açıklama\n- Gerçek ve uygulanabilir senaryo\n- Her adımın yanında somut bir örnek\n- Pro ipucu\n\nSADECE JSON döndür:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim]\\nNe yaptı: [Somut senaryo — hangi aracı, nasıl kullandı]\\nSonuç: [Ölçülebilir, somut çıktı — süre, para, yüzde]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam olarak ne yapılır — örnek komut, tıklanacak yer veya yazılacak metin]\\n2️⃣ [Adım adı]: [Tam olarak ne yapılır — gerçek bir örnek ile göster]\\n3️⃣ [Adım adı]: [Beklenen sonuç — kullanıcı ne görmeli veya ne elde etmeli]\\n\\n⚡ Pro İpucu: [Çoğu kullanıcının bilmediği somut numara — rakam, kısayol veya hazır şablon içersin]\",\"icon\":\"emoji\"}]",
      "Sen AI pedagog eğitmensin. " + lesson.tool + " için eğitim kartları üretiyorsun.\nÖğrenci profili: " + profileCtx + "\n\nBu profile ÖZEL 5 eğitim kartı üret:\n1. Bu kişi için kişiselleştirilmiş 30 günlük plan\n2. Bu profile özel pratik egzersizler\n3. Bu seviyedeki soruların cevapları\n4. Bir sonraki seviyeye geçiş yolu\n5. Bu profile özel başarı hikayeleri\n\nHer kart şu yapıda olmalı:\n- 4-5 cümle detaylı açıklama\n- Gerçek ve uygulanabilir senaryo\n- Her adımın yanında somut bir örnek\n- Pro ipucu\n\nSADECE JSON döndür:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim]\\nNe yaptı: [Somut senaryo — hangi aracı, nasıl kullandı]\\nSonuç: [Ölçülebilir, somut çıktı — süre, para, yüzde]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam olarak ne yapılır — örnek komut, tıklanacak yer veya yazılacak metin]\\n2️⃣ [Adım adı]: [Tam olarak ne yapılır — gerçek bir örnek ile göster]\\n3️⃣ [Adım adı]: [Beklenen sonuç — kullanıcı ne görmeli veya ne elde etmeli]\\n\\n⚡ Pro İpucu: [Çoğu kullanıcının bilmediği somut numara — rakam, kısayol veya hazır şablon içersin]\",\"icon\":\"emoji\"}]",
      "Sen AI vizyoner danışmanısın. " + lesson.tool + " için fütüristik kartlar üretiyorsun.\nÖğrenci profili: " + profileCtx + "\n\nBu profile ÖZEL 5 kart üret:\n1. Bu kişi için AGI yolculuğunda fırsatlar\n2. Bu kişinin mesleğinde dönüşüm\n3. Bu profile özel rekabet avantajı\n4. Etik ve sorumluluk rehberi\n5. Bu kişi için başarı hikayeleri\n\nHer kart şu yapıda olmalı:\n- 4-5 cümle detaylı açıklama\n- Gerçek ve uygulanabilir senaryo\n- Her adımın yanında somut bir örnek\n- Pro ipucu\n\nSADECE JSON döndür:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim]\\nNe yaptı: [Somut senaryo — hangi aracı, nasıl kullandı]\\nSonuç: [Ölçülebilir, somut çıktı — süre, para, yüzde]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam olarak ne yapılır — örnek komut, tıklanacak yer veya yazılacak metin]\\n2️⃣ [Adım adı]: [Tam olarak ne yapılır — gerçek bir örnek ile göster]\\n3️⃣ [Adım adı]: [Beklenen sonuç — kullanıcı ne görmeli veya ne elde etmeli]\\n\\n⚡ Pro İpucu: [Çoğu kullanıcının bilmediği somut numara — rakam, kısayol veya hazır şablon içersin]\",\"icon\":\"emoji\"}]",
      "Sen hem " + lesson.tool + " uzmanısın hem AI eğitmenisin.\nÖğrenci profili: " + profileCtx + "\n\nBu profile ÖZEL 5 kart üret:\n1. Bu kişi için en kritik özellikler\n2. Bu profile özel gelişmiş teknikler\n3. Bu kişinin hedefine özel otomasyon\n4. Bu profile özel entegrasyon rehberi\n5. Bu kişi için uzman ipuçları\n\nHer kart şu yapıda olmalı:\n- 4-5 cümle detaylı açıklama\n- Gerçek ve uygulanabilir senaryo\n- Her adımın yanında somut bir örnek\n- Pro ipucu\n\nSADECE JSON döndür:\n[{\"title\":\"başlık\",\"content\":\"2-3 cümle açıklama. Konuyu sade Türkçe ile anlat.\\n\\n💡 Gerçek Örnek:\\nKim: [Meslek ve isim]\\nNe yaptı: [Somut senaryo — hangi aracı, nasıl kullandı]\\nSonuç: [Ölçülebilir, somut çıktı — süre, para, yüzde]\\n\\n📊 Adım Adım Nasıl Yapılır:\\n1️⃣ [Adım adı]: [Tam olarak ne yapılır — örnek komut, tıklanacak yer veya yazılacak metin]\\n2️⃣ [Adım adı]: [Tam olarak ne yapılır — gerçek bir örnek ile göster]\\n3️⃣ [Adım adı]: [Beklenen sonuç — kullanıcı ne görmeli veya ne elde etmeli]\\n\\n⚡ Pro İpucu: [Çoğu kullanıcının bilmediği somut numara — rakam, kısayol veya hazır şablon içersin]\",\"icon\":\"emoji\"}]"
    ];

    function fetchBatch(batchIndex, onDone) {
      fetch(PROXY_URL, {
        method: "POST",
        headers: authJsonHeaders(),
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 4000,
          messages: [{ role: "user", content: batchPrompts[batchIndex] }]
        })
      })
      .then(function(r) {
        if (r.status === 401) { handleUnauthorized(); throw new Error("unauthorized"); }
        return r.json();
      })
      .then(function(d) {
        var text = "";
        if (d && d.content) { for (var j = 0; j < d.content.length; j++) text += d.content[j].text || ""; }
        var parsed = parseCardsFromText(text);
        if (parsed.length > 0) allCards = allCards.concat(parsed);
        onDone(true);
      })
      .catch(function() { onDone(false); });
    }

    var queue = [];
    for (var i = 0; i < totalBatches; i++) queue.push(i);
    var running = 0;
    var queueIndex = 0;
    function next() {
      while (running < CONCURRENT && queueIndex < queue.length) {
        running++;
        var batchIdx = queue[queueIndex++];
        (function(idx) {
          fetchBatch(idx, function() {
            completed++;
            running--;
            setLoadProgress(Math.round((completed / totalBatches) * 100));
            if (completed === totalBatches) {
              if (allCards.length > 0) {
                try { lsSet(cacheKey2, JSON.stringify({ cards: allCards })); } catch(e) {}
                setCards(normalizeCards(allCards));
              } else {
                setCards(getFallbackCards());
              }
              setLoading(false);
            } else {
              next();
            }
          });
        })(batchIdx);
      }
    }
    next();
  }

  function setAnswer(qi, oi) {
    var na = Object.assign({}, ans); na[qi] = oi; setAns(na);
  }

  function finish() {
    var s = 0;
    for (var i = 0; i < quiz.length; i++) { if (ans[i] === quiz[i].ans) s++; }
    var xp = xpFor(s);
    setScore(s); setEarnedXP(xp); setPhase("result");
    props.onDone(lesson.day, s, xp);
  }

  var answeredCount = Object.keys(ans).length;
  var card = cards[cardIndex];

  return (
    <div style={{ minHeight:"100vh", background:BG, color:"#fff", fontFamily:FONT }}>
      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"12px 24px", display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={function() { setPhase(""); props.onBack(); }} style={{ background:"transparent", border:"none", color:"#888899", cursor:"pointer", fontSize:18 }}>{"<"}</button>
        <span style={{ fontSize:18 }}>{lesson.icon}</span>
        <span style={{ fontWeight:700, fontSize:14 }}>{"Gün " + lesson.day + ": " + lesson.tool}</span>
        <div style={{ marginLeft:"auto", display:"flex", gap:5 }}>
          {["intro","learn","quiz","result"].map(function(pp, i) {
            return <div key={pp} style={{ width:24, height:3, borderRadius:2, background: phase===pp ? GOLD : i < ["intro","learn","quiz","result"].indexOf(phase) ? "#10a37f" : "rgba(255,255,255,0.1)" }} />;
          })}
        </div>
      </div>

      <div style={{ maxWidth:720, margin:"0 auto", padding:"32px 20px" }}>

        {phase === "intro" && <LessonIntro lesson={lesson} onDone={startLesson} />}

        {phase === "learn" && (
          <div>
            {loading ? (
              <div style={{ padding:"60px 20px", textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:20 }}>{lesson.icon}</div>
                <h3 style={{ fontWeight:700, fontSize:18, marginBottom:6 }}>{lesson.tool + " dersi hazırlanıyor"}</h3>
                <p style={{ color:"#888899", fontSize:13, marginBottom:32 }}>Yapay zeka kapsamlı ders içeriği oluşturuyor...</p>
                <div style={{ maxWidth:360, margin:"0 auto", marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:12, color:"#555577" }}>
                    <span>İçerik üretiliyor</span>
                    <span style={{ color:GOLD, fontFamily:FONT_MONO, fontWeight:700 }}>{loadProgress + "%"}</span>
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:100, height:10, overflow:"hidden" }}>
                    <div style={{ width:loadProgress+"%", height:"100%", background:"linear-gradient(90deg,#d4a853,#f0c060)", borderRadius:100, transition:"width 0.4s ease" }} />
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
                  {["Tarihçe","Özellikler","Kullanım","Promptlar","İpuçları","Hatalar"].map(function(s, i) {
                    return (
                      <div key={s} style={{ fontSize:11, padding:"4px 10px", borderRadius:20, background: loadProgress > i*15 ? "rgba(212,168,83,0.2)" : "rgba(255,255,255,0.04)", border:"1px solid "+(loadProgress>i*15?"rgba(212,168,83,0.4)":"rgba(255,255,255,0.07)"), color: loadProgress>i*15 ? GOLD : "#444466" }}>
                        {(loadProgress > i*15 ? "v " : "o ") + s}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : loadError ? (
              <div style={{ textAlign:"center", padding:60 }}>
                <div style={{ fontSize:48, marginBottom:16 }}>!</div>
                <h3 style={{ color:"#ef4444", fontWeight:700, marginBottom:8 }}>Baglanti Hatası</h3>
                <p style={{ color:"#888899", fontSize:13, marginBottom:24 }}>Proxy URL'nin doğru ayarlandığını kontrol et.</p>
                <button onClick={startLesson} style={{ background:"linear-gradient(135deg,#d4a853,#f0c060)", color:"#08080f", border:"none", borderRadius:10, padding:"12px 28px", fontWeight:700, cursor:"pointer", fontSize:14 }}>Tekrar Dene</button>
              </div>
            ) : cards.length > 0 ? (
              <div>
                <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:4, height:6, overflow:"hidden", marginBottom:16 }}>
                  <div style={{ width:(((cardIndex+1)/cards.length)*100)+"%", height:"100%", background:"linear-gradient(90deg,#c9a84c,#f5cc6a,#7c5cfc)", borderRadius:4, transition:"width 0.4s ease" }} />
                </div>
                <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
                  <span style={{ display:"inline-block", padding:"4px 12px", background:"rgba(201,168,76,0.15)", color:GOLD2, fontFamily:FONT_MONO, fontSize:12, fontWeight:700, borderRadius:8, border:"1px solid rgba(201,168,76,0.3)", letterSpacing:"0.5px" }}>{(cardIndex+1).toString().padStart(2,"0") + " / " + cards.length.toString().padStart(2,"0")}</span>
                </div>
                {card && (
                  <div style={{ background:"linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border:"1px solid rgba(255,255,255,0.12)", borderRadius:20, padding:28, marginBottom:20, minHeight:280, boxShadow:"0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)", transition:"all 0.2s ease" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, paddingBottom:16, borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:(card.color||GOLD)+"22", border:"1px solid "+(card.color||GOLD)+"55", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:card.color||GOLD2, fontSize:18, flexShrink:0 }}>{card.icon}</div>
                      <div>
                        <h2 style={{ fontSize:17, fontWeight:700, color:GOLD2, margin:0, letterSpacing:"-0.01em" }}>{card.title}</h2>
                        <div style={{ fontSize:11, color:TEXT2, marginTop:3, fontFamily:FONT_MONO }}>{lesson.tool}</div>
                      </div>
                    </div>
                    <div style={{ fontSize:15, color:TEXT, lineHeight:1.8, fontFamily:FONT }}>
                      {renderCardContent(card.body)}
                    </div>
                  </div>
                )}
                <div style={{ display:"flex", gap:12 }}>
                  {cardIndex > 0 && (
                    <button onClick={function() { setCardIndex(cardIndex - 1); }}
                      style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid "+CARD_BORDER2, borderRadius:12, padding:"14px 0", fontSize:14, color:TEXT2, cursor:"pointer", transition:"all 0.2s ease", fontFamily:FONT, fontWeight:600 }}>
                      Geri
                    </button>
                  )}
                  {cardIndex < cards.length - 1 ? (
                    <button onClick={function() { setCardIndex(cardIndex + 1); }}
                      onMouseEnter={function(e){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(201,168,76,0.4)"; }}
                      onMouseLeave={function(e){ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=SHADOW_GOLD; }}
                      style={{ flex:2, background:"linear-gradient(135deg,#c9a84c,#f5cc6a)", color:"#08080f", border:"none", borderRadius:14, padding:"16px 0", fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:SHADOW_GOLD, transition:"all 0.2s ease", fontFamily:FONT, letterSpacing:"0.3px" }}>
                      Anladin, Devam Et
                    </button>
                  ) : (
                    <button onClick={function() { setPhase("quiz"); }}
                      onMouseEnter={function(e){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(0,201,167,0.4)"; }}
                      onMouseLeave={function(e){ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 24px rgba(0,201,167,0.25)"; }}
                      style={{ flex:2, background:"linear-gradient(135deg,#00c9a7,#10a37f)", color:"#04150f", border:"none", borderRadius:14, padding:"16px 0", fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 24px rgba(0,201,167,0.25)", transition:"all 0.2s ease", fontFamily:FONT, letterSpacing:"0.3px" }}>
                      Sinava Geç
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {phase === "quiz" && (
          <div>
            <h2 style={{ fontSize:24, fontWeight:800, marginBottom:6, color:TEXT, letterSpacing:"-0.01em" }}>{lesson.tool + " Sınavı"}</h2>
            <p style={{ color:TEXT2, fontSize:13, marginBottom:28, fontFamily:FONT_MONO }}>{"5 soru · +" + xpFor(1) + " XP / doğru"}</p>
            {quiz.map(function(q, qi) {
              return (
                <div key={qi} style={{ background:"linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border:"1px solid "+CARD_BORDER2, borderRadius:20, padding:24, marginBottom:18, boxShadow:"0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
                  <div style={{ display:"flex", gap:10, alignItems:"baseline", marginBottom:16 }}>
                    <span style={{ fontFamily:FONT_MONO, fontSize:12, color:GOLD2, fontWeight:700, padding:"3px 10px", background:"rgba(201,168,76,0.15)", borderRadius:8, border:"1px solid rgba(201,168,76,0.3)" }}>{"Q"+(qi+1).toString().padStart(2,"0")}</span>
                    <p style={{ fontWeight:600, lineHeight:1.5, fontSize:15, color:TEXT, margin:0, flex:1 }}>{q.q}</p>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {q.opts.map(function(opt, oi) {
                      var selected = ans[qi] === oi;
                      var letters = ["A","B","C","D"];
                      var optColors = ["#c9a84c","#7c5cfc","#00c9a7","#ec4899"];
                      return (
                        <div key={oi} onClick={function() { setAnswer(qi, oi); }}
                          onMouseEnter={function(e){ if(!selected){ e.currentTarget.style.transform="scale(1.02)"; e.currentTarget.style.borderColor=CARD_BORDER2; } }}
                          onMouseLeave={function(e){ if(!selected){ e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.borderColor=CARD_BORDER; } }}
                          style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, border:"1px solid "+(selected?GOLD:CARD_BORDER), background: selected ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.03)", cursor:"pointer", fontSize:14, color: selected ? GOLD2 : TEXT, transition:"all 0.2s ease", boxShadow: selected ? "0 0 0 1px "+GOLD+", 0 4px 16px rgba(201,168,76,0.2)" : "none", fontFamily:FONT }}>
                          <div style={{ width:34, height:34, borderRadius:10, background: selected ? "linear-gradient(135deg,#c9a84c,#f5cc6a)" : "rgba(255,255,255,0.05)", color: selected ? "#08080f" : optColors[oi], display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontFamily:FONT_MONO, fontSize:14, flexShrink:0, border: selected ? "none" : "1px solid "+optColors[oi]+"55" }}>{letters[oi]}</div>
                          <span style={{ flex:1 }}>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <button onClick={finish} disabled={answeredCount < quiz.length}
              onMouseEnter={function(e){ if(answeredCount>=quiz.length){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(201,168,76,0.4)"; } }}
              onMouseLeave={function(e){ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow= answeredCount>=quiz.length ? SHADOW_GOLD : "none"; }}
              style={{ width:"100%", background: answeredCount < quiz.length ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#c9a84c,#f5cc6a)", color: answeredCount < quiz.length ? TEXT2 : "#08080f", border: answeredCount < quiz.length ? "1px solid "+CARD_BORDER2 : "none", borderRadius:14, padding:"16px 0", fontSize:15, fontWeight:700, cursor: answeredCount < quiz.length ? "not-allowed" : "pointer", boxShadow: answeredCount < quiz.length ? "none" : SHADOW_GOLD, transition:"all 0.2s ease", fontFamily:FONT, letterSpacing:"0.3px" }}>
              {answeredCount < quiz.length ? ((quiz.length - answeredCount) + " soru kaldı") : "Sınavı Bitir"}
            </button>
          </div>
        )}

        {phase === "result" && (
          <div style={{ textAlign:"center", paddingTop:32 }}>
            <div style={{ fontSize:68, marginBottom:18 }}>{score >= 4 ? "Mükemmel" : score >= 3 ? "İyi" : "Tekrar"}</div>
            <h2 style={{ fontSize:30, fontWeight:800, marginBottom:8, color:TEXT, letterSpacing:"-0.02em" }}>{score >= 4 ? "Mükemmel!" : score >= 3 ? "İyi İş!" : "Biraz Daha Çalış!"}</h2>
            <div style={{ fontSize:64, fontWeight:800, background:"linear-gradient(135deg,#f5cc6a,#7c5cfc)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", fontFamily:FONT_MONO, margin:"18px 0", letterSpacing:"-0.04em" }}>{score + "/5"}</div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"rgba(201,168,76,0.12)", border:"1px solid rgba(201,168,76,0.35)", borderRadius:12, padding:"12px 24px", marginBottom:28, fontSize:16, fontWeight:700, color:GOLD2, boxShadow:SHADOW_GOLD }}>
              {"+" + earnedXP + " XP Kazandın!"}
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:32 }}>
              {[0,1,2,3,4].map(function(i) {
                return <div key={i} style={{ width:40, height:40, borderRadius:10, background: i < score ? "linear-gradient(135deg,#c9a84c,#f5cc6a)" : "rgba(255,255,255,0.05)", border:"1px solid "+(i<score?"rgba(201,168,76,0.5)":CARD_BORDER), display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color: i < score ? "#08080f" : TEXT2, transition:"all 0.3s ease" }}>{i < score ? "✓" : "·"}</div>;
              })}
            </div>
            <button onClick={props.onBack}
              onMouseEnter={function(e){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(201,168,76,0.4)"; }}
              onMouseLeave={function(e){ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=SHADOW_GOLD; }}
              style={{ background:"linear-gradient(135deg,#c9a84c,#f5cc6a)", color:"#08080f", border:"none", borderRadius:14, padding:"14px 44px", fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:SHADOW_GOLD, transition:"all 0.2s ease", fontFamily:FONT, letterSpacing:"0.3px" }}>
              Dashboard'a Dön
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
function Auth(props) {
  var [tab, setTab] = useState("login");
  var [name, setName] = useState("");
  var [email, setEmail] = useState("");
  var [pass, setPass] = useState("");
  var [pass2, setPass2] = useState("");
  var [terms, setTerms] = useState(false);
  var [err, setErr] = useState("");
  var [loading, setLoading] = useState(false);
  var [showAdmin, setShowAdmin] = useState(false);
  var [verifyCode, setVerifyCode] = useState(null); // generated code (string) while verifying
  var [codeInput, setCodeInput] = useState("");
  var [pendingUser, setPendingUser] = useState(null);
  var [info, setInfo] = useState("");
  var [couponCode, setCouponCode] = useState("");
  var [couponResult, setCouponResult] = useState(null);
  var [couponLoading, setCouponLoading] = useState(false);
  var [resetMode, setResetMode] = useState(false);
  var [resetEmail2, setResetEmail2] = useState("");
  var [resetSent2, setResetSent2] = useState(false);
  var [resetLoading2, setResetLoading2] = useState(false);

  function applyCoupon(emailVal) {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    fetch(USERS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify-coupon", couponCode: couponCode.trim(), email: emailVal || email })
    })
      .then(function(r) { return r.json(); })
      .then(function(d) { setCouponResult(d); setCouponLoading(false); })
      .catch(function() { setCouponResult({ ok: false, reason: "error" }); setCouponLoading(false); });
  }

  function submit() {
    setErr("");
    setInfo("");
    if (!email || !pass) { setErr("Tüm alanlari doldurun"); return; }
    if (tab !== "register" && email.toLowerCase().trim() === ADMIN_EMAIL) {
      fetch("https://ai-proxy-two-pi.vercel.app/api/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), pass: pass })
      })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d && d.ok && d.token && d.user && d.user.admin) { setAuthToken(d.token); setShowAdmin(true); }
          else { setErr("Hatalı yönetici şifresi"); }
        })
        .catch(function() { setErr("Sunucuya ulaşılamadı"); });
      return;
    }
    // Test kullanıcıları: ödeme atlanır, doğru planla giriş yapılır
    var emailKey = (email || "").toLowerCase();
    var testUser = TEST_USERS[emailKey];
    if (testUser && tab === "login") {
      if (pass !== testUser.pass) { setErr("Hatalı şifre"); return; }
      var planObj = PLANS.find(function(p) { return p.name === testUser.plan; }) || PLANS[0];
      var tu = {
        name: testUser.name, email: emailKey,
        plan: planObj, paid: true,
        progress: {}, scores: {}, xp: 0, streak: 0,
        createdAt: Date.now(),
      };
      addToRegistry(emailKey, tu);
      props.onLogin(tu);
      return;
    }
    if (pass.length < 6) { setErr("Şifre en az 6 karakter"); return; }
    if (tab === "register") {
      if (!name) { setErr("Ad Soyad gerekli"); return; }
      if (email.indexOf("@") < 0) { setErr("Geçerli email girin"); return; }
      if (pass !== pass2) { setErr("Şifreler eşleşmiyor"); return; }
      if (!terms) { setErr("Devam etmek için koşulları kabul et"); return; }
      if (emailExists(email)) { setErr("Bu email zaten kayıtlı. Giriş Yap'a geç."); return; }
      setLoading(true);
      setTimeout(function() {
        setLoading(false);
        var userData = {
          name: name, email: email, pass: pass,
          plan: null, paid: false,
          progress: {}, scores: {}, xp: 0, streak: 0,
          createdAt: Date.now(),
          coupon: couponResult && couponResult.ok ? {
            code: couponResult.code,
            discount: couponResult.discount,
            isFree: couponResult.isFree || couponResult.discount === 100
          } : null,
        };
        // Generate 6-digit verification code (simulated email send)
        var code = String(Math.floor(100000 + Math.random() * 900000));
        setVerifyCode(code);
        try { fetch(USERS_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send-verify-code", email: email.toLowerCase().trim(), code: code }) }).catch(function() {}); } catch(e) {}
        setPendingUser(userData);
        setCodeInput("");
        setInfo("Doğrulama kodu " + email + " adresine gönderildi.");
      }, 800);
    } else {
      setLoading(true);
      fetch("https://ai-proxy-two-pi.vercel.app/api/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), pass: pass })
      })
        .then(function(r) { if (r.status === 401) { setLoading(false); setErr("Hatalı e-posta veya şifre"); return null; } return r.json(); })
        .then(function(data) {
          if (!data) return;
          setLoading(false);
          if (data.ok === true && data.token) {
            setAuthToken(data.token);
            var du = data.user || {};
            if (du.admin) { setShowAdmin(true); return; }
            var PLAN_MAP = { "Starter": PLANS[0], "Pro": PLANS[1], "Business": PLANS[2] };
            var loggedUser = { name: du.name || "", email: (du.email || email).toLowerCase().trim(), plan: PLAN_MAP[du.plan] || PLANS[0], paid: true, profileKey: du.profileKey || "default", profile: { profileKey: du.profileKey || "default" }, profile_key: du.profileKey || "default", xp: du.xp || 0, streak: du.streak || 0, progress: du.progress || {}, scores: du.scores || {} };
            addToRegistry(loggedUser.email, loggedUser);
            props.onLogin(loggedUser);
            return;
          }
          setErr("Hatalı e-posta veya şifre");
        })
        .catch(function() { setLoading(false); setErr("Sunucu hatası. Tekrar deneyin."); });
    }
  }

  function verifySubmit(force) {
    setErr("");
    if (!force && (!codeInput || codeInput.length !== 6)) { setErr("6 haneli kodu gir"); return; }
    if (!force && codeInput !== verifyCode) { setErr("Kod hatalı. Tekrar dene."); return; }
    setLoading(true);
    setTimeout(function() {
      setLoading(false);
      if (pendingUser) addToRegistry(pendingUser.email, pendingUser);
      if (pendingUser && pendingUser.email) {
        try { fetch(USERS_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "register", user: pendingUser }) }).catch(function() {}); } catch(e) {}
      }
      // Bedava erişim kuponu varsa kayıt akışını onRegister'a yönlendir
      if (pendingUser && pendingUser.coupon && pendingUser.coupon.isFree && props.onRegister) {
        var freeRegUser = Object.assign({}, pendingUser);
        setVerifyCode(null);
        setPendingUser(null);
        setCodeInput("");
        setName("");
        setPass("");
        setPass2("");
        setTerms(false);
        setCouponCode("");
        setCouponResult(null);
        props.onRegister(freeRegUser);
        return;
      }
      // Reset & switch to login with email prefilled
      var savedEmail = pendingUser ? pendingUser.email : email;
      setVerifyCode(null);
      setPendingUser(null);
      setCodeInput("");
      setName("");
      setPass("");
      setPass2("");
      setTerms(false);
      setTab("login");
      setEmail(savedEmail);
      setInfo("Hesabın doğrulandı! Şifrenle giriş yap.");
    }, 500);
  }

  function resendCode() {
    var code = String(Math.floor(100000 + Math.random() * 900000));
    try { fetch(USERS_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send-verify-code", email: email.toLowerCase().trim(), code: code }) }).catch(function() {}); } catch(e) {}
    setVerifyCode(code);
    setCodeInput("");
    setInfo("Yeni kod gönderildi.");
    setErr("");
  }

  function cancelVerify() {
    setVerifyCode(null);
    setPendingUser(null);
    setCodeInput("");
    setInfo("");
    setErr("");
  }

  if (showAdmin) {
    return <AdminPanel onLogout={function() { setShowAdmin(false); setEmail(""); setPass(""); }} />;
  }

  function tabBtn(id, label) {
    var active = tab === id;
    return (
      <button onClick={function() { setTab(id); setErr(""); setInfo(""); }}
        style={{ flex:1, background: active ? "rgba(201,168,76,0.12)" : "transparent", color: active ? GOLD2 : TEXT2, border:"none", borderBottom: active ? "2px solid "+GOLD : "2px solid transparent", padding:"14px 0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT, textTransform:"uppercase", letterSpacing:"1px", transition:"all 0.2s ease" }}>
        {label}
      </button>
    );
  }

  if (resetMode) {
    return (
      <div style={{ minHeight:"100vh", background:BG, color:TEXT, fontFamily:FONT, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div style={{ width:"100%", maxWidth:440, background:"rgba(13,13,31,0.95)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:24, padding:40, boxShadow:SHADOW }}>
          {!resetSent2 ? (
            <div>
              <h2 style={{ color:"#fff", fontWeight:700, marginBottom:8, fontSize:19 }}>🔑 Şifre Sıfırlama</h2>
              <p style={{ color:TEXT2, fontSize:13, marginBottom:20, lineHeight:1.5 }}>E-posta adresinize sıfırlama bağlantısı gönderilecek</p>
              <input
                value={resetEmail2}
                onChange={function(e) { setResetEmail2(e.target.value); }}
                placeholder="ornek@ornek.com"
                type="email"
                style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"14px 16px", color:"#fff", fontSize:15, outline:"none", marginBottom:12, boxSizing:"border-box", fontFamily:FONT }}
              />
              <button
                disabled={resetLoading2}
                onClick={function() {
                  var em = (resetEmail2 || "").toLowerCase().trim();
                  if (!em || em.indexOf("@") < 0) { if (typeof alert !== "undefined") alert("Geçerli e-posta girin"); return; }
                  setResetLoading2(true);
                  if (typeof fetch === "undefined") { setResetSent2(true); setResetLoading2(false); return; }
                  fetch(USERS_API, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "reset-password", email: em })
                  })
                    .then(function(r) { return r.json(); })
                    .then(function(d) { console.log("reset resp", d); setResetSent2(true); setResetLoading2(false); })
                    .catch(function(e) { console.error("reset err", e); setResetSent2(true); setResetLoading2(false); });
                }}
                style={{ width:"100%", background:"linear-gradient(135deg,#d4a853,#f0c060)", color:"#08080f", border:"none", borderRadius:12, padding:"14px", fontSize:15, fontWeight:700, cursor: resetLoading2 ? "not-allowed" : "pointer", marginBottom:10, fontFamily:FONT }}>
                {resetLoading2 ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
              </button>
              <button
                onClick={function() { setResetMode(false); setResetSent2(false); setResetEmail2(""); }}
                style={{ width:"100%", background:"transparent", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"12px", color:TEXT2, fontSize:13, cursor:"pointer", fontFamily:FONT }}>
                Geri Dön
              </button>
            </div>
          ) : (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📧</div>
              <h3 style={{ color:"#fff", fontSize:17, fontWeight:700, marginBottom:10 }}>E-posta Gönderildi!</h3>
              <p style={{ color:"#bbbbcc", fontSize:13, marginBottom:18, lineHeight:1.5 }}>
                <strong style={{ color:GOLD2 }}>{resetEmail2}</strong> adresine sıfırlama bağlantısı gönderildi.
              </p>
              <button
                onClick={function() { setResetMode(false); setResetSent2(false); setResetEmail2(""); }}
                style={{ width:"100%", background:"linear-gradient(135deg,#d4a853,#f0c060)", color:"#08080f", border:"none", borderRadius:12, padding:"13px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:FONT }}>
                Giriş Ekranına Dön
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:BG, color:TEXT, fontFamily:FONT, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backgroundImage:"radial-gradient(ellipse at 50% 0%,rgba(124,92,252,0.18) 0%,rgba(201,168,76,0.08) 35%,transparent 70%), radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize:"auto, 32px 32px" }}>
      <div style={{ width:"100%", maxWidth:440 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:44, fontWeight:800, background:"linear-gradient(135deg,#f5cc6a,#7c5cfc)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", lineHeight:1 }}>AI</div>
          <div style={{ fontSize:17, fontWeight:600, color:TEXT, marginTop:4 }}>Certification Academy</div>
        </div>
        <div style={{ background:"rgba(13,13,31,0.95)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:24, overflow:"hidden", boxShadow:SHADOW }}>
          {verifyCode ? (
            <div style={{ padding:40 }}>
              <div style={{ textAlign:"center", marginBottom:24 }}>
                <div style={{ fontSize:40, marginBottom:10 }}>✉️</div>
                <div style={{ fontSize:20, fontWeight:800, color:TEXT, marginBottom:6 }}>Email Doğrulama</div>
                <div style={{ fontSize:13, color:TEXT2, lineHeight:1.5 }}>
                  <span style={{ color:GOLD2, fontWeight:600 }}>{pendingUser ? pendingUser.email : email}</span> adresine gönderdiğimiz 6 haneli kodu gir.
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", color:TEXT2, fontSize:11, fontWeight:600, marginBottom:8, textTransform:"uppercase", letterSpacing:"1px" }}>Doğrulama Kodu</label>
                <input type="text" inputMode="numeric" maxLength={6} value={codeInput}
                  onChange={function(e) { setCodeInput((e.target.value || "").replace(/\D/g,"").slice(0,6)); }}
                  onKeyDown={function(e){ if(e.key==="Enter") verifySubmit(); }}
                  onFocus={function(e){ e.currentTarget.style.borderColor=GOLD; }}
                  onBlur={function(e){ e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"; }}
                  style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"16px", color:"#fff", fontSize:24, letterSpacing:"10px", textAlign:"center", outline:"none", boxSizing:"border-box", fontFamily:FONT_MONO, fontWeight:700, transition:"border-color 0.2s ease" }} />
              </div>
              {info && <div style={{ color:"#10a37f", fontSize:12, marginBottom:12, padding:"10px 12px", background:"rgba(16,163,127,0.08)", border:"1px solid rgba(16,163,127,0.25)", borderRadius:10 }}>{info}</div>}
              {err && <div style={{ color:"#ef4444", fontSize:12, marginBottom:12, padding:"10px 12px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10 }}>{err}</div>}
              <button onClick={verifySubmit} disabled={loading}
                style={{ width:"100%", background: loading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#c9a84c,#f5cc6a)", color: loading ? TEXT2 : "#08080f", border:"none", borderRadius:14, padding:"15px 0", fontSize:15, fontWeight:700, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : SHADOW_GOLD, transition:"all 0.2s ease", fontFamily:FONT, marginBottom:10 }}>
                {loading ? "Doğrulanıyor..." : "Doğrula ve Devam Et"}
              </button>
              <button onClick={function() { verifySubmit(true); }} style={{ width:"100%", background:"none", border:"none", color:"#888899", textDecoration:"underline", cursor:"pointer", fontSize:13, marginTop:12, fontFamily:FONT }}>E-posta doğrulamayı şimdilik atla →</button>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginTop:6 }}>
                <button onClick={cancelVerify} style={{ background:"transparent", border:"none", color:TEXT2, cursor:"pointer", fontFamily:FONT, padding:0 }}>← Geri</button>
                <button onClick={resendCode} style={{ background:"transparent", border:"none", color:GOLD, cursor:"pointer", fontFamily:FONT, padding:0, fontWeight:600 }}>Kodu Tekrar Gönder</button>
              </div>
            </div>
          ) : (
          <>
          <div style={{ display:"flex", borderBottom:"1px solid "+CARD_BORDER }}>
            {tabBtn("login", "Giriş Yap")}
            {tabBtn("register", "Kayıt Ol")}
          </div>
          <div style={{ padding:40 }}>
            {tab === "register" && (
              <div style={{ marginBottom:18 }}>
                <label style={{ display:"block", color:TEXT2, fontSize:11, fontWeight:600, marginBottom:8, textTransform:"uppercase", letterSpacing:"1px" }}>Ad Soyad</label>
                <input type="text" value={name} onChange={function(e) { setName(e.target.value); }}
                  onFocus={function(e){ e.currentTarget.style.borderColor=GOLD; }}
                  onBlur={function(e){ e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"; }}
                  style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"14px 16px", color:"#fff", fontSize:15, outline:"none", boxSizing:"border-box", fontFamily:FONT, transition:"border-color 0.2s ease" }} />
              </div>
            )}
            <div style={{ marginBottom:18 }}>
              <label style={{ display:"block", color:TEXT2, fontSize:11, fontWeight:600, marginBottom:8, textTransform:"uppercase", letterSpacing:"1px" }}>Email</label>
              <input type="email" value={email} onChange={function(e) { setEmail(e.target.value); }}
                onFocus={function(e){ e.currentTarget.style.borderColor=GOLD; }}
                onBlur={function(e){ e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"; }}
                style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"14px 16px", color:"#fff", fontSize:15, outline:"none", boxSizing:"border-box", fontFamily:FONT, transition:"border-color 0.2s ease" }} />
            </div>
            <div style={{ marginBottom:18 }}>
              <label style={{ display:"block", color:TEXT2, fontSize:11, fontWeight:600, marginBottom:8, textTransform:"uppercase", letterSpacing:"1px" }}>Şifre</label>
              <input type="password" value={pass} onChange={function(e) { setPass(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") submit(); }}
                onFocus={function(e){ e.currentTarget.style.borderColor=GOLD; }}
                onBlur={function(e){ e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"; }}
                style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"14px 16px", color:"#fff", fontSize:15, outline:"none", boxSizing:"border-box", fontFamily:FONT, transition:"border-color 0.2s ease" }} />
              {tab === "login" && (
                <div style={{ textAlign:"right", marginTop:8 }}>
                  <button type="button" onClick={function() { setResetMode(true); setResetEmail2(email); setResetSent2(false); }}
                    style={{ background:"transparent", border:"none", color:GOLD2, cursor:"pointer", fontSize:12, padding:0, textDecoration:"underline", fontFamily:FONT }}>
                    Şifremi unuttum
                  </button>
                </div>
              )}
            </div>
            {tab === "register" && (
              <div style={{ marginBottom:18 }}>
                <label style={{ display:"block", color:TEXT2, fontSize:11, fontWeight:600, marginBottom:8, textTransform:"uppercase", letterSpacing:"1px" }}>Şifre (Tekrar)</label>
                <input type="password" value={pass2} onChange={function(e) { setPass2(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter") submit(); }}
                  onFocus={function(e){ e.currentTarget.style.borderColor=GOLD; }}
                  onBlur={function(e){ e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"; }}
                  style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"14px 16px", color:"#fff", fontSize:15, outline:"none", boxSizing:"border-box", fontFamily:FONT, transition:"border-color 0.2s ease" }} />
              </div>
            )}
            {tab === "register" && (
              <label style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:18, cursor:"pointer", color:TEXT2, fontSize:12, lineHeight:1.5, fontFamily:FONT }}>
                <input type="checkbox" checked={terms} onChange={function(e){ setTerms(e.target.checked); }}
                  style={{ marginTop:2, accentColor:GOLD, width:16, height:16, cursor:"pointer" }} />
                <span><span style={{ color:GOLD2 }}>Kullanım Koşulları</span> ve <span style={{ color:GOLD2 }}>Gizlilik Politikasını</span> okudum, kabul ediyorum.</span>
              </label>
            )}
            {tab === "register" && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, color:"#888899", marginBottom:8, fontWeight:600, textTransform:"uppercase", letterSpacing:1 }}>
                  Kupon Kodun Var Mı? (Opsiyonel)
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <input
                    value={couponCode}
                    onChange={function(e) { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
                    placeholder="KUPON KODU"
                    style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"12px 14px", color:"#fff", fontSize:13, outline:"none", fontFamily:"monospace", letterSpacing:2 }}
                  />
                  <button
                    onClick={function(e) { e.preventDefault(); applyCoupon(email); }}
                    disabled={couponLoading || !couponCode.trim()}
                    style={{ background: couponLoading || !couponCode.trim() ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#c9a84c,#f5cc6a)", color: couponLoading || !couponCode.trim() ? "#555577" : "#08080f", border:"none", borderRadius:10, padding:"12px 18px", fontSize:13, fontWeight:700, cursor: couponLoading || !couponCode.trim() ? "not-allowed" : "pointer", whiteSpace:"nowrap" }}>
                    {couponLoading ? "..." : "Uygula"}
                  </button>
                </div>
                {couponResult && couponResult.ok && (
                  <div style={{ marginTop:8, background:"rgba(16,163,127,0.1)", border:"1px solid rgba(16,163,127,0.3)", borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:16 }}>✅</span>
                    <span style={{ fontSize:13, color:"#10a37f", fontWeight:600 }}>
                      {couponResult.isFree || couponResult.discount === 100
                        ? "Bedava erişim kuponu! Kayıt sonrası otomatik uygulanacak."
                        : "%" + couponResult.discount + " indirim kuponu uygulandı!"}
                    </span>
                  </div>
                )}
                {couponResult && !couponResult.ok && (
                  <div style={{ marginTop:8, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:16 }}>❌</span>
                    <span style={{ fontSize:13, color:"#ef4444" }}>
                      {couponResult.message || "Geçersiz veya kullanılmış kupon kodu"}
                    </span>
                  </div>
                )}
              </div>
            )}
            {info && <div style={{ color:"#10a37f", fontSize:12, marginBottom:12, padding:"10px 12px", background:"rgba(16,163,127,0.08)", border:"1px solid rgba(16,163,127,0.25)", borderRadius:10 }}>{info}</div>}
            {err && <div style={{ color:"#ef4444", fontSize:12, marginBottom:14, padding:"10px 12px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10 }}>{err}</div>}
            <button onClick={submit} disabled={loading}
              onMouseEnter={function(e){ if(!loading){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 8px 32px rgba(201,168,76,0.4)"; } }}
              onMouseLeave={function(e){ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=SHADOW_GOLD; }}
              style={{ width:"100%", background: loading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#c9a84c,#f5cc6a)", color: loading ? TEXT2 : "#08080f", border:"none", borderRadius:14, padding:"15px 0", fontSize:15, fontWeight:700, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : SHADOW_GOLD, transition:"all 0.2s ease", fontFamily:FONT, letterSpacing:"0.3px" }}>
              {loading ? "Lütfen bekleyin..." : (tab === "register" ? "Kayıt Ol" : "Giriş Yap")}
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanSelect(props) {
  return PlanSelectInner(props);
}

function CouponPanel() {
  var [coupons, setCoupons] = useState([]);
  var [loading, setLoading] = useState(true);
  useEffect(function() {
    fetch(USERS_API, {
      method: "POST",
      headers: authJsonHeaders(),
      body: JSON.stringify({ action: "list-coupons" })
    })
      .then(function(r) { return r.json(); })
      .then(function(d) { setCoupons(d.coupons || []); setLoading(false); })
      .catch(function() { setLoading(false); });
  }, []);
  function discountColor(d) {
    if (d >= 100) return "#10a37f";
    if (d >= 50) return "#f59e0b";
    if (d >= 25) return "#6366f1";
    return "#888899";
  }
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:24, gridColumn:"1 / -1" }}>
      <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:6 }}>🎟️ Kupon Kodları</div>
      <div style={{ fontSize:12, color:"#666677", marginBottom:20 }}>Vercel → Environment Variables → COUPONS üzerinden yönetilir</div>
      {loading ? (
        <div style={{ color:"#888899", fontSize:13 }}>Yükleniyor...</div>
      ) : coupons.length === 0 ? (
        <div style={{ color:"#888899", fontSize:13 }}>Henüz kupon tanımlanmamış</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {coupons.map(function(c, i) {
            var dc = discountColor(c.discount);
            var usedCount = (c.usedBy || []).length;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, flexWrap:"wrap", gap:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                  <div style={{ fontFamily:"monospace", fontSize:15, fontWeight:800, color:"#fff", letterSpacing:2, background:"rgba(255,255,255,0.06)", padding:"6px 14px", borderRadius:8, border:"1px dashed rgba(255,255,255,0.15)" }}>{c.code}</div>
                  {c.assignedTo && <span style={{ fontSize:11, color:"#a5b4fc", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.25)", borderRadius:20, padding:"3px 10px" }}>👤 {c.assignedTo}</span>}
                  {c.maxUses && <span style={{ fontSize:11, color:"#888899" }}>Kullanım: {usedCount}/{c.maxUses}</span>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ fontSize:20, fontWeight:800, color:dc }}>{c.type === "free" || c.discount === 100 ? "🆓 Bedava" : "%" + c.discount}</div>
                  <span style={{ background: c.active ? "rgba(16,163,127,0.15)" : "rgba(239,68,68,0.1)", color: c.active ? "#10a37f" : "#ef4444", border:"1px solid "+(c.active ? "rgba(16,163,127,0.3)" : "rgba(239,68,68,0.25)"), borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>{c.active ? "● Aktif" : "● Pasif"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop:16, fontSize:11, color:"#444466" }}>💡 Yeni kupon eklemek için Vercel → Environment Variables → COUPONS değerini güncelle ve redeploy yap</div>
    </div>
  );
}

function PlanSelectInner(props) {
  var [couponCode, setCouponCode] = useState("");
  var [couponResult, setCouponResult] = useState(null);
  var [couponLoading, setCouponLoading] = useState(false);

  var userCoupon = null;
  try { var suPC = lsGet("aica-user"); if (suPC) { var puPC = JSON.parse(suPC); userCoupon = puPC.coupon || null; } } catch(e) {}

  function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    var userEmail = "";
    try { var su = lsGet("aica_user"); if (su) { var u = JSON.parse(su); userEmail = u.email || ""; } } catch(e) {}
    fetch(USERS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify-coupon", couponCode: couponCode.trim(), email: userEmail })
    })
      .then(function(r) { return r.json(); })
      .then(function(d) { setCouponResult(d); setCouponLoading(false); })
      .catch(function() { setCouponResult({ ok: false, reason: "error" }); setCouponLoading(false); });
  }

  return (
    <div style={{ minHeight:"100vh", background:BG, color:TEXT, fontFamily:FONT, padding:"60px 20px", backgroundImage:"radial-gradient(ellipse at 50% 0%,rgba(124,92,252,0.15) 0%,rgba(201,168,76,0.08) 35%,transparent 70%), radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize:"auto, 32px 32px" }}>
      <div style={{ maxWidth:1000, margin:"0 auto" }}>
        <h2 style={{ textAlign:"center", fontSize:36, fontWeight:800, marginBottom:12, background:"linear-gradient(135deg,#f5cc6a,#7c5cfc)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", letterSpacing:"-0.02em" }}>Planını Seç</h2>
        <p style={{ textAlign:"center", color:TEXT2, marginBottom:44, fontSize:14, fontFamily:FONT }}>Hedefine uygun plani seç ve bugün başla</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:22 }}>
          {PLANS.map(function(plan) {
            return (
              <div key={plan.name}
                onMouseEnter={function(e){ e.currentTarget.style.transform="translateY(-4px)"; }}
                onMouseLeave={function(e){ e.currentTarget.style.transform="translateY(0)"; }}
                style={{ background: plan.popular ? "linear-gradient(145deg, rgba(201,168,76,0.12), rgba(124,92,252,0.06))" : "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))", border:"1px solid "+(plan.popular?"rgba(201,168,76,0.45)":CARD_BORDER2), borderRadius:24, padding:32, position:"relative", boxShadow: plan.popular ? "0 8px 32px rgba(201,168,76,0.20), inset 0 1px 0 rgba(255,255,255,0.1)" : "0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)", transition:"all 0.2s ease" }}>
                {plan.popular && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#c9a84c,#f5cc6a)", color:"#08080f", fontSize:11, fontWeight:800, padding:"5px 18px", borderRadius:100, letterSpacing:"1px", boxShadow:SHADOW_GOLD, textTransform:"uppercase" }}>En Popüler</div>}
                <div style={{ fontSize:14, fontWeight:700, marginBottom:8, color:TEXT2, textTransform:"uppercase", letterSpacing:"1.5px" }}>{plan.name}</div>
                {userCoupon && !userCoupon.isFree && userCoupon.discount ? (
                  <div style={{ marginBottom:24 }}>
                    <div style={{ fontSize:14, color:"#888899", textDecoration:"line-through" }}>${plan.price}</div>
                    <div style={{ fontSize:36, fontWeight:800, color: plan.popular ? GOLD2 : plan.color, fontFamily:FONT_MONO }}>
                      ${Math.round(plan.price * (1 - userCoupon.discount/100))}<span style={{ fontSize:14, color:"#888899" }}> tek seferlik</span>
                    </div>
                    <div style={{ fontSize:11, color:"#10a37f", fontWeight:600 }}>%{userCoupon.discount} indirim uygulandı</div>
                  </div>
                ) : (
                  <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:24 }}>
                    <span style={{ fontSize:48, fontWeight:800, color: plan.popular ? GOLD2 : plan.color, fontFamily:FONT_MONO, letterSpacing:"-0.03em" }}>{"$"+plan.price}</span>
                    <span style={{ color:TEXT2, fontSize:13, fontFamily:FONT_MONO }}>/ay</span>
                  </div>
                )}
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:26 }}>
                  {plan.features.map(function(f) {
                    return <div key={f} style={{ display:"flex", gap:10, alignItems:"flex-start", fontSize:13, color:TEXT, lineHeight:1.5 }}><span style={{ color: plan.popular ? GOLD2 : plan.color, fontWeight:800, flexShrink:0 }}>✓</span>{f}</div>;
                  })}
                </div>
                <button onClick={function() { props.onPick(plan); }}
                  onMouseEnter={function(e){ if(plan.popular){ e.currentTarget.style.boxShadow="0 8px 32px rgba(201,168,76,0.45)"; } else { e.currentTarget.style.background="rgba(255,255,255,0.06)"; } }}
                  onMouseLeave={function(e){ if(plan.popular){ e.currentTarget.style.boxShadow=SHADOW_GOLD; } else { e.currentTarget.style.background="transparent"; } }}
                  style={{ width:"100%", background: plan.popular ? "linear-gradient(135deg,#c9a84c,#f5cc6a)" : "transparent", color: plan.popular ? "#08080f" : plan.color, border:"1px solid "+(plan.popular?"transparent":plan.color), borderRadius:14, padding:"14px 0", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow: plan.popular ? SHADOW_GOLD : "none", transition:"all 0.2s ease", fontFamily:FONT, letterSpacing:"0.3px" }}>
                  Seç
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ maxWidth:400, margin:"24px auto 0", textAlign:"center" }}>
          <div style={{ fontSize:13, color:"#888899", marginBottom:10 }}>Kupon kodun var mı?</div>
          <div style={{ display:"flex", gap:8 }}>
            <input value={couponCode} onChange={function(e) { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
              placeholder="KUPON KODU"
              style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"11px 14px", color:"#fff", fontSize:13, outline:"none", fontFamily:"monospace", letterSpacing:2 }} />
            <button onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}
              style={{ background:"linear-gradient(135deg,#c9a84c,#f5cc6a)", color:"#08080f", border:"none", borderRadius:10, padding:"11px 20px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              {couponLoading ? "..." : "Uygula"}
            </button>
          </div>
          {couponResult && couponResult.ok && (
            <div style={{ marginTop:10, background:"rgba(16,163,127,0.1)", border:"1px solid rgba(16,163,127,0.3)", borderRadius:10, padding:"12px 16px" }}>
              {couponResult.isFree ? (
                <div>
                  <div style={{ color:"#10a37f", fontWeight:700, fontSize:14, marginBottom:6 }}>🎉 Bedava erişim kazandın!</div>
                  <div style={{ color:"#6ee7b7", fontSize:13, marginBottom:12 }}>Bu kupon ile Pro plana ücretsiz erişebilirsin.</div>
                  <button onClick={function() {
                    var freeUser = null;
                    try { var su = lsGet("aica_user"); if (su) freeUser = JSON.parse(su); } catch(e) {}
                    if (freeUser) {
                      freeUser.plan = PLANS[1];
                      freeUser.couponUsed = couponResult.code;
                      saveUser(freeUser);
                      props.onPick && props.onPick(PLANS[1]);
                    }
                  }} style={{ background:"linear-gradient(135deg,#10a37f,#34d399)", color:"#fff", border:"none", borderRadius:10, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer", width:"100%" }}>
                    🚀 Hemen Başla — Ücretsiz
                  </button>
                </div>
              ) : (
                <div style={{ color:"#10a37f", fontWeight:600, fontSize:13 }}>
                  ✅ Kupon uygulandı! %{couponResult.discount} indirim kazandın.
                </div>
              )}
            </div>
          )}
          {couponResult && !couponResult.ok && (
            <div style={{ marginTop:10, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"10px 16px", color:"#ef4444", fontSize:13 }}>
              ❌ {couponResult.message || "Geçersiz veya kullanılmış kupon kodu"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  var [page, setPage] = useState("landing");
  var [user, setUser] = useState(null);
  var [plan, setPlan] = useState(null);
  var [lesson, setLesson] = useState(null);
  var [mentor, setMentor] = useState(false);
  var [xpToast, setXpToast] = useState(null);
  var [booting, setBooting] = useState(true);
  var [inviteData, setInviteData] = useState(null);
  var [showCharTest, setShowCharTest] = useState(false);

  useEffect(function() {
    if (typeof window === "undefined") { setBooting(false); return; }
    // Auth token süresi dolmuş mesajı
    try {
      if (lsGet("auth_expired_msg")) {
        lsRemove("auth_expired_msg");
        setTimeout(function() {
          try { window.alert("Oturumunuz sona erdi, lütfen tekrar giriş yapın"); } catch(e) {}
        }, 0);
      }
    } catch(e) {}
    // Davet linki kontrolü
    try {
      var params = new URLSearchParams(window.location.search);
      var inviteCode = params.get("invite");
      if (inviteCode) {
        var parsed = parseInviteCode(inviteCode);
        if (parsed) setInviteData(parsed);
      }
    } catch(e) {}
    // Kayıtlı kullanıcı kontrolü
    try {
      var su = lsGet("aica-user");
      if (su) {
        var u = JSON.parse(su);
        var statusKey = "user-status-" + (u && u.email ? u.email : "");
        var isPasif = lsGet(statusKey) === "pasif";
        var isAdminU = u && u.email === ADMIN_EMAIL;
        var isTestU = u && (u.email === "test@aicert.com" || u.email === "testpro@aicert.com" || u.email === "testbiz@aicert.com");
        if (isPasif && !isAdminU && !isTestU) {
          deleteUser();
          setPage("landing");
          setBooting(false);
          return;
        }
        setUser(u);
        var pn = u && u.plan ? (typeof u.plan === "string" ? u.plan : (u.plan.name || "")) : "";
        var isAdmin = u && u.email === ADMIN_EMAIL;
        var isTest = u && (u.email === "test@aicert.com" || u.email === "testpro@aicert.com" || u.email === "testbiz@aicert.com");
        var hasPlan = pn === "Pro" || pn === "Business";
        if (isAdmin || isTest || hasPlan) {
          setPage("dashboard");
        } else {
          setPage("planselect");
        }
      }
    } catch(e) {}
    setBooting(false);
  }, []);

  function updateUser(fn) {
    setUser(function(prev) {
      var next = fn(prev);
      saveUser(next);
      return next;
    });
  }

  function handleRegDone(u) { setUser(u); saveUser(u); setPage("onboarding"); }
  function handleOnbDone(prof) { updateUser(function(p) { return Object.assign({}, p, { profile:prof }); }); setPage("dashboard"); }
  function handleLogout() { setUser(null); deleteUser(); clearAuthToken(); setPage("landing"); }
  function handleLessonStart(l) { if (user && !user.paid && l && l.day > 1) { setPage("planselect"); return; } setLesson(l); setPage("lesson"); }
  function handleLessonDone(day, sc, xp) {
    updateUser(function(prev) {
      var np = Object.assign({}, prev.progress || {}); np[day] = "done";
      var ns = Object.assign({}, prev.scores || {}); ns[day] = sc;
      return Object.assign({}, prev, { progress:np, scores:ns, xp:(prev.xp||0)+xp, streak:(prev.streak||0)+1 });
    });
    setXpToast(xp);
  }

  if (booting) {
    return (
      <div style={{ minHeight:"100vh", background:BG, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", fontFamily:FONT }}>
          <div style={{ fontSize:40, fontWeight:800, color:GOLD, marginBottom:10 }}>AI</div>
          <div style={{ color:"#555577", fontSize:13 }}>Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <img
        src={logoAsset.url}
        alt="AI Certification Academy"
        onClick={function() { setPage("dashboard"); setLesson(null); }}
        style={{ position:"fixed", top:16, left:16, width:56, height:56, borderRadius:"50%", zIndex:9998, boxShadow:"0 4px 16px rgba(0,0,0,0.45)", pointerEvents:"auto", cursor:"pointer" }}
      />
      {xpToast && <XPToast xp={xpToast} onDone={function() { setXpToast(null); }} />}
      {mentor && user && <MentorChat user={user} onClose={function() { setMentor(false); }} />}
      {page === "landing" && <><Landing onGo={function(target) { if (target === "auth") setPage("auth"); }} /><B2BSection /></>}
      {page === "auth" && <Auth
        onRegister={function(u) {
          setUser(u);
          saveUser(u);
          if (u && u.coupon && u.coupon.isFree) {
            var updatedUser = Object.assign({}, u, { plan: PLANS[1], paid: true, couponUsed: u.coupon.code });
            setUser(updatedUser);
            saveUser(updatedUser);
            setPage(updatedUser.profile ? "dashboard" : "onboarding");
          } else {
            setPage("planselect");
          }
        }}
        onLogin={function(u) {
          setUser(u);
          saveUser(u);
          var pn = u && u.plan ? (typeof u.plan === "string" ? u.plan : (u.plan.name || "")) : "";
          var isAdmin = u && u.email === ADMIN_EMAIL;
          var isTest = u && (u.email === "test@aicert.com" || u.email === "testpro@aicert.com" || u.email === "testbiz@aicert.com");
          var hasPlan = pn === "Pro" || pn === "Business";
          if (isAdmin || isTest || hasPlan) {
            setPage(u && u.profile ? "dashboard" : "onboarding");
          } else {
            setPage("planselect");
          }
        }}
      />}
      {page === "planselect" && <><PlanSelect onPick={function(p) {
        setPlan(p);
        updateUser(function(prev) { return Object.assign({}, prev, { plan: p }); });
        try {
          var em = user && user.email ? user.email : "";
          window.open(buildPaymentUrl(p.name, em), "_blank");
        } catch(e) {}
        // Ödeme tamamlanmadan dashboard'a geçilmez; planselect ekranında kalınır
      }} /><div style={{ textAlign:"center", padding:"0 0 48px", background:BG }}><button onClick={function() { setPage(user && user.profile ? "dashboard" : "onboarding"); }} style={{ background:"none", border:"none", color:"#888899", textDecoration:"underline", cursor:"pointer", fontSize:14, fontFamily:FONT }}>Şimdilik ücretsiz devam et (Gün 1 açık) →</button></div></>}
      {page === "onboarding" && <Onboarding onDone={handleOnbDone} />}
      {page === "dashboard" && <Dashboard user={user} onLesson={handleLessonStart} onLogout={handleLogout} onMentor={function() { setMentor(true); }} />}
      {page === "lesson" && <Lesson lesson={lesson} user={user} onDone={handleLessonDone} onBack={function() { setPage("dashboard"); }} />}
    </div>
  );
}
