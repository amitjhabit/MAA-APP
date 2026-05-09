export const dynamic = 'force-dynamic';
// app/api/admin/about/[id]/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function PATCH(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const b = await req.json();
    const id = parseInt(params.id);
    const [row] = await sql`
      UPDATE about_content SET
        icon       = COALESCE(${b.icon       ?? null}, icon),
        title      = COALESCE(${b.title      ?? null}, title),
        content    = COALESCE(${b.content    ?? null}, content),
        sort_order = COALESCE(${b.sort_order != null ? parseInt(b.sort_order) : null}, sort_order),
        is_active  = COALESCE(${b.is_active  != null ? b.is_active : null}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (!row) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: row });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    await sql`DELETE FROM about_content WHERE id = ${parseInt(params.id)}`;
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
