export const dynamic = 'force-dynamic';
// app/api/admin/homepage/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const rows = await sql`SELECT * FROM homepage_content ORDER BY section, key`;
    return NextResponse.json({ success: true, data: rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

// Bulk upsert: body = { items: [{ section, key, value }] }
export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const { items } = await req.json();
    if (!Array.isArray(items) || items.length === 0)
      return NextResponse.json({ success: false, message: 'items array required' }, { status: 400 });
    const saved = [];
    for (const { section, key, value } of items) {
      if (!section || !key) continue;
      const [row] = await sql`
        INSERT INTO homepage_content (section, key, value, updated_at)
        VALUES (${section}, ${key}, ${value ?? ''}, NOW())
        ON CONFLICT (section, key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        RETURNING *
      `;
      saved.push(row);
    }
    return NextResponse.json({ success: true, data: saved });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
