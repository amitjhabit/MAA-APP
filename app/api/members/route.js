// app/api/members/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';
function auth(req){return req.headers.get('x-admin-secret')===process.env.ADMIN_SECRET;}

export async function GET(request) {
  if (!auth(request)) return NextResponse.json({success:false,message:'Unauthorized'},{status:401});
  try {
    await ensureInit();
    const sql=getDb(), {searchParams}=new URL(request.url);
    const search=searchParams.get('search')||'', type=searchParams.get('type')||'all',
          status=searchParams.get('status')||'all', plan=searchParams.get('plan')||'all',
          page=Math.max(1,parseInt(searchParams.get('page')||'1')),
          limit=Math.min(50,parseInt(searchParams.get('limit')||'20')), offset=(page-1)*limit;
    const conds=[], params=[];
    if(search){params.push(`%${search}%`);conds.push(`(first_name ILIKE $${params.length} OR last_name ILIKE $${params.length} OR email ILIKE $${params.length} OR maithili_name ILIKE $${params.length} OR city ILIKE $${params.length})`);}
    if(type!=='all'){params.push(type);conds.push(`membership_type=$${params.length}`);}
    if(status!=='all'){params.push(status);conds.push(`membership_status=$${params.length}`);}
    if(plan!=='all'){params.push(plan);conds.push(`membership_plan=$${params.length}`);}
    const where=conds.length?`WHERE ${conds.join(' AND ')}`:'';
    const members=await sql(`SELECT * FROM members ${where} ORDER BY created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,limit,offset]);
    const [tot]=await sql(`SELECT COUNT(*) AS total FROM members ${where}`,params);
    const sr=await sql`SELECT membership_type,membership_status,membership_plan,COUNT(*) AS c FROM members GROUP BY membership_type,membership_status,membership_plan`;
    const stats={total:0,active:0,individual:0,student:0,honorary:0,corporate:0,annual:0,lifetime:0};
    sr.forEach(({membership_type:t,membership_status:s,membership_plan:p,c})=>{const n=parseInt(c);stats.total+=n;if(s==='active')stats.active+=n;stats[t]=(stats[t]||0)+n;stats[p]=(stats[p]||0)+n;});
    return NextResponse.json({success:true,data:members,stats,pagination:{page,limit,total:parseInt(tot.total),pages:Math.ceil(tot.total/limit)}});
  } catch(e){return NextResponse.json({success:false,message:e.message},{status:500});}
}

export async function POST(request) {
  if (!auth(request)) return NextResponse.json({success:false,message:'Unauthorized'},{status:401});
  try {
    await ensureInit();
    const sql=getDb(), b=await request.json();
    const errors={};
    if(!b.first_name?.trim())errors.first_name='Required';
    if(!b.last_name?.trim()) errors.last_name='Required';
    if(!b.email?.trim())     errors.email='Required';
    if(b.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email))errors.email='Invalid email';
    if(Object.keys(errors).length)return NextResponse.json({success:false,errors},{status:400});
    const [dup]=await sql`SELECT id FROM members WHERE email=${b.email.toLowerCase()}`;
    if(dup)return NextResponse.json({success:false,errors:{email:'Email already registered'}},{status:409});
    const [m]=await sql`INSERT INTO members (first_name,last_name,email,phone,address,city,state,zip,country,date_of_birth,gender,photo_url,membership_type,membership_plan,membership_status,is_active,joined_date,expiry_date,amount_paid,payment_method,maithili_name,village_district,occupation,notes,is_committee,committee_role) VALUES (${b.first_name.trim()},${b.last_name.trim()},${b.email.toLowerCase()},${b.phone||null},${b.address||null},${b.city||null},${b.state||null},${b.zip||null},${b.country||'USA'},${b.date_of_birth||null},${b.gender||null},${b.photo_url||null},${b.membership_type||'individual'},${b.membership_plan||'annual'},${b.membership_status||'active'},${b.is_active!==undefined?b.is_active:true},${b.joined_date||null},${b.expiry_date||null},${parseFloat(b.amount_paid)||0},${b.payment_method||null},${b.maithili_name||null},${b.village_district||null},${b.occupation||null},${b.notes||null},${b.is_committee||false},${b.committee_role||null}) RETURNING *`;
    return NextResponse.json({success:true,data:m},{status:201});
  } catch(e){return NextResponse.json({success:false,message:e.message},{status:500});}
}
