// app/api/finance/templates/[id]/signature/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function POST(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || 'image/png';
    const dataUri = `data:${mime};base64,${buffer.toString('base64')}`;
    const sql = getDb();
    const [tmpl] = await sql`UPDATE receipt_templates SET signature_base64 = ${dataUri} WHERE id = ${params.id} RETURNING id`;
    if (!tmpl) return NextResponse.json({ success: false, message: 'Template not found' }, { status: 404 });
    return NextResponse.json({ success: true, signature_base64: dataUri });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const [tmpl] = await sql`UPDATE receipt_templates SET signature_base64 = NULL WHERE id = ${params.id} RETURNING id`;
    if (!tmpl) return NextResponse.json({ success: false, message: 'Template not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
