// app/api/public/join/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

export async function POST(request) {
  try {
    await ensureInit();
    const sql  = getDb();
    const body = await request.json();
    const { first_name, last_name, email, phone, city, state, membership_type, membership_plan, maithili_name, village_district, occupation, notes } = body;

    if (!first_name?.trim() || !last_name?.trim() || !email?.trim()) {
      return NextResponse.json({ success: false, message: 'Name and email are required.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, errors: { email: 'Invalid email address' } }, { status: 400 });
    }

    const [dup] = await sql`SELECT id FROM members WHERE email = ${email.toLowerCase()}`;
    if (dup) return NextResponse.json({ success: false, errors: { email: 'This email is already registered. Please contact us to renew.' } }, { status: 409 });

    const [member] = await sql`
      INSERT INTO members (first_name, last_name, email, phone, city, state,
        membership_type, membership_plan, membership_status, is_active,
        maithili_name, village_district, occupation, notes)
      VALUES (${first_name.trim()}, ${last_name.trim()}, ${email.toLowerCase()},
        ${phone||null}, ${city||null}, ${state||null},
        ${membership_type||'individual'}, ${membership_plan||'annual'}, 'pending', FALSE,
        ${maithili_name||null}, ${village_district||null}, ${occupation||null},
        ${notes||null})
      RETURNING id, first_name, last_name, email
    `;

    return NextResponse.json({ success: true, data: member, message: 'Application submitted! We will contact you with payment instructions.' }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
