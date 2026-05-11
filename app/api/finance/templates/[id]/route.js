// app/api/finance/templates/[id]/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function GET(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const [tmpl] = await sql`SELECT * FROM receipt_templates WHERE id = ${params.id}`;
    if (!tmpl) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: tmpl });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function PATCH(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const b = await req.json();
    const [ex] = await sql`SELECT * FROM receipt_templates WHERE id = ${params.id}`;
    if (!ex) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const [tmpl] = await sql`
      UPDATE receipt_templates SET
        name       = ${b.name       ?? ex.name},
        subject    = ${b.subject    ?? ex.subject},
        body_html  = ${b.body_html  ?? ex.body_html},
        is_default = ${b.is_default !== undefined ? b.is_default : ex.is_default},
        updated_at = NOW()
      WHERE id = ${params.id} RETURNING *`;
    return NextResponse.json({ success: true, data: tmpl });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const [d] = await sql`DELETE FROM receipt_templates WHERE id = ${params.id} RETURNING name`;
    if (!d) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `"${d.name}" deleted` });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
