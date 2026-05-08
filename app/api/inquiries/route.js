// app/api/inquiries/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';
function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function GET(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const type   = searchParams.get('type')   || 'all';
    const page   = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit  = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const offset = (page - 1) * limit;

    const conds = [], params = [];
    if (search) { params.push(`%${search}%`); conds.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR subject ILIKE $${params.length} OR message ILIKE $${params.length})`); }
    if (status !== 'all') { params.push(status); conds.push(`status = $${params.length}`); }
    if (type   !== 'all') { params.push(type);   conds.push(`inquiry_type = $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const inquiries = await sql(`SELECT * FROM inquiries ${where} ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params, limit, offset]);
    const [tot]     = await sql(`SELECT COUNT(*) AS total FROM inquiries ${where}`, params);
    const statsRows = await sql`SELECT status, COUNT(*) AS c FROM inquiries GROUP BY status`;
    const stats     = { total: 0, new: 0, read: 0, replied: 0, archived: 0 };
    statsRows.forEach(({ status: s, c }) => { stats[s] = parseInt(c); stats.total += parseInt(c); });

    return NextResponse.json({ success: true, data: inquiries, stats, pagination: { page, limit, total: parseInt(tot.total), pages: Math.ceil(tot.total / limit) } });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
