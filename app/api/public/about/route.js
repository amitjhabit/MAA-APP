export const dynamic = 'force-dynamic';
// app/api/public/about/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

const SEED_DATA = [
  { type: 'paragraph',  icon: null, title: null,                      sort_order: 0, content: 'MAA is a non-profit organization passionately dedicated to representing Maithil and Mithila culture on a global platform. In addition to our cultural initiatives, we are committed to enhancing the cultural, educational and fitness aspects within our community.' },
  { type: 'paragraph',  icon: null, title: null,                      sort_order: 1, content: 'Through our educational programs "Gurukul", we aim to empower Maithil youth with access to quality education and skill development opportunities, nurturing the leaders of tomorrow for our community.' },
  { type: 'paragraph',  icon: null, title: null,                      sort_order: 2, content: 'At MAA, we uphold the principles of selfless service and transparency, ensuring that every initiative is driven by the collective spirit of our members. The motive of the organization is to unite the Maithil diaspora to keep our heritage alive.' },
  { type: 'quote',      icon: null, title: null,                      sort_order: 0, content: "We invite you to join us in preserving and celebrating our vibrant Maithil identity. Together, let's stand tall as proud Maithils and make a meaningful difference in promoting our heritage for generations to come." },
  { type: 'core_value', icon: '🌍', title: 'Cultural Representation',  sort_order: 0, content: 'Representing Maithil and Mithila culture passionately on a global platform.' },
  { type: 'core_value', icon: '🎓', title: 'Gurukul Education',        sort_order: 1, content: 'Empowering Maithil youth through quality education and skill development programs.' },
  { type: 'core_value', icon: '🤝', title: 'Selfless Service',         sort_order: 2, content: 'Every initiative driven by the collective spirit and selfless dedication of our members.' },
  { type: 'core_value', icon: '🔍', title: 'Transparency',             sort_order: 3, content: 'Upholding transparency in all our activities, finances, and community initiatives.' },
  { type: 'core_value', icon: '💪', title: 'Health & Fitness',         sort_order: 4, content: 'Committed to enhancing cultural, educational, and fitness aspects within our community.' },
  { type: 'core_value', icon: '🌐', title: 'Unity of Diaspora',        sort_order: 5, content: 'Uniting the Maithil diaspora across America to keep our heritage alive and thriving.' },
  { type: 'activity',   icon: '🎭', title: 'Cultural Events',          sort_order: 0, content: 'Organizing festivals, Chhath Puja, Maithili New Year, and cultural programs throughout the year.' },
  { type: 'activity',   icon: '📚', title: 'Gurukul Programs',         sort_order: 1, content: 'Educational programs for Maithil youth covering language, arts, academics, and leadership skills.' },
  { type: 'activity',   icon: '🤝', title: 'Community Support',        sort_order: 2, content: 'Helping newly arrived Maithili families settle in America with guidance and community connections.' },
  { type: 'activity',   icon: '🎵', title: 'Arts & Music',             sort_order: 3, content: 'Promoting Maithili music, dance, and performing arts through workshops and performances.' },
  { type: 'activity',   icon: '💪', title: 'Fitness & Wellness',       sort_order: 4, content: 'Enhancing the health and fitness aspects of our community through organized programs.' },
  { type: 'activity',   icon: '🌐', title: 'Global Outreach',          sort_order: 5, content: 'Connecting Maithili communities worldwide and representing our culture on the global stage.' },
];

export async function GET() {
  try {
    await ensureInit();
    const sql = getDb();

    const [countRow] = await sql`SELECT COUNT(*) AS c FROM about_content`;
    const count = parseInt(countRow.c);

    // Fix: if 0 rows seed; if duplicate rows (>16), wipe and re-seed
    if (count === 0 || count > 16) {
      await sql`DELETE FROM about_content`;
      for (const item of SEED_DATA) {
        await sql`INSERT INTO about_content (type, icon, title, content, sort_order, is_active)
          VALUES (${item.type}, ${item.icon}, ${item.title}, ${item.content}, ${item.sort_order}, true)`;
      }
    }

    const rows = await sql`
      SELECT * FROM about_content
      WHERE is_active = TRUE
      ORDER BY type, sort_order ASC, created_at ASC
    `;

    const grouped = {
      paragraphs:  rows.filter(r => r.type === 'paragraph'),
      quote:       rows.find(r => r.type === 'quote') || null,
      core_values: rows.filter(r => r.type === 'core_value'),
      activities:  rows.filter(r => r.type === 'activity'),
    };
    const res = NextResponse.json({ success: true, data: grouped });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (e) {
    return NextResponse.json({ success: false, data: null, error: e.message });
  }
}
