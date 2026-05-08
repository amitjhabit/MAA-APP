export const dynamic = 'force-dynamic';
// app/api/public/donate/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

export async function POST(request) {
  try {
    await ensureInit();
    const sql  = getDb();
    const body = await request.json();
    const { name, email, phone, amount, payment_method, purpose, notes } = body;

    if (!name?.trim() || !email?.trim()) return NextResponse.json({ success: false, message: 'Name and email are required.' }, { status: 400 });
    if (!amount || parseFloat(amount) <= 0) return NextResponse.json({ success: false, message: 'Valid amount is required.' }, { status: 400 });

    await sql`
      INSERT INTO donations (donor_name, donor_email, donor_phone, amount, payment_method, campaign, purpose, status, notes)
      VALUES (${name.trim()}, ${email.toLowerCase()}, ${phone||null}, ${parseFloat(amount)}, ${payment_method||'zelle'}, ${purpose||'General Fund'}, ${purpose||null}, 'pending', ${notes||null})
    `;

    return NextResponse.json({ success: true, message: 'Donation recorded. Thank you!' }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

