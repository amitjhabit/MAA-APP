// app/api/members/template/route.js
import { NextResponse } from 'next/server';
export async function GET() {
  const csv = [
    '# MAA Member Import Template — Maithil Association of America',
    '# Delete these comment rows before importing. Keep the header row exactly as-is.',
    '#',
    '# membership_type: individual | student | honorary | corporate',
    '# membership_plan: annual | lifetime',
    '# membership_status: active | inactive | pending | expired',
    '# payment_method: zelle | credit_card | check | cash | other',
    '# is_active: TRUE | FALSE',
    '# Dates: YYYY-MM-DD format',
    '#',
    'first_name,last_name,email,phone,date_of_birth,gender,address,city,state,zip,country,maithili_name,village_district,occupation,membership_type,membership_plan,membership_status,is_active,joined_date,expiry_date,amount_paid,payment_method,notes',
    'Rajesh,Jha,rajesh.jha@example.com,555-0101,1985-04-14,male,100 Maple Ave,Edison,NJ,08817,USA,राजेश झा,"Darbhanga, Bihar",Software Engineer,individual,annual,active,TRUE,2024-01-15,2025-01-15,50.00,zelle,Regular annual member',
    'Sunita,Mishra,sunita.mishra@example.com,555-0102,1978-07-22,female,200 Oak St,Parsippany,NJ,07054,USA,सुनीता मिश्रा,"Madhubani, Bihar",Doctor,individual,lifetime,active,TRUE,2023-06-01,,500.00,check,Lifetime founding member',
    'Vivek,Thakur,vivek.thakur@example.com,555-0103,2001-09-10,male,300 University Blvd,New Brunswick,NJ,08901,USA,विवेक ठाकुर,"Sitamarhi, Bihar",Student,student,annual,active,TRUE,2024-03-10,2025-03-10,25.00,zelle,Graduate student',
  ].join('\r\n');
  return new NextResponse(csv, {
    headers: { 'Content-Type':'text/csv', 'Content-Disposition':'attachment; filename="MAA_Members_Import_Template.csv"' }
  });
}
