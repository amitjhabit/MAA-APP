export const dynamic = 'force-dynamic';
// app/api/public/stats/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';
export async function GET() {
  try { await ensureInit(); const sql=getDb(); const[m]=await sql`SELECT COUNT(*) AS c FROM members WHERE is_active=TRUE`; const[e]=await sql`SELECT COUNT(*) AS c FROM events`; const[n]=await sql`SELECT COUNT(*) AS c FROM news_posts WHERE status='published'`; return NextResponse.json({success:true,data:{members:parseInt(m.c),events:parseInt(e.c),news:parseInt(n.c)}}); }
  catch{return NextResponse.json({success:true,data:{members:0,events:0,news:0}});}
}

