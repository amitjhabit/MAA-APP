// app/api/analytics/traffic/route.js — website hit stats (admin auth required)
export const dynamic = 'force-dynamic';
import { getDb, ensureInit } from '@/lib/db';
import { NextResponse } from 'next/server';

function auth(req) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

const PAGE_LABELS = {
  '/':        'Events (Home)',
  '/mission': 'Mission',
  '/about':   'About Us',
  '/news':    'News',
  '/gallery': 'Gallery',
  '/contact': 'Contact',
  '/join':    'Join / Renew',
  '/donate':  'Donate',
};

export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();

    const [totals] = await sql`
      SELECT
        COUNT(*)                                                           AS total_views,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)                AS today_views,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')   AS week_views,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')  AS month_views
      FROM page_views
    `;

    const topPages = await sql`
      SELECT path, COUNT(*) AS count
      FROM page_views
      GROUP BY path
      ORDER BY count DESC
      LIMIT 10
    `;

    const last30Days = await sql`
      SELECT TO_CHAR(DATE(created_at AT TIME ZONE 'UTC'), 'Mon DD') AS label,
             COUNT(*) AS count
      FROM page_views
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at AT TIME ZONE 'UTC')
      ORDER BY DATE(created_at AT TIME ZONE 'UTC') ASC
    `;

    return NextResponse.json({
      success: true,
      traffic: {
        total_views:  parseInt(totals.total_views  || 0),
        today_views:  parseInt(totals.today_views  || 0),
        week_views:   parseInt(totals.week_views   || 0),
        month_views:  parseInt(totals.month_views  || 0),
        top_pages: topPages.map(r => ({
          label: PAGE_LABELS[r.path] || r.path,
          path:  r.path,
          count: parseInt(r.count),
        })),
        last_30_days: last30Days.map(r => ({ label: r.label, count: parseInt(r.count) })),
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
