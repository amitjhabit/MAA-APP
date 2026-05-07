// app/api/public/news/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';
export async function GET(request) {
  try { await ensureInit(); const sql=getDb(); const{searchParams}=new URL(request.url); const limit=parseInt(searchParams.get('limit')||'10'); const posts=await sql`SELECT * FROM news_posts WHERE status='published' ORDER BY published_at DESC LIMIT ${limit}`; return NextResponse.json({success:true,data:posts}); }
  catch{return NextResponse.json({success:true,data:[]});}
}
