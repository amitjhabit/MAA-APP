// app/api/members/lookup/route.js — email autocomplete for donation forms (members + volunteers)
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

  // Search members
  const members = await sql`
    SELECT first_name || ' ' || last_name AS name, email, phone, 'member' AS source
    FROM members
    WHERE email      ILIKE ${`%${q}%`}
       OR first_name ILIKE ${`%${q}%`}
       OR last_name  ILIKE ${`%${q}%`}
    ORDER BY email
    LIMIT 8
  `;

  // Search volunteers (using first_name/last_name when available, fallback to name)
  const volunteers = await sql`
    SELECT COALESCE(NULLIF(trim(coalesce(first_name,'')||' '||coalesce(last_name,'')), ' '), name) AS name,
           email, phone, 'volunteer' AS source
    FROM volunteers
    WHERE email      ILIKE ${`%${q}%`}
       OR first_name ILIKE ${`%${q}%`}
       OR last_name  ILIKE ${`%${q}%`}
       OR name       ILIKE ${`%${q}%`}
    ORDER BY email
    LIMIT 8
  `;

  // Merge, deduplicate by email (member record takes priority)
  const seen = new Set();
  const results = [];
  for (const row of [...members, ...volunteers]) {
    const key = (row.email || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    results.push(row);
    if (results.length >= 10) break;
  }

  return NextResponse.json({ success: true, data: results }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
