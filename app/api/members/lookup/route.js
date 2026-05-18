// app/api/members/lookup/route.js — email autocomplete for forms
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

function auth(req) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ success: false }, { status: 401 });
  const q = new URL(req.url).searchParams.get('q') || '';
  if (q.length < 2) return NextResponse.json({ success: true, data: [] });
  await ensureInit();
  const sql = getDb();
  const rows = await sql`
    SELECT first_name || ' ' || last_name AS name, email, phone
    FROM members
    WHERE email ILIKE ${`%${q}%`}
       OR first_name ILIKE ${`%${q}%`}
       OR last_name  ILIKE ${`%${q}%`}
    ORDER BY email
    LIMIT 8
  `;
  return NextResponse.json({ success: true, data: rows }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
