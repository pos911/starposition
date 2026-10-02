'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

export default function AnalyticsTracker() {
  useEffect(() => {
    const startedAt = performance.now();
    let maxScrollPct = 0;

    const updateScroll = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (documentHeight <= 0) {
        maxScrollPct = 100;
        return;
      }

      const current = Math.round((window.scrollY / documentHeight) * 100);
      maxScrollPct = Math.max(maxScrollPct, Math.min(100, current));
    };

    updateScroll();
    trackEvent('page_view');

    window.addEventListener('scroll', updateScroll, { passive: true });

    const handlePageHide = () => {
      updateScroll();
      trackEvent('page_exit', {
        durationMs: Math.round(performance.now() - startedAt),
        maxScrollPct,
      });
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  return null;
}
