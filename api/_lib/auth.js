// api/_lib/auth.js
// Sıfır bağımlılık: Node yerleşik crypto ile JWT (HS256) + scrypt şifre hash'i.
// Gerekli env: JWT_SECRET (uzun rastgele bir değer, örn: openssl rand -hex 32)

import crypto from 'node:crypto';

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const b64urlJson = (obj) => b64url(JSON.stringify(obj));

// ── JWT ──────────────────────────────────────────────────────────

export function signToken(payload, expiresInSec = 60 * 60 * 24 * 7) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const data = b64urlJson(header) + '.' + b64urlJson(body);
  const sig = b64url(crypto.createHmac('sha256', process.env.JWT_SECRET).update(data).digest());
  return data + '.' + sig;
}

export function verifyToken(token) {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const expected = b64url(
      crypto.createHmac('sha256', process.env.JWT_SECRET).update(h + '.' + p).digest()
    );
    const sigOk = crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected));
    if (!sigOk) return null;
    const payload = JSON.parse(Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// İstekten kullanıcıyı çıkarır: "Authorization: Bearer <token>"
export function getUserFromRequest(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7));
}

// ── Şifre hash (scrypt) ─────────────────────────────────────────
// Format: scrypt$<saltHex>$<hashHex>

export function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(plain, stored) {
  if (!stored) return false;
  // Yeni format
  if (stored.startsWith('scrypt$')) {
    const [, salt, hash] = stored.split('$');
    const candidate = crypto.scryptSync(plain, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
  }
  // Eski düz metin kayıt (geçiş dönemi): doğrudan karşılaştır.
  // login.js eşleşme sonrası kaydı otomatik hash'e çevirir.
  return stored === plain;
}

export function isLegacyPlaintext(stored) {
  return !!stored && !stored.startsWith('scrypt$');
}

// ── CORS ─────────────────────────────────────────────────────────
// env ALLOWED_ORIGINS: virgülle ayrılmış liste, örn:
// https://cert-academy.ai,https://www.cert-academy.ai

export function applyCors(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}
