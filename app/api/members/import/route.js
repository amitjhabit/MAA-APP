// app/api/members/import/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

function normaliseType(r) {
  const v = (r||'').toLowerCase();
  if (v.includes('student'))                        return 'student';
  if (v.includes('honor')||v.includes('honour'))    return 'honorary';
  if (v.includes('corporate')||v.includes('sponsor')) return 'corporate';
  return 'individual';
}
function normalisePlan(r)   { return (r||'').toLowerCase().includes('life') ? 'lifetime' : 'annual'; }
function normaliseStatus(r) {
  const v = (r||'').toLowerCase();
  if (v.includes('inactive')) return 'inactive';
  if (v.includes('pending'))  return 'pending';
  if (v.includes('expir'))    return 'expired';
  return 'active';
}
function normaliseBool(r, d=true) {
  if (r===undefined||r===null||r==='') return d;
  const v = String(r).toLowerCase().trim();
  return v==='true'||v==='1'||v==='yes'||v==='y';
}
function normaliseDate(r) {
  if (!r && r!==0) return null;
  const s = String(r).trim();
  if (!s) return null;
  if (/^\d{4,5}$/.test(s)) { const d=new Date((parseInt(s)-25569)*86400000); if(!isNaN(d)) return d.toISOString().split('T')[0]; }
  const d = new Date(s);
  return isNaN(d) ? null : d.toISOString().split('T')[0];
}

export async function POST(request) {
  if (!auth(request)) return NextResponse.json({ success:false, message:'Unauthorized' }, { status:401 });
  try {
    await ensureInit();
    const sql = getDb();
    const { rows, mode='skip' } = await request.json();
    if (!Array.isArray(rows)||rows.length===0) return NextResponse.json({ success:false, message:'No rows provided' }, { status:400 });
    if (rows.length>1000) return NextResponse.json({ success:false, message:'Max 1,000 rows per import' }, { status:400 });

    const results = { inserted:0, updated:0, skipped:0, errors:[] };
    for (let i=0; i<rows.length; i++) {
      const row=rows[i], rowNum=i+2;
      try {
        if (!row.first_name?.trim()) { results.errors.push({row:rowNum,email:row.email,reason:'Missing first_name'}); continue; }
        if (!row.last_name?.trim())  { results.errors.push({row:rowNum,email:row.email,reason:'Missing last_name'});  continue; }
        if (!row.email?.trim())      { results.errors.push({row:rowNum,email:row.email,reason:'Missing email'});      continue; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) { results.errors.push({row:rowNum,email:row.email,reason:'Invalid email'}); continue; }

        const email = row.email.trim().toLowerCase();
        const v = {
          first_name:row.first_name.trim(), last_name:row.last_name.trim(), email,
          phone:row.phone||null, address:row.address||null, city:row.city||null,
          state:row.state||null, zip:row.zip||null, country:row.country||'USA',
          date_of_birth:normaliseDate(row.date_of_birth), gender:row.gender||null, photo_url:row.photo_url||null,
          membership_type:normaliseType(row.membership_type),
          membership_plan:normalisePlan(row.membership_plan),
          membership_status:normaliseStatus(row.membership_status||row.status),
          is_active:normaliseBool(row.is_active??row.active, false),
          joined_date:normaliseDate(row.joined_date||row.join_date)||new Date().toISOString().split('T')[0],
          expiry_date:normaliseDate(row.expiry_date||row.expiration_date),
          amount_paid:parseFloat(row.amount_paid||row.amount||0)||0,
          payment_method:row.payment_method||null,
          maithili_name:row.maithili_name||null,
          village_district:row.village_district||row.village||row.district||null,
          occupation:row.occupation||null,
          notes:row.notes||row.remarks||null,
        };

        const [ex] = await sql`SELECT id FROM members WHERE email=${email}`;
        if (ex) {
          if (mode==='overwrite') {
            await sql`UPDATE members SET first_name=${v.first_name},last_name=${v.last_name},phone=${v.phone},address=${v.address},city=${v.city},state=${v.state},zip=${v.zip},country=${v.country},date_of_birth=${v.date_of_birth},gender=${v.gender},photo_url=${v.photo_url},membership_type=${v.membership_type},membership_plan=${v.membership_plan},membership_status=${v.membership_status},is_active=${v.is_active},joined_date=${v.joined_date},expiry_date=${v.expiry_date},amount_paid=${v.amount_paid},payment_method=${v.payment_method},maithili_name=${v.maithili_name},village_district=${v.village_district},occupation=${v.occupation},notes=${v.notes} WHERE email=${email}`;
            results.updated++;
          } else results.skipped++;
        } else {
          await sql`INSERT INTO members (first_name,last_name,email,phone,address,city,state,zip,country,date_of_birth,gender,photo_url,membership_type,membership_plan,membership_status,is_active,joined_date,expiry_date,amount_paid,payment_method,maithili_name,village_district,occupation,notes) VALUES (${v.first_name},${v.last_name},${v.email},${v.phone},${v.address},${v.city},${v.state},${v.zip},${v.country},${v.date_of_birth},${v.gender},${v.photo_url},${v.membership_type},${v.membership_plan},${v.membership_status},${v.is_active},${v.joined_date},${v.expiry_date},${v.amount_paid},${v.payment_method},${v.maithili_name},${v.village_district},${v.occupation},${v.notes})`;
          results.inserted++;
        }
      } catch(e) { results.errors.push({row:rowNum,email:row.email||'?',reason:e.message}); }
    }
    return NextResponse.json({ success:true, results, message:`${results.inserted} added, ${results.updated} updated, ${results.skipped} skipped, ${results.errors.length} errors` });
  } catch(e) { return NextResponse.json({ success:false, message:e.message }, { status:500 }); }
}
