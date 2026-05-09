export const dynamic = 'force-dynamic';
// app/api/public/committee/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

export async function GET() {
  try {
    await ensureInit();
    const sql = getDb();
    const members = await sql`
      SELECT id, first_name, last_name, email, photo_url, committee_role AS role, joined_date AS term_start
      FROM members
      WHERE is_committee = TRUE AND is_active = TRUE
      ORDER BY committee_role ASC, first_name ASC
    `;
    // Map to shape expected by about page (name, role, email, photo_url)
    const data = members.map(m => ({
      id: m.id,
      name: `${m.first_name} ${m.last_name}`,
      role: m.role || 'Member',
      email: m.email,
      photo_url: m.photo_url,
      term_start: m.term_start,
    }));
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: true, data: [] });
  }
}
