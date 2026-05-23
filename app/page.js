// app/page.js — Events page is the landing page
export const dynamic = 'force-dynamic';
import { getDb, ensureInit } from '@/lib/db';
import EventsClient from '@/app/components/EventsClient';

export default async function HomePage({ searchParams }) {
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
  const validStatuses = ['all', 'upcoming', 'ongoing', 'completed'];
  const initialStatus = validStatuses.includes(searchParams?.status) ? searchParams.status : 'all';
  return <EventsClient initialEvents={events} initialStatus={initialStatus} />;
}
