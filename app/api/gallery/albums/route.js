// app/api/gallery/albums/route.js
import { NextResponse } from 'next/server';
import { getDb, ensureInit } from '@/lib/db';
function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

export async function GET(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const albums = await sql`
      SELECT ga.*, COUNT(g.id)::int AS photo_count
      FROM gallery_albums ga
      LEFT JOIN gallery g ON g.album_id = ga.id
      GROUP BY ga.id
      ORDER BY ga.sort_order ASC, ga.created_at DESC
    `;
    return NextResponse.json({ success: true, data: albums });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function POST(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb(), b = await request.json();
    if (!b.display_name?.trim()) return NextResponse.json({ success: false, errors: { display_name: 'Display name required' } }, { status: 400 });
    if (!b.name?.trim()) return NextResponse.json({ success: false, errors: { name: 'Slug required' } }, { status: 400 });
    if (!/^[a-z0-9-]+$/.test(b.name)) return NextResponse.json({ success: false, errors: { name: 'Slug must be lowercase letters, numbers, and hyphens only' } }, { status: 400 });
    const [album] = await sql`
      INSERT INTO gallery_albums (name, display_name, description, folder_path, cover_image_url, sort_order)
      VALUES (${b.name.trim()}, ${b.display_name.trim()}, ${b.description || null}, ${b.folder_path || null}, ${b.cover_image_url || null}, ${parseInt(b.sort_order) || 0})
      RETURNING *
    `;
    return NextResponse.json({ success: true, data: album }, { status: 201 });
  } catch (e) {
    if (e.message?.includes('unique')) return NextResponse.json({ success: false, errors: { name: 'This slug is already taken' } }, { status: 400 });
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb(), b = await request.json();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });
    if (b.name && !/^[a-z0-9-]+$/.test(b.name)) return NextResponse.json({ success: false, errors: { name: 'Slug must be lowercase letters, numbers, and hyphens only' } }, { status: 400 });
    const [ex] = await sql`SELECT * FROM gallery_albums WHERE id = ${id}`;
    if (!ex) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const [album] = await sql`
      UPDATE gallery_albums SET
        name = ${b.name ?? ex.name},
        display_name = ${b.display_name ?? ex.display_name},
        description = ${b.description !== undefined ? b.description : ex.description},
        folder_path = ${b.folder_path !== undefined ? b.folder_path : ex.folder_path},
        cover_image_url = ${b.cover_image_url !== undefined ? b.cover_image_url : ex.cover_image_url},
        sort_order = ${b.sort_order !== undefined ? parseInt(b.sort_order) : ex.sort_order}
      WHERE id = ${id} RETURNING *
    `;
    return NextResponse.json({ success: true, data: album });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}

export async function DELETE(request) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'id required' }, { status: 400 });
    const [d] = await sql`DELETE FROM gallery_albums WHERE id = ${id} RETURNING id, display_name`;
    if (!d) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, message: `Album "${d.display_name}" deleted` });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
