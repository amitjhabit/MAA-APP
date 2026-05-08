// app/api/news/[id]/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function PATCH(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb(), b = await req.json();
    const [ex] = await sql`SELECT * FROM news_posts WHERE id = ${params.id}`;
    if (!ex) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const published_at = b.status === 'published' && ex.status !== 'published' ? new Date().toISOString() : (b.published_at ?? ex.published_at);
    const [p] = await sql`UPDATE news_posts SET title=${b.title??ex.title},title_maithili=${b.title_maithili??ex.title_maithili},excerpt=${b.excerpt??ex.excerpt},content=${b.content??ex.content},content_maithili=${b.content_maithili??ex.content_maithili},category=${b.category??ex.category},status=${b.status??ex.status},featured_image=${b.featured_image??ex.featured_image},author=${b.author??ex.author},published_at=${published_at} WHERE id=${params.id} RETURNING *`;
    return NextResponse.json({ success: true, data: p });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const [d] = await sql`DELETE FROM news_posts WHERE id = ${params.id} RETURNING id, title`;
    if (!d) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `"${d.title}" deleted` });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
