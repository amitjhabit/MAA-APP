// app/api/public/events/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';
export async function GET(request) {
  try { await ensureInit(); const sql=getDb(); const{searchParams}=new URL(request.url); const limit=parseInt(searchParams.get('limit')||'10'); const events=await sql`SELECT * FROM events WHERE is_public=TRUE AND status!='cancelled' ORDER BY event_date ASC LIMIT ${limit}`; return NextResponse.json({success:true,data:events}); }
  catch{return NextResponse.json({success:true,data:[]});}
}
