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
  // ── Finance Module ──────────────────────────────────────────────────────────
  await sql`CREATE TABLE IF NOT EXISTS budget_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income','expense')),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS budget_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES budget_categories(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    fiscal_month INTEGER,
    allocated_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(category_id, fiscal_year, fiscal_month)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS finance_transactions (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('income','expense')),
    category_id INTEGER REFERENCES budget_categories(id) ON DELETE SET NULL,
    reference_type TEXT CHECK (reference_type IN ('donation','membership','event','other')),
    reference_id INTEGER,
    amount NUMERIC(12,2) NOT NULL,
    description TEXT NOT NULL,
    payer_name TEXT,
    payer_email TEXT,
    payment_method TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed','pending','cancelled','refunded')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS receipt_templates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('donation','membership','general')),
    email_subject TEXT NOT NULL,
    email_body TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS receipts (
    id SERIAL PRIMARY KEY,
    receipt_number TEXT NOT NULL UNIQUE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('donation','membership','transaction')),
    reference_id INTEGER,
    template_id INTEGER REFERENCES receipt_templates(id) ON DELETE SET NULL,
    recipient_name TEXT NOT NULL,
    recipient_email TEXT,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    payment_method TEXT,
    payment_date DATE,
    description TEXT,
    receipt_html TEXT,
    status TEXT DEFAULT 'generated' CHECK (status IN ('generated','sent','failed')),
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;

  // Seed default budget categories
  const [catCount] = await sql`SELECT COUNT(*) AS c FROM budget_categories`;
  if (parseInt(catCount.c) === 0) {
    const cats = [
      { name: 'Membership Dues',   type: 'income',  description: 'Annual and lifetime membership fees', sort_order: 0 },
      { name: 'Donations',         type: 'income',  description: 'General and campaign donations',       sort_order: 1 },
      { name: 'Event Revenue',     type: 'income',  description: 'Ticket sales and event fees',          sort_order: 2 },
      { name: 'Grants & Sponsors', type: 'income',  description: 'Grants, sponsorships, and subsidies',  sort_order: 3 },
      { name: 'Other Income',      type: 'income',  description: 'Miscellaneous income',                 sort_order: 4 },
      { name: 'Event Expenses',    type: 'expense', description: 'Venue, catering, decoration costs',    sort_order: 5 },
      { name: 'Administrative',    type: 'expense', description: 'Office, software, and admin costs',    sort_order: 6 },
      { name: 'Marketing',         type: 'expense', description: 'Printing, ads, and outreach',          sort_order: 7 },
      { name: 'Education',         type: 'expense', description: 'Gurukul and educational programs',     sort_order: 8 },
      { name: 'Other Expenses',    type: 'expense', description: 'Miscellaneous expenses',               sort_order: 9 },
    ];
    for (const c of cats) {
      try { await sql`INSERT INTO budget_categories (name,type,description,sort_order) VALUES (${c.name},${c.type},${c.description},${c.sort_order})`; } catch {}
    }
  }

  // Seed default receipt templates
  const [tplCount] = await sql`SELECT COUNT(*) AS c FROM receipt_templates`;
  if (parseInt(tplCount.c) === 0) {
    const donationBody = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;border:1px solid #e0c97f;border-radius:8px">
  <div style="text-align:center;border-bottom:3px solid #E8720C;padding-bottom:16px;margin-bottom:24px">
    <h1 style="color:#0D2137;font-size:24px;margin:0">Maithil Association of America</h1>
    <p style="color:#C9960C;margin:4px 0 0;font-style:italic">मैथिल एसोसिएशन ऑफ अमेरिका</p>
    <p style="color:#666;font-size:13px;margin:8px 0 0">Official Donation Receipt</p>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr><td style="padding:8px 0;color:#555;width:40%">Receipt No.</td><td style="padding:8px 0;font-weight:bold;color:#0D2137">{{receipt_number}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Date</td><td style="padding:8px 0;color:#0D2137">{{payment_date}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Donor Name</td><td style="padding:8px 0;color:#0D2137">{{recipient_name}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Description</td><td style="padding:8px 0;color:#0D2137">{{description}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Payment Method</td><td style="padding:8px 0;color:#0D2137">{{payment_method}}</td></tr>
    <tr style="background:#fdf6e3"><td style="padding:12px 8px;color:#555;font-weight:bold">Amount</td><td style="padding:12px 8px;font-size:20px;font-weight:bold;color:#E8720C">{{currency}} {{amount}}</td></tr>
  </table>
  <p style="color:#555;font-size:13px;line-height:1.6">Thank you for your generous contribution to the Maithil Association of America. Your donation supports our mission to preserve and promote Maithili culture and heritage across America.</p>
  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;text-align:center;color:#999;font-size:11px">
    <p>MAA is a non-profit organization · San Ramon, California</p>
    <p>contributemaa@maithilusa.org</p>
  </div>
</div>`;

    const membershipBody = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;border:1px solid #e0c97f;border-radius:8px">
  <div style="text-align:center;border-bottom:3px solid #E8720C;padding-bottom:16px;margin-bottom:24px">
    <h1 style="color:#0D2137;font-size:24px;margin:0">Maithil Association of America</h1>
    <p style="color:#C9960C;margin:4px 0 0;font-style:italic">मैथिल एसोसिएशन ऑफ अमेरिका</p>
    <p style="color:#666;font-size:13px;margin:8px 0 0">Membership Payment Receipt</p>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr><td style="padding:8px 0;color:#555;width:40%">Receipt No.</td><td style="padding:8px 0;font-weight:bold;color:#0D2137">{{receipt_number}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Date</td><td style="padding:8px 0;color:#0D2137">{{payment_date}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Member Name</td><td style="padding:8px 0;color:#0D2137">{{recipient_name}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Membership</td><td style="padding:8px 0;color:#0D2137">{{description}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Payment Method</td><td style="padding:8px 0;color:#0D2137">{{payment_method}}</td></tr>
    <tr style="background:#fdf6e3"><td style="padding:12px 8px;color:#555;font-weight:bold">Amount Paid</td><td style="padding:12px 8px;font-size:20px;font-weight:bold;color:#E8720C">{{currency}} {{amount}}</td></tr>
  </table>
  <p style="color:#555;font-size:13px;line-height:1.6">Welcome to the Maithil Association of America! Your membership helps us celebrate and preserve our rich Maithili heritage. We look forward to your participation in our events and activities.</p>
  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;text-align:center;color:#999;font-size:11px">
    <p>MAA is a non-profit organization · San Ramon, California</p>
    <p>contributemaa@maithilusa.org</p>
  </div>
</div>`;

    try {
      await sql`INSERT INTO receipt_templates (name,type,email_subject,email_body,is_default,is_active)
        VALUES ('Default Donation Receipt','donation','Donation Receipt from Maithil Association of America - {{receipt_number}}',${donationBody},true,true)`;
      await sql`INSERT INTO receipt_templates (name,type,email_subject,email_body,is_default,is_active)
        VALUES ('Default Membership Receipt','membership','Membership Payment Receipt - Maithil Association of America',${membershipBody},true,true)`;
    } catch {}
  }

  await sql`CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql`;
  for (const t of ['members','events','news_posts','budget_items','finance_transactions','receipt_templates']) {
    try { await sql.unsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_${t}_upd') THEN CREATE TRIGGER trg_${t}_upd BEFORE UPDATE ON ${t} FOR EACH ROW EXECUTE FUNCTION update_updated_at(); END IF; END $$;`); } catch {}
  }
}
