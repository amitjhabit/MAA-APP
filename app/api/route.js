// app/api/events/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

/* ── GET /api/events ── */
export async function GET(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const search   = searchParams.get('search')   || '';
    const status   = searchParams.get('status')   || 'all';
    const category = searchParams.get('category') || 'all';
    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const offset   = (page - 1) * limit;

    const conds = [], params = [];
    if (search) {
      params.push(`%${search}%`);
      conds.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length} OR location ILIKE $${params.length} OR organizer ILIKE $${params.length})`);
    }
    if (status   !== 'all') { params.push(status);   conds.push(`status = $${params.length}`); }
    if (category !== 'all') { params.push(category); conds.push(`category = $${params.length}`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const events  = await sql(`SELECT * FROM events ${where} ORDER BY event_date DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`, [...params, limit, offset]);
    const [total] = await sql(`SELECT COUNT(*) AS total FROM events ${where}`, params);

    // Stats
    const statsRows = await sql`SELECT status, COUNT(*) AS c FROM events GROUP BY status`;
    const stats = { total: 0, upcoming: 0, ongoing: 0, completed: 0, cancelled: 0 };
    statsRows.forEach(({ status: s, c }) => { stats[s] = parseInt(c); stats.total += parseInt(c); });

    return NextResponse.json({ success: true, data: events, stats, pagination: { page, limit, total: parseInt(total.total), pages: Math.ceil(total.total / limit) } });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

/* ── POST /api/events ── */
export async function POST(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const b   = await request.json();

    const errors = {};
    if (!b.title?.trim())      errors.title      = 'Title is required';
    if (!b.event_date?.trim()) errors.event_date = 'Event date is required';
    if (Object.keys(errors).length) return NextResponse.json({ success: false, errors }, { status: 400 });

    const [event] = await sql`
      INSERT INTO events (
        title, title_maithili, description,
        event_date, event_time, end_date,
        location, address, city, state,
        is_online, meeting_link,
        category, status,
        max_attendees, registration_fee,
        cover_image, organizer, contact_email, is_public
      ) VALUES (
        ${b.title.trim()},
        ${b.title_maithili  || null},
        ${b.description     || null},
        ${b.event_date},
        ${b.event_time      || null},
        ${b.end_date        || null},
        ${b.location        || null},
        ${b.address         || null},
        ${b.city            || null},
        ${b.state           || null},
        ${b.is_online       || false},
        ${b.meeting_link    || null},
        ${b.category        || 'cultural'},
        ${b.status          || 'upcoming'},
        ${b.max_attendees   ? parseInt(b.max_attendees) : null},
        ${b.registration_fee ? parseFloat(b.registration_fee) : 0},
        ${b.cover_image     || null},
        ${b.organizer       || null},
        ${b.contact_email   || null},
        ${b.is_public !== undefined ? b.is_public : true}
      ) RETURNING *
    `;
    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
