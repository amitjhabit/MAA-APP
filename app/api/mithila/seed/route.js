// app/api/mithila/seed/route.js
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function auth(req) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET;
}

const DEFAULT_CONTENT = [
  { section: 'intro',     title: null,                               icon: null,  sort_order: 0,
    content: 'Maithils — also known as Maithili people — are an Indo-Aryan ethno-linguistic group native to the Mithila region, which spans parts of eastern India and southeastern Nepal. Bound together by a deep historical legacy, a shared language, and a distinct culinary and artistic tradition, Maithils possess a unique cultural identity that dates back thousands of years.' },
  { section: 'geography', title: 'India',                            icon: '🇮🇳', sort_order: 0,
    content: 'Primarily the northern and eastern districts of Bihar — including Darbhanga, Madhubani, Samastipur, Saharsa, and Purnia — and parts of Jharkhand (including the Santhal Pargana division).' },
  { section: 'geography', title: 'Nepal',                            icon: '🇳🇵', sort_order: 1,
    content: 'The eastern plains region known as the Terai, encompassing Madhesh Province and Koshi Province — home to a vibrant Maithili-speaking population with deep cultural ties to the Indian side of Mithila.' },
  { section: 'language',  title: 'Official Recognition',             icon: '📜',  sort_order: 0,
    content: 'Maithili is one of the 22 officially recognized languages of India, included in the Eighth Schedule of the Constitution. It is also the second most spoken language in Nepal, reflecting its broad geographic reach.' },
  { section: 'language',  title: 'Tirhuta Script (Mithilakshar)',    icon: '✍️', sort_order: 1,
    content: 'Historically written in the beautiful Tirhuta script — which shares ancestral roots with Bengali and Assamese. While Devanagari is used today for everyday writing, a strong revival movement is actively working to preserve and promote Tirhuta.' },
  { section: 'culture',   title: 'Mithila Painting (Madhubani Art)', icon: '🎨',  sort_order: 0,
    content: 'Perhaps the most globally recognized aspect of Maithil culture — vibrant folk art featuring striking geometric patterns depicting nature, wildlife, and scenes from ancient epics. Traditionally painted by women on mud walls, it has earned international acclaim on paper, canvas, and textiles.' },
  { section: 'culture',   title: 'Literary & Intellectual Heritage', icon: '📚',  sort_order: 1,
    content: "Mithila is the birthplace of Sita (Maithili) and philosopher-king Janaka, and significantly shaped ancient Indian philosophy through the Nyaya and Mimamsa schools. The legendary 14th-century poet Vidyapati — the 'Maithil Kavi Kokil' — revolutionized Maithili literature with timeless devotional lyrics." },
  { section: 'culture',   title: 'Traditions & Social Fabric',      icon: '🪔',  sort_order: 2,
    content: "The Paag headdress symbolizes honor and intellectual heritage, proudly worn at weddings and festivals. Chhath Puja holds profound spiritual significance, alongside Sama Chakeva and Madhushravani. Cuisine celebrates Makhana, fresh river fish, mangoes, and paan — captured in the beloved phrase 'Paan, Maach, aur Makhan.'" },
  { section: 'diaspora',  title: 'A Vibrant Global Diaspora',        icon: '🌍',  sort_order: 0,
    content: 'Today, Maithils form a vibrant global diaspora, excelling in fields ranging from literature and civil services to technology, academia, and enterprise leadership worldwide — while retaining a strong and proud attachment to their ancestral roots.' },
];

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const sql = getDb();

  // Ensure the table exists regardless of whether initDb() ran with the new code
  await sql`CREATE TABLE IF NOT EXISTS mithila_content (
    id               SERIAL PRIMARY KEY,
    section          TEXT NOT NULL DEFAULT 'culture'
                     CHECK (section IN ('intro','geography','language','culture','diaspora')),
    title            TEXT,
    title_maithili   TEXT,
    content          TEXT NOT NULL,
    content_maithili TEXT,
    icon             TEXT,
    image_url        TEXT,
    sort_order       INTEGER DEFAULT 0,
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === '1';

  const [{ c }] = await sql`SELECT COUNT(*) AS c FROM mithila_content`;
  if (parseInt(c) > 0 && !force) {
    return NextResponse.json(
      { success: false, message: `Table already has ${c} row(s). Use the Reset button to overwrite.` },
      { status: 409 }
    );
  }

  if (force) {
    await sql`DELETE FROM mithila_content`;
  }

  let inserted = 0;
  for (const item of DEFAULT_CONTENT) {
    try {
      await sql`
        INSERT INTO mithila_content (section, title, icon, content, sort_order, is_active)
        VALUES (${item.section}, ${item.title}, ${item.icon}, ${item.content}, ${item.sort_order}, true)
      `;
      inserted++;
    } catch (e) {
      console.error('Seed insert error:', e.message);
    }
  }

  return NextResponse.json({ success: true, inserted, message: `Seeded ${inserted} default content items.` });
}
