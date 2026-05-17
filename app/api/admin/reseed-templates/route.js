import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';

function auth(req) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  await initDb();
  return NextResponse.json({ success: true, message: 'Templates reseeded.' });
}
