// app/api/public/events/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

export async function GET(request) {
  try {
    await ensureInit();
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const limit    = parseInt(searchParams.get('limit') || '10');
    const all      = searchParams.get('all') === 'true';
    const category = searchParams.get('category') || '';

    let events;

    if (all) {
      // Events page — all non-cancelled, ordered by date desc
      if (category) {
        events = await sql`
          SELECT * FROM events
          WHERE is_public = TRUE
            AND status != 'cancelled'
            AND category = ${category}
          ORDER BY event_date DESC
          LIMIT ${limit}
        `;
      } else {
        events = await sql`
          SELECT * FROM events
          WHERE is_public = TRUE
            AND status != 'cancelled'
          ORDER BY event_date DESC
          LIMIT ${limit}
        `;
      }
    } else {
      // Homepage — upcoming first, then ongoing, then recently completed
      events = await sql`
        SELECT * FROM events
        WHERE is_public = TRUE
          AND status != 'cancelled'
        ORDER BY
          CASE status
            WHEN 'upcoming' THEN 1
            WHEN 'ongoing'  THEN 2
            WHEN 'completed' THEN 3
            ELSE 4
          END,
          event_date ASC
        LIMIT ${limit}
      `;
    }

    return NextResponse.json({ success: true, data: events, count: events.length });
  } catch (e) {
    console.error('GET /api/public/events:', e);
    return NextResponse.json({ success: true, data: [] });
  }
}
