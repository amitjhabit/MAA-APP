// app/api/volunteers/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';
function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

function fullName(b) {
  return [b.first_name, b.last_name].filter(Boolean).map(s => s.trim()).join(' ') || b.name || '';
}

export async function GET(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const conds = [], params = [];
    if (search) {
      params.push(`%${search}%`);
      conds.push(`(name ILIKE $${params.length} OR first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length} OR role ILIKE $${params.length} OR skills ILIKE $${params.length})`);
    }
    if (status !== 'all') { params.push(status); conds.push(`status = $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const volunteers = await sql(`SELECT * FROM volunteers ${where} ORDER BY created_at DESC`, params);
    const [tot] = await sql(`SELECT COUNT(*) AS total FROM volunteers ${where}`, params);
    const active = volunteers.filter(v => v.status === 'active').length;
    return NextResponse.json({ success: true, data: volunteers, stats: { total: parseInt(tot.total), active, inactive: parseInt(tot.total) - active } });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function POST(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb(), b = await request.json();
    if (!b.first_name?.trim()) return NextResponse.json({ success: false, errors: { first_name: 'First name is required' } }, { status: 400 });
    if (!b.last_name?.trim())  return NextResponse.json({ success: false, errors: { last_name: 'Last name is required' } }, { status: 400 });
    if (!b.email?.trim())      return NextResponse.json({ success: false, errors: { email: 'Email is required' } }, { status: 400 });
    const name = fullName(b);
    const [v] = await sql`
      INSERT INTO volunteers (name, first_name, last_name, address, email, phone, role, skills, availability, hours_total, status, joined_date, notes)
      VALUES (${name}, ${b.first_name.trim()}, ${b.last_name.trim()}, ${b.address||null}, ${b.email.toLowerCase().trim()}, ${b.phone||null},
              ${b.role||null}, ${b.skills||null}, ${b.availability||null}, ${parseFloat(b.hours_total||0)},
              ${b.status||'active'}, ${b.joined_date||null}, ${b.notes||null})
      RETURNING *`;
    return NextResponse.json({ success: true, data: v }, { status: 201 });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
