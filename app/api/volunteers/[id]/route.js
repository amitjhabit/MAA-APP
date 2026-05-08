// app/api/volunteers/[id]/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }
export async function PATCH(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb(), b = await req.json();
    const [ex] = await sql`SELECT * FROM volunteers WHERE id = ${params.id}`;
    if (!ex) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const [v] = await sql`UPDATE volunteers SET name=${b.name??ex.name},email=${b.email??ex.email},phone=${b.phone??ex.phone},role=${b.role??ex.role},skills=${b.skills??ex.skills},availability=${b.availability??ex.availability},hours_total=${b.hours_total!==undefined?parseFloat(b.hours_total):ex.hours_total},status=${b.status??ex.status},notes=${b.notes??ex.notes} WHERE id=${params.id} RETURNING *`;
    return NextResponse.json({ success: true, data: v });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
export async function DELETE(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const [d] = await sql`DELETE FROM volunteers WHERE id = ${params.id} RETURNING id, name`;
    if (!d) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `${d.name} removed` });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
