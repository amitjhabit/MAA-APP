// app/api/finance/templates/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const rows = await sql`SELECT * FROM receipt_templates ORDER BY is_default DESC, name`;
    return NextResponse.json({ success: true, data: rows });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const b = await req.json();
    if (!b.name?.trim()) return NextResponse.json({ success: false, errors: { name: 'Name is required' } }, { status: 400 });
    if (!b.subject?.trim()) return NextResponse.json({ success: false, errors: { subject: 'Subject is required' } }, { status: 400 });
    if (!b.body_html?.trim()) return NextResponse.json({ success: false, errors: { body_html: 'Body HTML is required' } }, { status: 400 });
    const [tmpl] = await sql`
      INSERT INTO receipt_templates (name, subject, body_html, is_default)
      VALUES (${b.name.trim()}, ${b.subject.trim()}, ${b.body_html.trim()}, ${b.is_default || false})
      RETURNING *`;
    return NextResponse.json({ success: true, data: tmpl });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
