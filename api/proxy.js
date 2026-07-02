// api/proxy.js — GÜVENLİ SÜRÜM
// Değişiklikler:
//  1. JWT zorunlu (Authorization: Bearer <token>) — token /api/login'den alınır
//  2. CORS yalnızca ALLOWED_ORIGINS listesindeki domainlere açık
//  3. Model beyaz listesi + max_tokens tavanı → API anahtarının maliyeti kontrol altında

import { getUserFromRequest, applyCors } from './_lib/auth.js';

// Uygulamanın kullanmasına izin verilen modeller ve token tavanı.
// İhtiyaca göre güncelle.
const ALLOWED_MODELS = ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'];
const MAX_TOKENS_CAP = 4096;

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ status: 'ok' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  // ── 1. Kimlik doğrulama ─────────────────────────────────────
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: valid token required' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // ── 2. Maliyet korumaları ─────────────────────────────────
    if (!ALLOWED_MODELS.includes(body.model)) {
      return res.status(400).json({ error: 'model not allowed', allowed: ALLOWED_MODELS });
    }
    body.max_tokens = Math.min(Number(body.max_tokens) || 1024, MAX_TOKENS_CAP);

    // İstemciden gelebilecek tehlikeli alanları temizle
    delete body.metadata;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
