export const dynamic = 'force-dynamic';
// app/api/admin/about/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const rows = await sql`SELECT * FROM about_content ORDER BY type, sort_order ASC, created_at ASC`;
    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const b = await req.json();
    if (!b.type || !b.content?.trim()) return NextResponse.json({ success: false, message: 'type and content are required' }, { status: 400 });
    const [row] = await sql`
      INSERT INTO about_content (type, icon, title, content, sort_order, is_active)
      VALUES (${b.type}, ${b.icon || null}, ${b.title || null}, ${b.content.trim()}, ${parseInt(b.sort_order) || 0}, ${b.is_active !== false})
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: row }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

// PUT — seed default content into about_content (only if table is empty)
const SEED_DATA = [
  { type: 'paragraph', icon: null, title: null, sort_order: 0, content: 'MAA is a non-profit organization passionately dedicated to representing Maithil and Mithila culture on a global platform. In addition to our cultural initiatives, we are committed to enhancing the cultural, educational and fitness aspects within our community.' },
  { type: 'paragraph', icon: null, title: null, sort_order: 1, content: 'Through our educational programs "Gurukul", we aim to empower Maithil youth with access to quality education and skill development opportunities, nurturing the leaders of tomorrow for our community.' },
  { type: 'paragraph', icon: null, title: null, sort_order: 2, content: 'At MAA, we uphold the principles of selfless service and transparency, ensuring that every initiative is driven by the collective spirit of our members. The motive of the organization is to unite the Maithil diaspora to keep our heritage alive.' },
  { type: 'quote',      icon: null, title: null, sort_order: 0, content: "We invite you to join us in preserving and celebrating our vibrant Maithil identity. Together, let's stand tall as proud Maithils and make a meaningful difference in promoting our heritage for generations to come." },
  { type: 'core_value', icon: '🌍', title: 'Cultural Representation', sort_order: 0, content: 'Representing Maithil and Mithila culture passionately on a global platform.' },
  { type: 'core_value', icon: '🎓', title: 'Gurukul Education',       sort_order: 1, content: 'Empowering Maithil youth through quality education and skill development programs.' },
  { type: 'core_value', icon: '🤝', title: 'Selfless Service',        sort_order: 2, content: 'Every initiative driven by the collective spirit and selfless dedication of our members.' },
  { type: 'core_value', icon: '🔍', title: 'Transparency',            sort_order: 3, content: 'Upholding transparency in all our activities, finances, and community initiatives.' },
  { type: 'core_value', icon: '💪', title: 'Health & Fitness',        sort_order: 4, content: 'Committed to enhancing cultural, educational, and fitness aspects within our community.' },
  { type: 'core_value', icon: '🌐', title: 'Unity of Diaspora',       sort_order: 5, content: 'Uniting the Maithil diaspora across America to keep our heritage alive and thriving.' },
  { type: 'activity',   icon: '🎭', title: 'Cultural Events',    sort_order: 0, content: 'Organizing festivals, Chhath Puja, Maithili New Year, and cultural programs throughout the year.' },
  { type: 'activity',   icon: '📚', title: 'Gurukul Programs',   sort_order: 1, content: 'Educational programs for Maithil youth covering language, arts, academics, and leadership skills.' },
  { type: 'activity',   icon: '🤝', title: 'Community Support',  sort_order: 2, content: 'Helping newly arrived Maithili families settle in America with guidance and community connections.' },
  { type: 'activity',   icon: '🎵', title: 'Arts & Music',       sort_order: 3, content: 'Promoting Maithili music, dance, and performing arts through workshops and performances.' },
  { type: 'activity',   icon: '💪', title: 'Fitness & Wellness', sort_order: 4, content: 'Enhancing the health and fitness aspects of our community through organized programs.' },
  { type: 'activity',   icon: '🌐', title: 'Global Outreach',    sort_order: 5, content: 'Connecting Maithili communities worldwide and representing our culture on the global stage.' },
];

export async function PUT(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    // Always truncate and re-seed
    await sql`DELETE FROM about_content`;
    const inserted = [];
    for (const item of SEED_DATA) {
      const [row] = await sql`
        INSERT INTO about_content (type, icon, title, content, sort_order, is_active)
        VALUES (${item.type}, ${item.icon}, ${item.title}, ${item.content}, ${item.sort_order}, true)
        RETURNING *
      `;
      inserted.push(row);
    }
    return NextResponse.json({ success: true, data: inserted, message: `${inserted.length} default items loaded into database.` });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
