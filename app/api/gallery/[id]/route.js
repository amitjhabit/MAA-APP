// app/api/gallery/[id]/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }
export async function PATCH(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb(), b = await req.json();
    const [ex] = await sql`SELECT * FROM gallery WHERE id = ${params.id}`;
    if (!ex) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const [p] = await sql`UPDATE gallery SET title=${b.title??ex.title},description=${b.description??ex.description},image_url=${b.image_url??ex.image_url},category=${b.category??ex.category},is_featured=${b.is_featured!==undefined?b.is_featured:ex.is_featured},sort_order=${b.sort_order!==undefined?parseInt(b.sort_order):ex.sort_order} WHERE id=${params.id} RETURNING *`;
    return NextResponse.json({ success: true, data: p });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
export async function DELETE(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const [d] = await sql`DELETE FROM gallery WHERE id = ${params.id} RETURNING id, title`;
    if (!d) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: 'Photo deleted' });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
