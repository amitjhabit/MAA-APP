export const dynamic = 'force-dynamic';
// app/api/public/committee/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

export async function GET() {
  try {
    await ensureInit();
    const sql = getDb();
    const members = await sql`
      SELECT * FROM committee_members
      ORDER BY is_current DESC, sort_order ASC, created_at ASC
    `;
    return NextResponse.json({ success: true, data: members });
  } catch (e) {
    return NextResponse.json({ success: true, data: [] });
  }
}
