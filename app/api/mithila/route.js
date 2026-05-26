// app/api/mithila/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

function auth(req) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

export async function GET(req) {
  await ensureInit();
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const section = searchParams.get('section') || '';
  const isAdmin = auth(req);

  let rows;
  if (isAdmin) {
    rows = section
      ? await sql`SELECT * FROM mithila_content WHERE section = ${section} ORDER BY sort_order ASC`
      : await sql`SELECT * FROM mithila_content ORDER BY section, sort_order ASC`;
  } else {
    rows = section
      ? await sql`SELECT * FROM mithila_content WHERE section = ${section} AND is_active = TRUE ORDER BY sort_order ASC`
      : await sql`SELECT * FROM mithila_content WHERE is_active = TRUE ORDER BY section, sort_order ASC`;
  }

  const stats = {
    total:     rows.length,
    intro:     rows.filter(r => r.section === 'intro').length,
    geography: rows.filter(r => r.section === 'geography').length,
    language:  rows.filter(r => r.section === 'language').length,
    culture:   rows.filter(r => r.section === 'culture').length,
    diaspora:  rows.filter(r => r.section === 'diaspora').length,
  };

  return NextResponse.json({ success: true, data: rows, stats }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  await ensureInit();
  const sql = getDb();
  const body = await req.json();
  const { section, title, title_maithili, content, content_maithili, icon, image_url, sort_order, is_active } = body;
  if (!content?.trim()) return NextResponse.json({ success: false, message: 'Content is required' }, { status: 400 });
  if (!section)         return NextResponse.json({ success: false, message: 'Section is required' },  { status: 400 });

  const [row] = await sql`
    INSERT INTO mithila_content (section, title, title_maithili, content, content_maithili, icon, image_url, sort_order, is_active)
    VALUES (${section}, ${title || null}, ${title_maithili || null}, ${content.trim()}, ${content_maithili || null}, ${icon || null}, ${image_url || null}, ${sort_order ?? 0}, ${is_active ?? true})
    RETURNING *
  `;
  return NextResponse.json({ success: true, data: row }, { status: 201 });
}
