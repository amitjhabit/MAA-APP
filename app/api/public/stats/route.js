export const dynamic = 'force-dynamic';
// app/api/public/stats/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

export async function GET() {
  try {
    await ensureInit();
    const sql = getDb();
    const [m] = await sql`SELECT COUNT(*) AS c FROM members WHERE is_active = TRUE`;
    const [e] = await sql`SELECT COUNT(*) AS c FROM events`;
    const [u] = await sql`SELECT COUNT(*) AS c FROM events WHERE status = 'upcoming'`;
    const [n] = await sql`SELECT COUNT(*) AS c FROM news_posts WHERE status = 'published'`;
    const res = NextResponse.json({ success: true, data: { members: parseInt(m.c), events: parseInt(e.c), upcoming_events: parseInt(u.c), news: parseInt(n.c) } });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch {
    return NextResponse.json({ success: true, data: { members: 0, events: 0, news: 0 } });
  }
}
