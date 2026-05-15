// app/api/gallery/albums/[id]/scan/route.js
import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join, isAbsolute } from 'path';
import { getDb, ensureInit } from '@/lib/db';
function auth(req) { return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET; }

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

export async function POST(request, { params }) {
  if (!auth(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  try {
    await ensureInit();
    const sql = getDb();
    const [album] = await sql`SELECT * FROM gallery_albums WHERE id = ${params.id}`;
    if (!album) return NextResponse.json({ success: false, message: 'Album not found' }, { status: 404 });
    if (!album.folder_path) return NextResponse.json({ success: false, message: 'This album has no folder_path configured' }, { status: 400 });

    // Sanitize: reject path traversal or absolute paths
    const fp = album.folder_path;
    if (isAbsolute(fp) || fp.includes('..')) {
      return NextResponse.json({ success: false, message: 'Invalid folder_path' }, { status: 400 });
    }

    const scanDir = join(process.cwd(), 'public', 'images', 'gallery', fp);
    let entries;
    try {
      entries = await readdir(scanDir);
    } catch (err) {
      if (err.code === 'ENOENT') return NextResponse.json({ success: false, message: `Folder not found: public/images/gallery/${fp}` }, { status: 404 });
      throw err;
    }

    const imageFiles = entries.filter(f => {
      const dot = f.lastIndexOf('.');
      return dot !== -1 && IMAGE_EXTS.has(f.slice(dot).toLowerCase());
    });

    // Get URLs already in gallery for this album
    const existing = await sql`SELECT image_url FROM gallery WHERE album_id = ${params.id}`;
    const existingUrls = new Set(existing.map(r => r.image_url));

    let inserted = 0, skipped = 0;
    let firstInsertedUrl = null;
    for (let i = 0; i < imageFiles.length; i++) {
      const url = `/images/gallery/${fp}/${imageFiles[i]}`;
      if (existingUrls.has(url)) { skipped++; continue; }
      await sql`INSERT INTO gallery (image_url, album_id, category, sort_order) VALUES (${url}, ${params.id}, 'general', ${i})`;
      if (firstInsertedUrl === null) firstInsertedUrl = url;
      inserted++;
    }

    // Auto-set cover image if album has none and we inserted at least one photo
    if (!album.cover_image_url && firstInsertedUrl) {
      await sql`UPDATE gallery_albums SET cover_image_url = ${firstInsertedUrl} WHERE id = ${params.id}`;
    }

    return NextResponse.json({ success: true, inserted, skipped, total: imageFiles.length });
  } catch (e) { return NextResponse.json({ success: false, message: e.message }, { status: 500 }); }
}
