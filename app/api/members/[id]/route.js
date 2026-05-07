// app/api/members/[id]/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
function auth(req){return req.headers.get('x-admin-secret')===process.env.ADMIN_SECRET;}

export async function GET(req,{params}){
  if(!auth(req))return NextResponse.json({success:false,message:'Unauthorized'},{status:401});
  try{const sql=getDb();const[m]=await sql`SELECT * FROM members WHERE id=${params.id}`;if(!m)return NextResponse.json({success:false,message:'Not found'},{status:404});return NextResponse.json({success:true,data:m});}
  catch(e){return NextResponse.json({success:false,message:e.message},{status:500});}
}
export async function PATCH(req,{params}){
  if(!auth(req))return NextResponse.json({success:false,message:'Unauthorized'},{status:401});
  try{
    const sql=getDb(),b=await req.json();
    const[ex]=await sql`SELECT * FROM members WHERE id=${params.id}`;
    if(!ex)return NextResponse.json({success:false,message:'Not found'},{status:404});
    if(b.email&&b.email!==ex.email){const[d]=await sql`SELECT id FROM members WHERE email=${b.email.toLowerCase()} AND id!=${params.id}`;if(d)return NextResponse.json({success:false,errors:{email:'Email in use'}},{status:409});}
    const[m]=await sql`UPDATE members SET first_name=${b.first_name??ex.first_name},last_name=${b.last_name??ex.last_name},email=${b.email?b.email.toLowerCase():ex.email},phone=${b.phone??ex.phone},address=${b.address??ex.address},city=${b.city??ex.city},state=${b.state??ex.state},zip=${b.zip??ex.zip},country=${b.country??ex.country},date_of_birth=${b.date_of_birth??ex.date_of_birth},gender=${b.gender??ex.gender},photo_url=${b.photo_url??ex.photo_url},membership_type=${b.membership_type??ex.membership_type},membership_plan=${b.membership_plan??ex.membership_plan},membership_status=${b.membership_status??ex.membership_status},is_active=${b.is_active!==undefined?b.is_active:ex.is_active},joined_date=${b.joined_date??ex.joined_date},expiry_date=${b.expiry_date??ex.expiry_date},amount_paid=${b.amount_paid??ex.amount_paid},payment_method=${b.payment_method??ex.payment_method},maithili_name=${b.maithili_name??ex.maithili_name},village_district=${b.village_district??ex.village_district},occupation=${b.occupation??ex.occupation},notes=${b.notes??ex.notes} WHERE id=${params.id} RETURNING *`;
    return NextResponse.json({success:true,data:m});
  }catch(e){return NextResponse.json({success:false,message:e.message},{status:500});}
}
export async function DELETE(req,{params}){
  if(!auth(req))return NextResponse.json({success:false,message:'Unauthorized'},{status:401});
  try{const sql=getDb();const[d]=await sql`DELETE FROM members WHERE id=${params.id} RETURNING id,first_name,last_name`;if(!d)return NextResponse.json({success:false,message:'Not found'},{status:404});return NextResponse.json({success:true,message:`${d.first_name} ${d.last_name} deleted`});}
  catch(e){return NextResponse.json({success:false,message:e.message},{status:500});}
}
