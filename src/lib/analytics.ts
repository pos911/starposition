'use client';

export type AnalyticsEventName =
  | 'page_view'
  | 'page_exit'
  | 'fortune_start'
  | 'fortune_success'
  | 'fortune_error'
  | 'fortune_retry'
  | 'tab_view'
  | 'share_attempt'
  | 'share_success'
  | 'share_fallback'
  | 'share_error';

type AnalyticsScalar = string | number | boolean | null;
type AnalyticsData = Record<string, AnalyticsScalar>;

const VISITOR_KEY = 'sp_visitor_id';
const SESSION_KEY = 'sp_session_id';

let memoryVisitorId: string | null = null;
let memorySessionId: string | null = null;

function randomId(prefix: string): string {
  const value =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${value}`;
}

function getStoredId(
  storage: Storage | undefined,
  key: string,
  prefix: string,
  memoryValue: string | null,
  setMemoryValue: (value: string) => void,
): string {
  if (memoryValue) return memoryValue;

  try {
    const saved = storage?.getItem(key);
    if (saved) {
      setMemoryValue(saved);
      return saved;
    }

    const created = randomId(prefix);
    storage?.setItem(key, created);
    setMemoryValue(created);
    return created;
  } catch {
    const created = randomId(prefix);
    setMemoryValue(created);
    return created;
  }
}

function getVisitorId(): string {
  return getStoredId(
    typeof window === 'undefined' ? undefined : window.localStorage,
    VISITOR_KEY,
    'v',
    memoryVisitorId,
    value => { memoryVisitorId = value; },
  );
}

function getSessionId(): string {
  return getStoredId(
    typeof window === 'undefined' ? undefined : window.sessionStorage,
    SESSION_KEY,
    's',
    memorySessionId,
    value => { memorySessionId = value; },
  );
}

function safeReferrer(): string | undefined {
  if (!document.referrer) return undefined;

  try {
    const url = new URL(document.referrer);
    return `${url.origin}${url.pathname}`.slice(0, 500);
  } catch {
    return undefined;
  }
}

function getUtm() {
  const params = new URLSearchParams(window.location.search);
  const read = (key: string) => params.get(key)?.slice(0, 100) || undefined;

  return {
    source: read('utm_source'),
    medium: read('utm_medium'),
    campaign: read('utm_campaign'),
    term: read('utm_term'),
    content: read('utm_content'),
  };
}

function privacyOptOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return navigator.doNotTrack === '1' || nav.globalPrivacyControl === true;
}

export function trackEvent(event: AnalyticsEventName, data: AnalyticsData = {}): void {
  if (typeof window === 'undefined' || privacyOptOut()) return;

  const payload = {
    event,
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    path: window.location.pathname,
    referrer: safeReferrer(),
    utm: getUtm(),
    client: {
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      colorDepth: window.screen.colorDepth,
      touchPoints: navigator.maxTouchPoints,
    },
    data,
  };

  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon('/api/analytics', blob)) return;
    }
  } catch {
    // fall through to fetch
  }

  void fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => {
    // Analytics must never block the product experience.
  });
}
