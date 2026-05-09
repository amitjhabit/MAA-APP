// app/events/page.js — server component: data pre-fetched for instant mobile render
import { getDb, ensureInit } from '@/lib/db';
import EventsClient from '@/app/components/EventsClient';

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  let events = [];
  try {
    await ensureInit();
    const sql = getDb();
    events = await sql`
      SELECT * FROM events
      WHERE status != 'cancelled'
      ORDER BY
        CASE status WHEN 'upcoming' THEN 1 WHEN 'ongoing' THEN 2 WHEN 'completed' THEN 3 ELSE 4 END,
        event_date ASC
      LIMIT 50
    `;
  } catch (e) {
    console.error('EventsPage data fetch:', e.message);
  }

  return <EventsClient initialEvents={events} />;
}
