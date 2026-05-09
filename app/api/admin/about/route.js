export const dynamic = 'force-dynamic';
// app/api/admin/about/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const rows = await sql`SELECT * FROM about_content ORDER BY type, sort_order ASC, created_at ASC`;
    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const b = await req.json();
    if (!b.type || !b.content?.trim()) return NextResponse.json({ success: false, message: 'type and content are required' }, { status: 400 });
    const [row] = await sql`
      INSERT INTO about_content (type, icon, title, content, sort_order, is_active)
      VALUES (${b.type}, ${b.icon || null}, ${b.title || null}, ${b.content.trim()}, ${parseInt(b.sort_order) || 0}, ${b.is_active !== false})
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: row }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
