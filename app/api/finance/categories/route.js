// app/api/finance/categories/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const cats = await sql`SELECT * FROM budget_categories ORDER BY type, sort_order, name`;
    return NextResponse.json({ success: true, data: cats });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const b = await req.json();
    if (!b.name?.trim()) return NextResponse.json({ success: false, errors: { name: 'Name is required' } }, { status: 400 });
    if (!['income','expense'].includes(b.type)) return NextResponse.json({ success: false, errors: { type: 'Type must be income or expense' } }, { status: 400 });
    const [cat] = await sql`
      INSERT INTO budget_categories (name, type, description, sort_order)
      VALUES (${b.name.trim()}, ${b.type}, ${b.description||null}, ${b.sort_order||0})
      RETURNING *`;
    return NextResponse.json({ success: true, data: cat });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function PATCH(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const b = await req.json();
    if (!b.id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    const [cat] = await sql`
      UPDATE budget_categories SET
        name        = ${b.name ?? sql`name`},
        type        = ${b.type ?? sql`type`},
        description = ${b.description ?? sql`description`},
        is_active   = ${b.is_active !== undefined ? b.is_active : sql`is_active`},
        sort_order  = ${b.sort_order ?? sql`sort_order`}
      WHERE id = ${b.id} RETURNING *`;
    return NextResponse.json({ success: true, data: cat });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function DELETE(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });
    const [d] = await sql`DELETE FROM budget_categories WHERE id=${id} RETURNING name`;
    if (!d) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `"${d.name}" deleted` });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
