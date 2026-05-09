// lib/db.js
import { neon } from '@neondatabase/serverless';

let _sql;
export function getDb() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set. Copy .env.local.example → .env.local');
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

let _init = false;
export async function ensureInit() {
  if (!_init) { await initDb(); _init = true; }
}

export async function initDb() {
  const sql = getDb();
  await sql`CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    phone TEXT, address TEXT, city TEXT, state TEXT, zip TEXT, country TEXT DEFAULT 'USA',
    date_of_birth DATE, gender TEXT CHECK (gender IN ('male','female','other','prefer_not_to_say')),
    photo_url TEXT,
    membership_type TEXT NOT NULL DEFAULT 'individual' CHECK (membership_type IN ('individual','student','honorary','corporate')),
    membership_plan TEXT NOT NULL DEFAULT 'annual' CHECK (membership_plan IN ('annual','lifetime')),
    membership_status TEXT NOT NULL DEFAULT 'active' CHECK (membership_status IN ('active','inactive','pending','expired')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE, expiry_date DATE,
    amount_paid NUMERIC(10,2) DEFAULT 0, payment_method TEXT,
    maithili_name TEXT, village_district TEXT, occupation TEXT, notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, title_maithili TEXT, description TEXT,
    event_date DATE NOT NULL, event_time TEXT, end_date DATE,
    location TEXT, address TEXT, city TEXT, state TEXT,
    is_online BOOLEAN DEFAULT FALSE, meeting_link TEXT,
    category TEXT DEFAULT 'cultural' CHECK (category IN ('cultural','religious','social','educational','fundraiser','other')),
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed','cancelled')),
    max_attendees INTEGER, registration_fee NUMERIC(10,2) DEFAULT 0,
    cover_image TEXT, organizer TEXT, contact_email TEXT, is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS event_registrations (
    id SERIAL PRIMARY KEY, event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, guests INTEGER DEFAULT 0,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','waitlisted')),
    paid BOOLEAN DEFAULT FALSE, amount NUMERIC(10,2) DEFAULT 0, notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY, member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    donor_name TEXT NOT NULL, donor_email TEXT, donor_phone TEXT,
    amount NUMERIC(10,2) NOT NULL, currency TEXT DEFAULT 'USD',
    payment_method TEXT CHECK (payment_method IN ('zelle','credit_card','check','cash','other')),
    campaign TEXT, purpose TEXT,
    status TEXT DEFAULT 'received' CHECK (status IN ('received','pending','failed','refunded')),
    transaction_id TEXT, receipt_sent BOOLEAN DEFAULT FALSE, notes TEXT,
    donated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS news_posts (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, title_maithili TEXT, slug TEXT UNIQUE,
    excerpt TEXT, content TEXT, content_maithili TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('general','cultural','event','announcement','newsletter')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
    featured_image TEXT, author TEXT, published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS volunteers (
    id SERIAL PRIMARY KEY, member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, role TEXT, skills TEXT,
    availability TEXT, hours_total NUMERIC(6,1) DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
    joined_date DATE DEFAULT CURRENT_DATE, notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS committee_members (
    id SERIAL PRIMARY KEY, member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
    name TEXT NOT NULL, email TEXT, phone TEXT, role TEXT NOT NULL,
    committee TEXT DEFAULT 'board' CHECK (committee IN ('board','executive','cultural','finance','events','youth','other')),
    term_start DATE, term_end DATE, is_current BOOLEAN DEFAULT TRUE,
    bio TEXT, photo_url TEXT, sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS gallery (
    id SERIAL PRIMARY KEY, event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
    title TEXT, description TEXT, image_url TEXT NOT NULL, thumbnail_url TEXT,
    category TEXT DEFAULT 'general', is_featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0, uploaded_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS inquiries (
    id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT,
    subject TEXT DEFAULT 'General Inquiry', message TEXT NOT NULL,
    inquiry_type TEXT DEFAULT 'general' CHECK (inquiry_type IN ('general','membership','event','donation','volunteer','other')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new','read','replied','archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS about_content (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('paragraph','core_value','activity','quote')),
    icon TEXT,
    title TEXT,
    content TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  // Add committee fields to members table if not yet present
  await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS is_committee BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS committee_role TEXT`;

  // Auto-seed about_content with defaults if empty
  const [aboutCount] = await sql`SELECT COUNT(*) AS c FROM about_content`;
  if (parseInt(aboutCount.c) === 0) {
    const seedItems = [
      { type: 'paragraph',  icon: null, title: null,                     sort_order: 0, content: 'MAA is a non-profit organization passionately dedicated to representing Maithil and Mithila culture on a global platform. In addition to our cultural initiatives, we are committed to enhancing the cultural, educational and fitness aspects within our community.' },
      { type: 'paragraph',  icon: null, title: null,                     sort_order: 1, content: 'Through our educational programs "Gurukul", we aim to empower Maithil youth with access to quality education and skill development opportunities, nurturing the leaders of tomorrow for our community.' },
      { type: 'paragraph',  icon: null, title: null,                     sort_order: 2, content: 'At MAA, we uphold the principles of selfless service and transparency, ensuring that every initiative is driven by the collective spirit of our members. The motive of the organization is to unite the Maithil diaspora to keep our heritage alive.' },
      { type: 'quote',      icon: null, title: null,                     sort_order: 0, content: "We invite you to join us in preserving and celebrating our vibrant Maithil identity. Together, let's stand tall as proud Maithils and make a meaningful difference in promoting our heritage for generations to come." },
      { type: 'core_value', icon: '🌍', title: 'Cultural Representation', sort_order: 0, content: 'Representing Maithil and Mithila culture passionately on a global platform.' },
      { type: 'core_value', icon: '🎓', title: 'Gurukul Education',       sort_order: 1, content: 'Empowering Maithil youth through quality education and skill development programs.' },
      { type: 'core_value', icon: '🤝', title: 'Selfless Service',        sort_order: 2, content: 'Every initiative driven by the collective spirit and selfless dedication of our members.' },
      { type: 'core_value', icon: '🔍', title: 'Transparency',            sort_order: 3, content: 'Upholding transparency in all our activities, finances, and community initiatives.' },
      { type: 'core_value', icon: '💪', title: 'Health & Fitness',        sort_order: 4, content: 'Committed to enhancing cultural, educational, and fitness aspects within our community.' },
      { type: 'core_value', icon: '🌐', title: 'Unity of Diaspora',       sort_order: 5, content: 'Uniting the Maithil diaspora across America to keep our heritage alive and thriving.' },
      { type: 'activity',   icon: '🎭', title: 'Cultural Events',         sort_order: 0, content: 'Organizing festivals, Chhath Puja, Maithili New Year, and cultural programs throughout the year.' },
      { type: 'activity',   icon: '📚', title: 'Gurukul Programs',        sort_order: 1, content: 'Educational programs for Maithil youth covering language, arts, academics, and leadership skills.' },
      { type: 'activity',   icon: '🤝', title: 'Community Support',       sort_order: 2, content: 'Helping newly arrived Maithili families settle in America with guidance and community connections.' },
      { type: 'activity',   icon: '🎵', title: 'Arts & Music',            sort_order: 3, content: 'Promoting Maithili music, dance, and performing arts through workshops and performances.' },
      { type: 'activity',   icon: '💪', title: 'Fitness & Wellness',      sort_order: 4, content: 'Enhancing the health and fitness aspects of our community through organized programs.' },
      { type: 'activity',   icon: '🌐', title: 'Global Outreach',         sort_order: 5, content: 'Connecting Maithili communities worldwide and representing our culture on the global stage.' },
    ];
    for (const item of seedItems) {
      try {
        await sql`INSERT INTO about_content (type, icon, title, content, sort_order, is_active) VALUES (${item.type}, ${item.icon}, ${item.title}, ${item.content}, ${item.sort_order}, true)`;
      } catch {}
    }
  }
  await sql`CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql`;
  for (const t of ['members','events','news_posts']) {
    try { await sql.unsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_${t}_upd') THEN CREATE TRIGGER trg_${t}_upd BEFORE UPDATE ON ${t} FOR EACH ROW EXECUTE FUNCTION update_updated_at(); END IF; END $$;`); } catch {}
  }
}
