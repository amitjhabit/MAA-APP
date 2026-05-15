// app/api/events/[id]/route.js
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getDb } from '@/lib/db';

function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function GET(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const [event] = await sql`SELECT * FROM events WHERE id = ${params.id}`;
    if (!event) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: event });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function PATCH(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const b   = await req.json();
    const [ex] = await sql`SELECT * FROM events WHERE id = ${params.id}`;
    if (!ex) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    const [event] = await sql`
      UPDATE events SET
        title            = ${b.title            ?? ex.title},
        title_maithili   = ${b.title_maithili   ?? ex.title_maithili},
        description      = ${b.description      ?? ex.description},
        event_date       = ${b.event_date       ?? ex.event_date},
        event_time       = ${b.event_time       ?? ex.event_time},
        end_date         = ${b.end_date         ?? ex.end_date},
        location         = ${b.location         ?? ex.location},
        address          = ${b.address          ?? ex.address},
        city             = ${b.city             ?? ex.city},
        state            = ${b.state            ?? ex.state},
        is_online        = ${b.is_online        !== undefined ? b.is_online        : ex.is_online},
        meeting_link     = ${b.meeting_link     ?? ex.meeting_link},
        category         = ${b.category         ?? ex.category},
        status           = ${b.status           ?? ex.status},
        max_attendees    = ${b.max_attendees    !== undefined ? (b.max_attendees ? parseInt(b.max_attendees) : null) : ex.max_attendees},
        registration_fee = ${b.registration_fee !== undefined ? parseFloat(b.registration_fee||0) : ex.registration_fee},
        cover_image      = ${b.cover_image      ?? ex.cover_image},
        organizer        = ${b.organizer        ?? ex.organizer},
        contact_email    = ${b.contact_email    ?? ex.contact_email},
        is_public        = ${b.is_public        !== undefined ? b.is_public        : ex.is_public}
      WHERE id = ${params.id} RETURNING *
    `;
    revalidateTag('events');
    revalidateTag('home');
    return NextResponse.json({ success: true, data: event });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function DELETE(req, { params }) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const [d] = await sql`DELETE FROM events WHERE id = ${params.id} RETURNING id, title`;
    if (!d) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    revalidateTag('events');
    revalidateTag('home');
    return NextResponse.json({ success: true, message: `"${d.title}" deleted` });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
