// app/api/health/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
export async function GET() {
  const r={status:'ok',app:'MAA CRM',timestamp:new Date().toISOString(),database:{status:'unknown'}};
  try{const sql=getDb();await sql`SELECT 1`;r.database={status:'connected',provider:'Neon PostgreSQL (free tier)'};}
  catch(e){r.database={status:'error',error:e.message};r.status='degraded';}
  return NextResponse.json(r,{status:r.status==='ok'?200:503});
}
