// app/api/committee/[id]/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }
export async function PATCH(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb(), b = await req.json();
    const [ex] = await sql`SELECT * FROM committee_members WHERE id = ${params.id}`;
    if (!ex) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const [m] = await sql`UPDATE committee_members SET name=${b.name??ex.name},email=${b.email??ex.email},phone=${b.phone??ex.phone},role=${b.role??ex.role},committee=${b.committee??ex.committee},term_start=${b.term_start??ex.term_start},term_end=${b.term_end??ex.term_end},is_current=${b.is_current!==undefined?b.is_current:ex.is_current},bio=${b.bio??ex.bio},photo_url=${b.photo_url??ex.photo_url},sort_order=${b.sort_order!==undefined?parseInt(b.sort_order):ex.sort_order} WHERE id=${params.id} RETURNING *`;
    return NextResponse.json({ success: true, data: m });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
export async function DELETE(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const [d] = await sql`DELETE FROM committee_members WHERE id = ${params.id} RETURNING id, name, role`;
    if (!d) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `${d.name} (${d.role}) removed` });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
