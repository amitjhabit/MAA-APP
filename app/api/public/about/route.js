export const dynamic = 'force-dynamic';
// app/api/public/about/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

export async function GET() {
  try {
    await ensureInit();
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM about_content
      WHERE is_active = TRUE
      ORDER BY type, sort_order ASC, created_at ASC
    `;
    // Group by type for easy consumption
    const grouped = {
      paragraphs:   rows.filter(r => r.type === 'paragraph'),
      quote:        rows.find(r => r.type === 'quote') || null,
      core_values:  rows.filter(r => r.type === 'core_value'),
      activities:   rows.filter(r => r.type === 'activity'),
    };
    return NextResponse.json({ success: true, data: grouped });
  } catch (e) {
    return NextResponse.json({ success: false, data: null, error: e.message });
  }
}
