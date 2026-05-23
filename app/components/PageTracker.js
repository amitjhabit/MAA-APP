'use client';
// app/components/PageTracker.js — silently records every public page view
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Skip admin and API paths
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) return;
    fetch('/api/public/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer: document.referrer }),
    }).catch(() => {}); // Never surface errors to the user
  }, [pathname]);

  return null; // Renders nothing
}
