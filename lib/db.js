// lib/db.js
import { neon } from '@neondatabase/serverless';

let _sql;
export function getDb() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set. Copy .env.local.example → .env.local');
    _sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });
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
  await sql`CREATE TABLE IF NOT EXISTS gallery_albums (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,
    display_name    TEXT NOT NULL,
    description     TEXT,
    folder_path     TEXT,
    cover_image_url TEXT,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS gallery (
    id SERIAL PRIMARY KEY, event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
    title TEXT, description TEXT, image_url TEXT NOT NULL, thumbnail_url TEXT,
    category TEXT DEFAULT 'general', is_featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0, uploaded_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS album_id INTEGER REFERENCES gallery_albums(id) ON DELETE SET NULL`;
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
  await sql`CREATE TABLE IF NOT EXISTS homepage_content (
    id         SERIAL PRIMARY KEY,
    section    TEXT NOT NULL,
    key        TEXT NOT NULL,
    value      TEXT NOT NULL DEFAULT '',
    is_active  BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(section, key)
  )`;

  // Add pdf_base64 column to receipts for storing generated PDFs
  await sql`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS pdf_base64 TEXT`;
  // Ensure amount column exists for receipts created outside finance transactions
  await sql`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) DEFAULT 0`;
  // Link receipts back to their source donation so resend reuses the same receipt number
  await sql`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS donation_id INTEGER REFERENCES donations(id) ON DELETE SET NULL`;

  // Patch existing receipt html_content to add base64 logo if missing
  const LOGO_IMG = `<img src="/images/gallery/Mithila_logo.jpeg" alt="MAA Logo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;border:3px solid #E8720C;" />`;
  try {
    await sql`UPDATE receipts SET html_content = REPLACE(html_content, '<h1 style="color:#0D2137;font-size:24px;margin:0">Maithil Association of America</h1>', ${LOGO_IMG + '<h1 style="color:#0D2137;font-size:24px;margin:0">Maithil Association of America</h1>'}) WHERE html_content NOT LIKE '%Mithila_logo%' AND html_content LIKE '%Maithil Association of America%'`;
  } catch {}

  // Remove deprecated homepage sections from DB
  await sql`DELETE FROM homepage_content WHERE section IN ('inquiry_cta', 'join_cta')`;

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
    subject TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL DEFAULT '',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS receipts (
    id SERIAL PRIMARY KEY,
    receipt_number TEXT NOT NULL UNIQUE,
    transaction_id INTEGER REFERENCES finance_transactions(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES receipt_templates(id) ON DELETE SET NULL,
    recipient_name TEXT NOT NULL DEFAULT '',
    recipient_email TEXT,
    html_content TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    emailed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  // Migrate existing columns for installations created before this fix
  try { await sql`ALTER TABLE receipt_templates ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT ''`; } catch {}
  try { await sql`ALTER TABLE receipt_templates ADD COLUMN IF NOT EXISTS body_html TEXT NOT NULL DEFAULT ''`; } catch {}
  try { await sql`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS transaction_id INTEGER REFERENCES finance_transactions(id) ON DELETE CASCADE`; } catch {}
  try { await sql`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS html_content TEXT`; } catch {}
  try { await sql`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`; } catch {}
  try { await sql`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS emailed_at TIMESTAMPTZ`; } catch {}
  try { await sql`ALTER TABLE receipts ALTER COLUMN recipient_name SET DEFAULT ''`; } catch {}
  try { await sql`ALTER TABLE receipts ALTER COLUMN transaction_type DROP NOT NULL`; } catch {}
  try { await sql`ALTER TABLE receipts ALTER COLUMN amount DROP NOT NULL`; } catch {}
  try { await sql`ALTER TABLE receipt_templates ADD COLUMN IF NOT EXISTS signature_base64 TEXT`; } catch {}
  try { await sql`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS drive_file_id TEXT`; } catch {}
  try { await sql`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS drive_link TEXT`; } catch {}
  // reference_type / reference_id link receipts to donations, memberships, etc.
  try { await sql`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS reference_type TEXT CHECK (reference_type IN ('donation','membership','event','other'))`; } catch {}
  try { await sql`ALTER TABLE receipts ADD COLUMN IF NOT EXISTS reference_id INTEGER`; } catch {}
  // purpose column on donations for event/sponsorship detail
  try { await sql`ALTER TABLE donations ADD COLUMN IF NOT EXISTS purpose TEXT`; } catch {}
  try { await sql`ALTER TABLE about_content DROP CONSTRAINT IF EXISTS about_content_type_check`; } catch {}
  try { await sql`ALTER TABLE about_content ADD CONSTRAINT about_content_type_check CHECK (type IN ('paragraph','core_value','activity','quote','goals','hero_banner'))`; } catch {}
  try { await sql`ALTER TABLE committee_members DROP CONSTRAINT IF EXISTS committee_members_committee_check`; } catch {}
  try { await sql`ALTER TABLE committee_members ADD CONSTRAINT committee_members_committee_check CHECK (committee IN ('board','executive','cultural','finance','events','youth','technology','other'))`; } catch {}
  // Add structured name and address fields to volunteers
  try { await sql`ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS first_name TEXT`; } catch {}
  try { await sql`ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS last_name TEXT`; } catch {}
  try { await sql`ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS address TEXT`; } catch {}
  // Back-fill first_name from legacy single-name field so existing records stay intact
  try { await sql`UPDATE volunteers SET first_name = split_part(name,' ',1), last_name = NULLIF(trim(substring(name from position(' ' in name))), '') WHERE first_name IS NULL AND name IS NOT NULL`; } catch {}
  // Copy old column data into new columns for existing rows
  try { await sql`UPDATE receipt_templates SET subject = email_subject WHERE subject = '' AND email_subject IS NOT NULL`; } catch {}
  try { await sql`UPDATE receipt_templates SET body_html = email_body WHERE body_html = '' AND email_body IS NOT NULL`; } catch {}

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
  const donationBody = `<div style="font-family:Georgia,serif;max-width:650px;margin:0 auto;padding:40px;border:1px solid #e0c97f;border-radius:8px">
  <div style="text-align:center;border-bottom:3px solid #E8720C;padding-bottom:16px;margin-bottom:28px">
    {{logo_img}}
    <h1 style="color:#0D2137;font-size:22px;margin:0">Maithil Association of America</h1>
    <p style="color:#C9960C;margin:4px 0 0;font-style:italic">मैथिल एसोसिएशन ऑफ अमेरिका</p>
    <h2 style="color:#E8720C;font-size:15px;margin:10px 0 0;letter-spacing:2px;text-transform:uppercase">Donation Receipt</h2>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px">
    <tr><td style="padding:5px 0;color:#555;width:48%">Date:</td><td style="padding:5px 0;color:#0D2137;border-bottom:1px solid #bbb">{{transaction_date}}</td></tr>
    <tr><td style="padding:5px 0;color:#555">Receipt No.:</td><td style="padding:5px 0;color:#0D2137;font-weight:bold">{{receipt_number}}</td></tr>
    <tr><td style="padding:5px 0;color:#555">Name of Non-Profit Organization:</td><td style="padding:5px 0;color:#0D2137">Maithil Association of America</td></tr>
    <tr><td style="padding:5px 0;color:#555">Mailing Address:</td><td style="padding:5px 0;color:#0D2137">info@maithilusa.org</td></tr>
    <tr><td style="padding:5px 0;color:#555">EIN:</td><td style="padding:5px 0;color:#0D2137;font-weight:bold">99-1915636</td></tr>
  </table>

  <div style="background:#fdf6e3;border:1px solid #e0c97f;border-radius:4px;padding:16px;margin-bottom:16px">
    <h3 style="color:#0D2137;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e0c97f;padding-bottom:6px">Donor Information</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:5px 0;color:#555;width:40%">Donor's Name:</td><td style="padding:5px 0;color:#0D2137;border-bottom:1px solid #ccc">{{recipient_name}}</td></tr>
      <tr><td style="padding:5px 0;color:#555">Donor's Address:</td><td style="padding:5px 0;border-bottom:1px solid #ccc">&nbsp;</td></tr>
    </table>
  </div>

  <div style="background:#f9f9f9;border:1px solid #ddd;border-radius:4px;padding:16px;margin-bottom:20px">
    <h3 style="color:#0D2137;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #ddd;padding-bottom:6px">Donation Information</h3>
    <p style="color:#333;font-size:14px;line-height:1.8;margin:0 0 14px">
      Thank you for your donation with a value of
      <strong style="color:#E8720C">{{amount_words}} ($ {{amount}})</strong>,
      made to the above mentioned 501(c)(3) Non-Profit organization.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:5px 0;color:#555;width:40%">Donation Description:</td><td style="padding:5px 0;color:#0D2137;border-bottom:1px solid #ccc">{{description}}</td></tr>
      <tr><td style="padding:5px 0;color:#555">Payment Method:</td><td style="padding:5px 0;color:#0D2137">{{payment_method}}</td></tr>
    </table>
  </div>

  <p style="color:#555;font-size:12px;line-height:1.8;margin-bottom:28px">
    I, the undersigned representative, declare (or certify, verify, or state) under penalty of perjury under the laws of United States of America that there were no goods or services provided as part of donation. Furthermore, as of the date of this receipt the above-mentioned organization is a current and valid 501(c)(3) non-profit organization in accordance with the standards and regulations of Internal Revenue Service (IRS).
  </p>

  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <tr>
      <td style="width:55%;padding-right:24px;vertical-align:bottom">
        <div style="border-bottom:2px solid #333;min-height:110px;padding:10px 0 6px"></div>
        <p style="color:#555;margin:4px 0 0">Representative's Signature</p>
      </td>
      <td style="width:45%;vertical-align:bottom">
        <div style="border-bottom:1px solid #333;height:36px;display:flex;align-items:flex-end;padding-bottom:4px;color:#333;font-size:13px">{{generated_date}}</div>
        <p style="color:#555;margin:4px 0 0">Date</p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 24px 0 0;vertical-align:bottom">
        <div style="border-bottom:1px solid #333;padding-top:6px;color:#0D2137;font-weight:600">{{representative_name}}</div>
        <p style="color:#555;margin:4px 0 0">Representative Name</p>
      </td>
      <td style="padding:20px 0 0 0;vertical-align:bottom">
        <div style="border-bottom:1px solid #333;padding-top:6px;color:#0D2137">President</div>
        <p style="color:#555;margin:4px 0 0">Title</p>
      </td>
    </tr>
  </table>

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;text-align:center;color:#999;font-size:11px">
    <p style="margin:0">MAA is a 501(c)(3) non-profit organization &middot; EIN: 99-1915636</p>
    <p style="margin:4px 0 0">San Ramon, California &middot; info@maithilusa.org</p>
  </div>
</div>`;

  const membershipBody = `<div style="font-family:Georgia,serif;max-width:650px;margin:0 auto;padding:40px;border:1px solid #e0c97f;border-radius:8px">
  <div style="text-align:center;border-bottom:3px solid #E8720C;padding-bottom:16px;margin-bottom:28px">
    {{logo_img}}
    <h1 style="color:#0D2137;font-size:22px;margin:0">Maithil Association of America</h1>
    <p style="color:#C9960C;margin:4px 0 0;font-style:italic">मैथिल एसोसिएशन ऑफ अमेरिका</p>
    <h2 style="color:#E8720C;font-size:15px;margin:10px 0 0;letter-spacing:2px;text-transform:uppercase">Membership Payment Receipt</h2>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px">
    <tr><td style="padding:5px 0;color:#555;width:48%">Date:</td><td style="padding:5px 0;color:#0D2137;border-bottom:1px solid #bbb">{{transaction_date}}</td></tr>
    <tr><td style="padding:5px 0;color:#555">Receipt No.:</td><td style="padding:5px 0;color:#0D2137;font-weight:bold">{{receipt_number}}</td></tr>
    <tr><td style="padding:5px 0;color:#555">Name of Non-Profit Organization:</td><td style="padding:5px 0;color:#0D2137">Maithil Association of America</td></tr>
    <tr><td style="padding:5px 0;color:#555">Mailing Address:</td><td style="padding:5px 0;color:#0D2137">info@maithilusa.org</td></tr>
    <tr><td style="padding:5px 0;color:#555">EIN:</td><td style="padding:5px 0;color:#0D2137;font-weight:bold">99-1915636</td></tr>
  </table>

  <div style="background:#fdf6e3;border:1px solid #e0c97f;border-radius:4px;padding:16px;margin-bottom:16px">
    <h3 style="color:#0D2137;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e0c97f;padding-bottom:6px">Member Information</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:5px 0;color:#555;width:40%">Member's Name:</td><td style="padding:5px 0;color:#0D2137;border-bottom:1px solid #ccc">{{recipient_name}}</td></tr>
      <tr><td style="padding:5px 0;color:#555">Member's Address:</td><td style="padding:5px 0;border-bottom:1px solid #ccc">&nbsp;</td></tr>
    </table>
  </div>

  <div style="background:#f9f9f9;border:1px solid #ddd;border-radius:4px;padding:16px;margin-bottom:20px">
    <h3 style="color:#0D2137;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #ddd;padding-bottom:6px">Membership Payment Information</h3>
    <p style="color:#333;font-size:14px;line-height:1.8;margin:0 0 14px">
      Thank you for your membership payment with a value of
      <strong style="color:#E8720C">{{amount_words}} ($ {{amount}})</strong>,
      made to the above mentioned 501(c)(3) Non-Profit organization.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:5px 0;color:#555;width:40%">Membership Type:</td><td style="padding:5px 0;color:#0D2137;border-bottom:1px solid #ccc">{{description}}</td></tr>
      <tr><td style="padding:5px 0;color:#555">Payment Method:</td><td style="padding:5px 0;color:#0D2137">{{payment_method}}</td></tr>
    </table>
  </div>

  <p style="color:#555;font-size:12px;line-height:1.8;margin-bottom:28px">
    I, the undersigned representative, declare (or certify, verify, or state) under penalty of perjury under the laws of United States of America that there were no goods or services provided as part of this membership payment. Furthermore, as of the date of this receipt the above-mentioned organization is a current and valid 501(c)(3) non-profit organization in accordance with the standards and regulations of Internal Revenue Service (IRS).
  </p>

  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <tr>
      <td style="width:55%;padding-right:24px;vertical-align:bottom">
        <div style="border-bottom:2px solid #333;min-height:110px;padding:10px 0 6px"></div>
        <p style="color:#555;margin:4px 0 0">Representative's Signature</p>
      </td>
      <td style="width:45%;vertical-align:bottom">
        <div style="border-bottom:1px solid #333;height:36px;display:flex;align-items:flex-end;padding-bottom:4px;color:#333;font-size:13px">{{generated_date}}</div>
        <p style="color:#555;margin:4px 0 0">Date</p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 24px 0 0;vertical-align:bottom">
        <div style="border-bottom:1px solid #333;padding-top:6px;color:#0D2137;font-weight:600">{{representative_name}}</div>
        <p style="color:#555;margin:4px 0 0">Representative Name</p>
      </td>
      <td style="padding:20px 0 0 0;vertical-align:bottom">
        <div style="border-bottom:1px solid #333;padding-top:6px;color:#0D2137">President</div>
        <p style="color:#555;margin:4px 0 0">Title</p>
      </td>
    </tr>
  </table>

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;text-align:center;color:#999;font-size:11px">
    <p style="margin:0">MAA is a 501(c)(3) non-profit organization &middot; EIN: 99-1915636</p>
    <p style="margin:4px 0 0">San Ramon, California &middot; info@maithilusa.org</p>
  </div>
</div>`;

  if (parseInt(tplCount.c) === 0) {
    try {
      await sql`INSERT INTO receipt_templates (name,subject,body_html,is_default,is_active)
        VALUES ('Default Donation Receipt','Donation Receipt from Maithil Association of America - {{receipt_number}}',${donationBody},true,true)`;
      await sql`INSERT INTO receipt_templates (name,subject,body_html,is_default,is_active)
        VALUES ('Default Membership Receipt','Membership Payment Receipt - Maithil Association of America',${membershipBody},false,true)`;
    } catch {}
  }
  // Always sync templates to latest version on every initDb() call
  try {
    await sql`UPDATE receipt_templates SET body_html = ${donationBody} WHERE name = 'Default Donation Receipt'`;
    await sql`UPDATE receipt_templates SET body_html = ${membershipBody} WHERE name = 'Default Membership Receipt'`;
  } catch {}

  // Set committee member photos by name only if not already set (preserve admin changes)
  try { await sql`UPDATE committee_members SET photo_url='/images/gallery/SunilJha.jpg'    WHERE LOWER(name) LIKE '%sunil%jha%'    AND (photo_url IS NULL OR photo_url = '')`; } catch {}
  try { await sql`UPDATE committee_members SET photo_url='/images/gallery/Aditi.png'        WHERE LOWER(name) LIKE '%aditi%'         AND (photo_url IS NULL OR photo_url = '')`; } catch {}
  try { await sql`UPDATE committee_members SET photo_url='/images/gallery/DeepakMishra.png' WHERE LOWER(name) LIKE '%deepak%mishra%' AND (photo_url IS NULL OR photo_url = '')`; } catch {}
  try { await sql`UPDATE committee_members SET photo_url='/images/gallery/Shailesh.jpg'     WHERE LOWER(name) LIKE '%shailesh%'      AND (photo_url IS NULL OR photo_url = '')`; } catch {}
  try { await sql`UPDATE committee_members SET photo_url='/images/gallery/Minakshi.jpg'     WHERE LOWER(name) LIKE '%minakshi%'      AND (photo_url IS NULL OR photo_url = '')`; } catch {}
  try { await sql`UPDATE committee_members SET photo_url='/images/gallery/Saroj.jpg'        WHERE LOWER(name) LIKE '%saroj%'         AND (photo_url IS NULL OR photo_url = '')`; } catch {}
  try { await sql`UPDATE committee_members SET photo_url='/images/gallery/SanjeevM.jpg'     WHERE LOWER(name) LIKE '%sanjeev%'       AND (photo_url IS NULL OR photo_url = '' OR photo_url LIKE '%Sanjeev%')`; } catch {}
  try { await sql`UPDATE committee_members SET photo_url='/images/gallery/NehaJha.jpeg'     WHERE LOWER(name) LIKE '%neha%'          AND (photo_url IS NULL OR photo_url = '')`; } catch {}
  try { await sql`UPDATE committee_members SET photo_url='/images/gallery/PujaJha2.PNG'     WHERE LOWER(name) LIKE '%puja%'          AND (photo_url IS NULL OR photo_url = '')`; } catch {}
  try { await sql`UPDATE committee_members SET photo_url='/images/gallery/AmitJha.png'      WHERE (LOWER(name) LIKE '%amit%jha%' OR LOWER(name) LIKE '%amit kumar%') AND (photo_url IS NULL OR photo_url = '')`; } catch {}

  // Page view tracking
  await sql`CREATE TABLE IF NOT EXISTS page_views (
    id         SERIAL PRIMARY KEY,
    path       TEXT NOT NULL,
    referrer   TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  try { await sql`CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views (created_at DESC)`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views (path)`; } catch {}

  // Mithila page content
  await sql`CREATE TABLE IF NOT EXISTS mithila_content (
    id SERIAL PRIMARY KEY,
    section TEXT NOT NULL DEFAULT 'culture' CHECK (section IN ('intro','geography','language','culture','diaspora')),
    title TEXT,
    title_maithili TEXT,
    content TEXT NOT NULL,
    content_maithili TEXT,
    icon TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  const [mithilaCount] = await sql`SELECT COUNT(*) AS c FROM mithila_content`;
  if (parseInt(mithilaCount.c) === 0) {
    const mithilaSeed = [
      { section: 'intro',     title: null,                             icon: null,  sort_order: 0, content: 'Maithils — also known as Maithili people — are an Indo-Aryan ethno-linguistic group native to the Mithila region, which spans parts of eastern India and southeastern Nepal. Bound together by a deep historical legacy, a shared language, and a distinct culinary and artistic tradition, Maithils possess a unique cultural identity that dates back thousands of years.' },
      { section: 'geography', title: 'India',                          icon: '🇮🇳', sort_order: 0, content: 'Primarily the northern and eastern districts of Bihar — including Darbhanga, Madhubani, Samastipur, Saharsa, and Purnia — and parts of Jharkhand (including the Santhal Pargana division).' },
      { section: 'geography', title: 'Nepal',                          icon: '🇳🇵', sort_order: 1, content: 'The eastern plains region known as the Terai, encompassing Madhesh Province and Koshi Province — home to a vibrant Maithili-speaking population with deep cultural ties to the Indian side of Mithila.' },
      { section: 'language',  title: 'Official Recognition',           icon: '📜',  sort_order: 0, content: 'Maithili is one of the 22 officially recognized languages of India, included in the Eighth Schedule of the Constitution. It is also the second most spoken language in Nepal, reflecting its broad geographic reach.' },
      { section: 'language',  title: 'Tirhuta Script (Mithilakshar)',  icon: '✍️', sort_order: 1, content: 'Historically written in the beautiful Tirhuta script — which shares ancestral roots with Bengali and Assamese. While Devanagari is used today for everyday writing, a strong revival movement is actively working to preserve and promote Tirhuta.' },
      { section: 'culture',   title: 'Mithila Painting (Madhubani Art)', icon: '🎨', sort_order: 0, content: 'Perhaps the most globally recognized aspect of Maithil culture — vibrant folk art featuring striking geometric patterns depicting nature, wildlife, and scenes from ancient epics. Traditionally painted by women on mud walls, it has earned international acclaim on paper, canvas, and textiles.' },
      { section: 'culture',   title: 'Literary & Intellectual Heritage', icon: '📚', sort_order: 1, content: "Mithila is the birthplace of Sita (Maithili) and philosopher-king Janaka, and significantly shaped ancient Indian philosophy through the Nyaya and Mimamsa schools. The legendary 14th-century poet Vidyapati — the 'Maithil Kavi Kokil' — revolutionized Maithili literature with timeless devotional lyrics." },
      { section: 'culture',   title: 'Traditions & Social Fabric',     icon: '🪔',  sort_order: 2, content: "The Paag headdress symbolizes honor and intellectual heritage, proudly worn at weddings and festivals. Chhath Puja holds profound spiritual significance, alongside Sama Chakeva and Madhushravani. Cuisine celebrates Makhana, fresh river fish, mangoes, and paan — captured in the beloved phrase 'Paan, Maach, aur Makhan.'" },
      { section: 'diaspora',  title: 'A Vibrant Global Diaspora',      icon: '🌍',  sort_order: 0, content: 'Today, Maithils form a vibrant global diaspora, excelling in fields ranging from literature and civil services to technology, academia, and enterprise leadership worldwide — while retaining a strong and proud attachment to their ancestral roots.' },
    ];
    for (const item of mithilaSeed) {
      try { await sql`INSERT INTO mithila_content (section, title, icon, content, sort_order, is_active) VALUES (${item.section}, ${item.title}, ${item.icon}, ${item.content}, ${item.sort_order}, true)`; } catch {}
    }
  }

  await sql`CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql`;
  for (const t of ['members','events','news_posts','budget_items','finance_transactions','receipt_templates','mithila_content']) {
    try { await sql.unsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_${t}_upd') THEN CREATE TRIGGER trg_${t}_upd BEFORE UPDATE ON ${t} FOR EACH ROW EXECUTE FUNCTION update_updated_at(); END IF; END $$;`); } catch {}
  }
}

// Force-update both default receipt templates to the latest body_html regardless of _init.
// Called by the admin reseed endpoint — bypasses the one-time initDb() guard.
export async function forceReseedTemplates() {
  const sql = getDb();

  const donationBody = `<div style="font-family:Georgia,serif;max-width:650px;margin:0 auto;padding:40px;border:1px solid #e0c97f;border-radius:8px">
  <div style="text-align:center;border-bottom:3px solid #E8720C;padding-bottom:16px;margin-bottom:28px">
    {{logo_img}}
    <h1 style="color:#0D2137;font-size:22px;margin:0">Maithil Association of America</h1>
    <p style="color:#C9960C;margin:4px 0 0;font-style:italic">मैथिल एसोसिएशन ऑफ अमेरिका</p>
    <h2 style="color:#E8720C;font-size:15px;margin:10px 0 0;letter-spacing:2px;text-transform:uppercase">Donation Receipt</h2>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px">
    <tr><td style="padding:5px 0;color:#555;width:48%">Date:</td><td style="padding:5px 0;color:#0D2137;border-bottom:1px solid #bbb">{{transaction_date}}</td></tr>
    <tr><td style="padding:5px 0;color:#555">Receipt No.:</td><td style="padding:5px 0;color:#0D2137;font-weight:bold">{{receipt_number}}</td></tr>
    <tr><td style="padding:5px 0;color:#555">Name of Non-Profit Organization:</td><td style="padding:5px 0;color:#0D2137">Maithil Association of America</td></tr>
    <tr><td style="padding:5px 0;color:#555">Mailing Address:</td><td style="padding:5px 0;color:#0D2137">info@maithilusa.org</td></tr>
    <tr><td style="padding:5px 0;color:#555">EIN:</td><td style="padding:5px 0;color:#0D2137;font-weight:bold">99-1915636</td></tr>
  </table>

  <div style="background:#fdf6e3;border:1px solid #e0c97f;border-radius:4px;padding:16px;margin-bottom:16px">
    <h3 style="color:#0D2137;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e0c97f;padding-bottom:6px">Donor Information</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:5px 0;color:#555;width:40%">Donor's Name:</td><td style="padding:5px 0;color:#0D2137;border-bottom:1px solid #ccc">{{recipient_name}}</td></tr>
      <tr><td style="padding:5px 0;color:#555">Donor's Address:</td><td style="padding:5px 0;border-bottom:1px solid #ccc">&nbsp;</td></tr>
    </table>
  </div>

  <div style="background:#f9f9f9;border:1px solid #ddd;border-radius:4px;padding:16px;margin-bottom:20px">
    <h3 style="color:#0D2137;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #ddd;padding-bottom:6px">Donation Information</h3>
    <p style="color:#333;font-size:14px;line-height:1.8;margin:0 0 14px">
      Thank you for your donation with a value of
      <strong style="color:#E8720C">{{amount_words}} ($ {{amount}})</strong>,
      made to the above mentioned 501(c)(3) Non-Profit organization.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:5px 0;color:#555;width:40%">Donation Description:</td><td style="padding:5px 0;color:#0D2137;border-bottom:1px solid #ccc">{{description}}</td></tr>
      <tr><td style="padding:5px 0;color:#555">Payment Method:</td><td style="padding:5px 0;color:#0D2137">{{payment_method}}</td></tr>
    </table>
  </div>

  <p style="color:#555;font-size:12px;line-height:1.8;margin-bottom:28px">
    I, the undersigned representative, declare (or certify, verify, or state) under penalty of perjury under the laws of United States of America that there were no goods or services provided as part of donation. Furthermore, as of the date of this receipt the above-mentioned organization is a current and valid 501(c)(3) non-profit organization in accordance with the standards and regulations of Internal Revenue Service (IRS).
  </p>

  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <tr>
      <td style="width:55%;padding-right:24px;vertical-align:bottom">
        <div style="border-bottom:2px solid #333;min-height:110px;padding:10px 0 6px"></div>
        <p style="color:#555;margin:4px 0 0">Representative's Signature</p>
      </td>
      <td style="width:45%;vertical-align:bottom">
        <div style="border-bottom:1px solid #333;height:36px;display:flex;align-items:flex-end;padding-bottom:4px;color:#333;font-size:13px">{{generated_date}}</div>
        <p style="color:#555;margin:4px 0 0">Date</p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 24px 0 0;vertical-align:bottom">
        <div style="border-bottom:1px solid #333;padding-top:6px;color:#0D2137;font-weight:600">{{representative_name}}</div>
        <p style="color:#555;margin:4px 0 0">Representative Name</p>
      </td>
      <td style="padding:20px 0 0 0;vertical-align:bottom">
        <div style="border-bottom:1px solid #333;padding-top:6px;color:#0D2137">President</div>
        <p style="color:#555;margin:4px 0 0">Title</p>
      </td>
    </tr>
  </table>

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;text-align:center;color:#999;font-size:11px">
    <p style="margin:0">MAA is a 501(c)(3) non-profit organization &middot; EIN: 99-1915636</p>
    <p style="margin:4px 0 0">San Ramon, California &middot; info@maithilusa.org</p>
  </div>
</div>`;

  const membershipBody = `<div style="font-family:Georgia,serif;max-width:650px;margin:0 auto;padding:40px;border:1px solid #e0c97f;border-radius:8px">
  <div style="text-align:center;border-bottom:3px solid #E8720C;padding-bottom:16px;margin-bottom:28px">
    {{logo_img}}
    <h1 style="color:#0D2137;font-size:22px;margin:0">Maithil Association of America</h1>
    <p style="color:#C9960C;margin:4px 0 0;font-style:italic">मैथिल एसोसिएशन ऑफ अमेरिका</p>
    <h2 style="color:#E8720C;font-size:15px;margin:10px 0 0;letter-spacing:2px;text-transform:uppercase">Membership Payment Receipt</h2>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px">
    <tr><td style="padding:5px 0;color:#555;width:48%">Date:</td><td style="padding:5px 0;color:#0D2137;border-bottom:1px solid #bbb">{{transaction_date}}</td></tr>
    <tr><td style="padding:5px 0;color:#555">Receipt No.:</td><td style="padding:5px 0;color:#0D2137;font-weight:bold">{{receipt_number}}</td></tr>
    <tr><td style="padding:5px 0;color:#555">Name of Non-Profit Organization:</td><td style="padding:5px 0;color:#0D2137">Maithil Association of America</td></tr>
    <tr><td style="padding:5px 0;color:#555">Mailing Address:</td><td style="padding:5px 0;color:#0D2137">info@maithilusa.org</td></tr>
    <tr><td style="padding:5px 0;color:#555">EIN:</td><td style="padding:5px 0;color:#0D2137;font-weight:bold">99-1915636</td></tr>
  </table>

  <div style="background:#fdf6e3;border:1px solid #e0c97f;border-radius:4px;padding:16px;margin-bottom:16px">
    <h3 style="color:#0D2137;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e0c97f;padding-bottom:6px">Member Information</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:5px 0;color:#555;width:40%">Member's Name:</td><td style="padding:5px 0;color:#0D2137;border-bottom:1px solid #ccc">{{recipient_name}}</td></tr>
      <tr><td style="padding:5px 0;color:#555">Member's Address:</td><td style="padding:5px 0;border-bottom:1px solid #ccc">&nbsp;</td></tr>
    </table>
  </div>

  <div style="background:#f9f9f9;border:1px solid #ddd;border-radius:4px;padding:16px;margin-bottom:20px">
    <h3 style="color:#0D2137;font-size:13px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #ddd;padding-bottom:6px">Membership Payment Information</h3>
    <p style="color:#333;font-size:14px;line-height:1.8;margin:0 0 14px">
      Thank you for your membership payment with a value of
      <strong style="color:#E8720C">{{amount_words}} ($ {{amount}})</strong>,
      made to the above mentioned 501(c)(3) Non-Profit organization.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:5px 0;color:#555;width:40%">Membership Type:</td><td style="padding:5px 0;color:#0D2137;border-bottom:1px solid #ccc">{{description}}</td></tr>
      <tr><td style="padding:5px 0;color:#555">Payment Method:</td><td style="padding:5px 0;color:#0D2137">{{payment_method}}</td></tr>
    </table>
  </div>

  <p style="color:#555;font-size:12px;line-height:1.8;margin-bottom:28px">
    I, the undersigned representative, declare (or certify, verify, or state) under penalty of perjury under the laws of United States of America that there were no goods or services provided as part of this membership payment. Furthermore, as of the date of this receipt the above-mentioned organization is a current and valid 501(c)(3) non-profit organization in accordance with the standards and regulations of Internal Revenue Service (IRS).
  </p>

  <table style="width:100%;border-collapse:collapse;font-size:13px">
    <tr>
      <td style="width:55%;padding-right:24px;vertical-align:bottom">
        <div style="border-bottom:2px solid #333;min-height:110px;padding:10px 0 6px"></div>
        <p style="color:#555;margin:4px 0 0">Representative's Signature</p>
      </td>
      <td style="width:45%;vertical-align:bottom">
        <div style="border-bottom:1px solid #333;height:36px;display:flex;align-items:flex-end;padding-bottom:4px;color:#333;font-size:13px">{{generated_date}}</div>
        <p style="color:#555;margin:4px 0 0">Date</p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 24px 0 0;vertical-align:bottom">
        <div style="border-bottom:1px solid #333;padding-top:6px;color:#0D2137;font-weight:600">{{representative_name}}</div>
        <p style="color:#555;margin:4px 0 0">Representative Name</p>
      </td>
      <td style="padding:20px 0 0 0;vertical-align:bottom">
        <div style="border-bottom:1px solid #333;padding-top:6px;color:#0D2137">President</div>
        <p style="color:#555;margin:4px 0 0">Title</p>
      </td>
    </tr>
  </table>

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;text-align:center;color:#999;font-size:11px">
    <p style="margin:0">MAA is a 501(c)(3) non-profit organization &middot; EIN: 99-1915636</p>
    <p style="margin:4px 0 0">San Ramon, California &middot; info@maithilusa.org</p>
  </div>
</div>`;

  await sql`UPDATE receipt_templates SET body_html = ${donationBody}   WHERE name = 'Default Donation Receipt'`;
  await sql`UPDATE receipt_templates SET body_html = ${membershipBody} WHERE name = 'Default Membership Receipt'`;
}
