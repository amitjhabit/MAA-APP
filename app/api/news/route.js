// app/api/news/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';
function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function GET(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const search   = searchParams.get('search')   || '';
    const status   = searchParams.get('status')   || 'all';
    const category = searchParams.get('category') || 'all';
    const page     = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const offset   = (page - 1) * limit;

    const conds = [], params = [];
    if (search)   { params.push(`%${search}%`); conds.push(`(title ILIKE $${params.length} OR excerpt ILIKE $${params.length} OR content ILIKE $${params.length})`); }
    if (status   !== 'all') { params.push(status);   conds.push(`status = $${params.length}`); }
    if (category !== 'all') { params.push(category); conds.push(`category = $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const posts     = await sql(`SELECT * FROM news_posts ${where} ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params, limit, offset]);
    const [tot]     = await sql(`SELECT COUNT(*) AS total FROM news_posts ${where}`, params);
    const statsRows = await sql`SELECT status, COUNT(*) AS c FROM news_posts GROUP BY status`;
    const stats     = { total: 0, draft: 0, published: 0, archived: 0 };
    statsRows.forEach(({ status: s, c }) => { stats[s] = parseInt(c); stats.total += parseInt(c); });

    return NextResponse.json({ success: true, data: posts, stats, pagination: { page, limit, total: parseInt(tot.total), pages: Math.ceil(tot.total / limit) } });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function POST(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb(), b = await request.json();
    if (!b.title?.trim()) return NextResponse.json({ success: false, errors: { title: 'Title required' } }, { status: 400 });
    const slug = b.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') + '-' + Date.now();
    const published_at = b.status === 'published' ? (b.published_at || new Date().toISOString()) : null;
    const [p] = await sql`INSERT INTO news_posts (title,title_maithili,slug,excerpt,content,content_maithili,category,status,featured_image,author,published_at) VALUES (${b.title.trim()},${b.title_maithili||null},${slug},${b.excerpt||null},${b.content||null},${b.content_maithili||null},${b.category||'general'},${b.status||'draft'},${b.featured_image||null},${b.author||null},${published_at}) RETURNING *`;
    return NextResponse.json({ success: true, data: p }, { status: 201 });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
