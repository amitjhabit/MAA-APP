// app/api/mithila/[id]/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

function auth(req) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

export async function PATCH(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  await ensureInit();
  const sql = getDb();
  const id = parseInt(params.id);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });

  // Fetch current row so we can merge — avoids sql-fragment interpolation entirely
  const [current] = await sql`SELECT * FROM mithila_content WHERE id = ${id}`;
  if (!current) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

  const body = await req.json();
  const section          = body.section          !== undefined ? body.section                    : current.section;
  const title            = body.title            !== undefined ? (body.title || null)            : current.title;
  const title_maithili   = body.title_maithili   !== undefined ? (body.title_maithili || null)   : current.title_maithili;
  const content          = body.content          !== undefined ? body.content                    : current.content;
  const content_maithili = body.content_maithili !== undefined ? (body.content_maithili || null) : current.content_maithili;
  const icon             = body.icon             !== undefined ? (body.icon || null)             : current.icon;
  const image_url        = body.image_url        !== undefined ? (body.image_url || null)        : current.image_url;
  const sort_order       = body.sort_order       !== undefined ? parseInt(body.sort_order) || 0  : current.sort_order;
  const is_active        = body.is_active        !== undefined ? body.is_active                  : current.is_active;

  const [row] = await sql`
    UPDATE mithila_content SET
      section          = ${section},
      title            = ${title},
      title_maithili   = ${title_maithili},
      content          = ${content},
      content_maithili = ${content_maithili},
      icon             = ${icon},
      image_url        = ${image_url},
      sort_order       = ${sort_order},
      is_active        = ${is_active},
      updated_at       = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return NextResponse.json({ success: true, data: row });
}

export async function DELETE(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  await ensureInit();
  const sql = getDb();
  const id = parseInt(params.id);
  if (!id) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });

  await sql`DELETE FROM mithila_content WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
