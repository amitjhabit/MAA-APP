export const dynamic = 'force-dynamic';
// app/api/public/contact/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

export async function POST(request) {
  try {
    await ensureInit();
    const sql  = getDb();
    const body = await request.json();
    const { name, email, phone, subject, message, inquiry_type } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ success: false, message: 'Name, email, and message are required.' }, { status: 400 });
    }

    await sql`
      INSERT INTO inquiries (name, email, phone, subject, message, inquiry_type)
      VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${phone||null}, ${subject||'General Inquiry'}, ${message.trim()}, ${inquiry_type||'general'})
    `;

    return NextResponse.json({ success: true, message: 'Message sent successfully!' }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

