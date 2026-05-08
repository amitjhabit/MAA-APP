// app/api/committee/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';
function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function GET(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const committee = searchParams.get('committee') || 'all';
    const conds = [], params = [];
    if (committee !== 'all') { params.push(committee); conds.push(`committee = $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const members = await sql(`SELECT * FROM committee_members ${where} ORDER BY sort_order ASC, created_at ASC`, params);
    const current = members.filter(m => m.is_current).length;
    return NextResponse.json({ success: true, data: members, stats: { total: members.length, current, past: members.length - current } });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function POST(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb(), b = await request.json();
    if (!b.name?.trim() || !b.role?.trim()) return NextResponse.json({ success: false, errors: { name: 'Name and role required' } }, { status: 400 });
    const [m] = await sql`INSERT INTO committee_members (name,email,phone,role,committee,term_start,term_end,is_current,bio,photo_url,sort_order) VALUES (${b.name.trim()},${b.email||null},${b.phone||null},${b.role.trim()},${b.committee||'board'},${b.term_start||null},${b.term_end||null},${b.is_current!==undefined?b.is_current:true},${b.bio||null},${b.photo_url||null},${parseInt(b.sort_order||0)}) RETURNING *`;
    return NextResponse.json({ success: true, data: m }, { status: 201 });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
