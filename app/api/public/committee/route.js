export const dynamic = 'force-dynamic';
// app/api/public/committee/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

export async function GET() {
  try {
    await ensureInit();
    const sql = getDb();
    const members = await sql`
      SELECT id, name, role, committee, bio,
             NULLIF(TRIM(COALESCE(photo_url, '')), '') AS photo_url,
             sort_order, term_start, term_end, is_current, created_at,
             NULLIF(TRIM(COALESCE(email, '')), '') AS email,
             NULLIF(TRIM(COALESCE(phone, '')), '') AS phone
      FROM committee_members
      ORDER BY is_current DESC, sort_order ASC, created_at ASC
    `;
    const res = NextResponse.json({ success: true, data: members });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
