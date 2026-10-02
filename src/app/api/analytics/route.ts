import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const eventNames = [
  'page_view',
  'page_exit',
  'fortune_start',
  'fortune_success',
  'fortune_error',
  'fortune_retry',
  'tab_view',
  'share_attempt',
  'share_success',
  'share_fallback',
  'share_error',
] as const;

const scalarSchema = z.union([
  z.string().max(100),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

const payloadSchema = z.object({
  event: z.enum(eventNames),
  visitorId: z.string().min(1).max(80),
  sessionId: z.string().min(1).max(80),
  path: z.string().max(500),
  referrer: z.string().max(500).optional(),
  utm: z.object({
    source: z.string().max(100).optional(),
    medium: z.string().max(100).optional(),
    campaign: z.string().max(100).optional(),
    term: z.string().max(100).optional(),
    content: z.string().max(100).optional(),
  }).optional(),
  client: z.object({
    language: z.string().max(35).optional(),
    timezone: z.string().max(80).optional(),
    screenWidth: z.number().int().min(0).max(20000).optional(),
    screenHeight: z.number().int().min(0).max(20000).optional(),
    viewportWidth: z.number().int().min(0).max(20000).optional(),
    viewportHeight: z.number().int().min(0).max(20000).optional(),
    colorDepth: z.number().int().min(0).max(128).optional(),
    touchPoints: z.number().int().min(0).max(100).optional(),
  }).optional(),
  data: z.record(z.string().max(60), scalarSchema).optional(),
});

function decodeHeader(value: string | null): string | undefined {
  if (!value) return undefined;

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function maskIp(value: string | null): string | undefined {
  if (!value) return undefined;

  const ip = value.split(',')[0]?.trim();
  if (!ip) return undefined;

  const embeddedIpv4 = ip.match(/(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  if (embeddedIpv4) {
    const parts = embeddedIpv4.split('.');
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.0/24` : undefined;
  }

  if (ip.includes(':')) {
    const parts = ip.split(':').filter(Boolean).slice(0, 4);
    return parts.length ? `${parts.join(':')}::/64` : undefined;
  }

  return undefined;
}

function parseDevice(userAgent: string) {
  const ua = userAgent.toLowerCase();

  const isBot = /bot|crawler|spider|slurp|bingpreview|facebookexternalhit/.test(ua);
  const deviceType =
    /ipad|tablet|kindle|silk/.test(ua)
      ? 'tablet'
      : /mobi|iphone|android/.test(ua)
        ? 'mobile'
        : 'desktop';

  let os = 'other';
  if (/windows nt/.test(ua)) os = 'windows';
  else if (/iphone|ipad|ipod/.test(ua)) os = 'ios';
  else if (/android/.test(ua)) os = 'android';
  else if (/mac os x|macintosh/.test(ua)) os = 'macos';
  else if (/linux/.test(ua)) os = 'linux';

  let browser = 'other';
  if (/edg\//.test(ua)) browser = 'edge';
  else if (/samsungbrowser\//.test(ua)) browser = 'samsung-internet';
  else if (/firefox\//.test(ua)) browser = 'firefox';
  else if (/chrome\//.test(ua) || /crios\//.test(ua)) browser = 'chrome';
  else if (/safari\//.test(ua) && !/chrome\//.test(ua)) browser = 'safari';

  return { deviceType, os, browser, isBot };
}

async function forwardToWebhook(record: unknown) {
  const url = process.env.ANALYTICS_WEBHOOK_URL;
  if (!url) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.ANALYTICS_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.ANALYTICS_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(record),
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch {
    console.warn('[analytics] webhook delivery failed');
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const userAgent = request.headers.get('user-agent') ?? '';
  const record = {
    schemaVersion: 1,
    eventId: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    event: parsed.data.event,
    visitorId: parsed.data.visitorId,
    sessionId: parsed.data.sessionId,
    path: parsed.data.path,
    referrer: parsed.data.referrer,
    utm: parsed.data.utm,
    geo: {
      country: request.headers.get('x-vercel-ip-country') ?? undefined,
      region: request.headers.get('x-vercel-ip-country-region') ?? undefined,
      city: decodeHeader(request.headers.get('x-vercel-ip-city')),
      timezone: request.headers.get('x-vercel-ip-timezone') ?? undefined,
      postalCode: request.headers.get('x-vercel-ip-postal-code') ?? undefined,
      latitude: request.headers.get('x-vercel-ip-latitude') ?? undefined,
      longitude: request.headers.get('x-vercel-ip-longitude') ?? undefined,
    },
    network: {
      maskedIp: maskIp(request.headers.get('x-forwarded-for')),
    },
    device: {
      ...parseDevice(userAgent),
      ...parsed.data.client,
    },
    data: parsed.data.data,
  };

  console.log('[analytics]', JSON.stringify(record));
  await forwardToWebhook(record);

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
