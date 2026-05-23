// app/api/public/track/route.js — records a public page view (no auth)
export const dynamic = 'force-dynamic';
import { getDb, ensureInit } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await ensureInit();
    const sql = getDb();
    const { path, referrer } = await req.json();
    if (!path || typeof path !== 'string') return NextResponse.json({ success: false });
    // Only track public paths
    if (path.startsWith('/admin') || path.startsWith('/api')) return NextResponse.json({ success: false });
    await sql`INSERT INTO page_views (path, referrer) VALUES (${path.slice(0, 500)}, ${referrer?.slice(0, 500) || null})`;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
