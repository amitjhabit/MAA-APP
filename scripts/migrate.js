// scripts/migrate.js — run: node scripts/migrate.js
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function run() {
  if (!process.env.DATABASE_URL) { console.error('❌  Set DATABASE_URL in .env.local'); process.exit(1); }
  const sql = neon(process.env.DATABASE_URL);
  console.log('🔄  MAA CRM — running migrations…\n');

  await sql`CREATE TABLE IF NOT EXISTS members (id SERIAL PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT, address TEXT, city TEXT, state TEXT, zip TEXT, country TEXT DEFAULT 'USA', date_of_birth DATE, gender TEXT CHECK (gender IN ('male','female','other','prefer_not_to_say')), photo_url TEXT, membership_type TEXT NOT NULL DEFAULT 'individual' CHECK (membership_type IN ('individual','student','honorary','corporate')), membership_plan TEXT NOT NULL DEFAULT 'annual' CHECK (membership_plan IN ('annual','lifetime')), membership_status TEXT NOT NULL DEFAULT 'active' CHECK (membership_status IN ('active','inactive','pending','expired')), is_active BOOLEAN NOT NULL DEFAULT TRUE, joined_date DATE NOT NULL DEFAULT CURRENT_DATE, expiry_date DATE, amount_paid NUMERIC(10,2) DEFAULT 0, payment_method TEXT, maithili_name TEXT, village_district TEXT, occupation TEXT, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  console.log('  ✅  members');

  await sql`CREATE TABLE IF NOT EXISTS events (id SERIAL PRIMARY KEY, title TEXT NOT NULL, title_maithili TEXT, description TEXT, event_date DATE NOT NULL, event_time TEXT, end_date DATE, location TEXT, address TEXT, city TEXT, state TEXT, is_online BOOLEAN DEFAULT FALSE, meeting_link TEXT, category TEXT DEFAULT 'cultural' CHECK (category IN ('cultural','religious','social','educational','fundraiser','other')), status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','ongoing','completed','cancelled')), max_attendees INTEGER, registration_fee NUMERIC(10,2) DEFAULT 0, cover_image TEXT, organizer TEXT, contact_email TEXT, is_public BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  console.log('  ✅  events');

  await sql`CREATE TABLE IF NOT EXISTS event_registrations (id SERIAL PRIMARY KEY, event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE, member_id INTEGER REFERENCES members(id) ON DELETE SET NULL, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, guests INTEGER DEFAULT 0, status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','waitlisted')), paid BOOLEAN DEFAULT FALSE, amount NUMERIC(10,2) DEFAULT 0, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  console.log('  ✅  event_registrations');

  await sql`CREATE TABLE IF NOT EXISTS donations (id SERIAL PRIMARY KEY, member_id INTEGER REFERENCES members(id) ON DELETE SET NULL, donor_name TEXT NOT NULL, donor_email TEXT, donor_phone TEXT, amount NUMERIC(10,2) NOT NULL, currency TEXT DEFAULT 'USD', payment_method TEXT CHECK (payment_method IN ('zelle','credit_card','check','cash','other')), campaign TEXT, purpose TEXT, status TEXT DEFAULT 'received' CHECK (status IN ('received','pending','failed','refunded')), transaction_id TEXT, receipt_sent BOOLEAN DEFAULT FALSE, notes TEXT, donated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  console.log('  ✅  donations');

  await sql`CREATE TABLE IF NOT EXISTS news_posts (id SERIAL PRIMARY KEY, title TEXT NOT NULL, title_maithili TEXT, slug TEXT UNIQUE, excerpt TEXT, content TEXT, content_maithili TEXT, category TEXT DEFAULT 'general' CHECK (category IN ('general','cultural','event','announcement','newsletter')), status TEXT DEFAULT 'draft' CHECK (status IN ('draft','published','archived')), featured_image TEXT, author TEXT, published_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  console.log('  ✅  news_posts');

  await sql`CREATE TABLE IF NOT EXISTS volunteers (id SERIAL PRIMARY KEY, member_id INTEGER REFERENCES members(id) ON DELETE SET NULL, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, role TEXT, skills TEXT, availability TEXT, hours_total NUMERIC(6,1) DEFAULT 0, status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')), joined_date DATE DEFAULT CURRENT_DATE, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  console.log('  ✅  volunteers');

  await sql`CREATE TABLE IF NOT EXISTS committee_members (id SERIAL PRIMARY KEY, member_id INTEGER REFERENCES members(id) ON DELETE SET NULL, name TEXT NOT NULL, email TEXT, phone TEXT, role TEXT NOT NULL, committee TEXT DEFAULT 'board' CHECK (committee IN ('board','executive','cultural','finance','events','youth','other')), term_start DATE, term_end DATE, is_current BOOLEAN DEFAULT TRUE, bio TEXT, photo_url TEXT, sort_order INTEGER DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  console.log('  ✅  committee_members');

  await sql`CREATE TABLE IF NOT EXISTS gallery (id SERIAL PRIMARY KEY, event_id INTEGER REFERENCES events(id) ON DELETE SET NULL, title TEXT, description TEXT, image_url TEXT NOT NULL, thumbnail_url TEXT, category TEXT DEFAULT 'general', is_featured BOOLEAN DEFAULT FALSE, sort_order INTEGER DEFAULT 0, uploaded_by TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  console.log('  ✅  gallery');

  await sql`CREATE TABLE IF NOT EXISTS inquiries (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, subject TEXT DEFAULT 'General Inquiry', message TEXT NOT NULL, inquiry_type TEXT DEFAULT 'general' CHECK (inquiry_type IN ('general','membership','event','donation','volunteer','other')), status TEXT DEFAULT 'new' CHECK (status IN ('new','read','replied','archived')), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  console.log('  ✅  inquiries');

  await sql`CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql`;
  for (const t of ['members','events','news_posts']) {
    try { await sql.unsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_${t}_upd') THEN CREATE TRIGGER trg_${t}_upd BEFORE UPDATE ON ${t} FOR EACH ROW EXECUTE FUNCTION update_updated_at(); END IF; END $$;`); } catch {}
  }
  console.log('  ✅  triggers\n');

  // Seed if empty
  const [{ count }] = await sql`SELECT COUNT(*) AS count FROM members`;
  if (parseInt(count) === 0) {
    await sql`INSERT INTO members (first_name,last_name,email,phone,city,state,membership_type,membership_plan,membership_status,is_active,joined_date,expiry_date,amount_paid,payment_method,maithili_name,village_district,occupation) VALUES
      ('Rajesh','Jha','rajesh.jha@example.com','555-0101','Edison','NJ','individual','annual','active',TRUE,'2024-01-15','2025-01-15',50,'zelle','राजेश झा','Darbhanga, Bihar','Software Engineer'),
      ('Sunita','Mishra','sunita.mishra@example.com','555-0102','Parsippany','NJ','individual','lifetime','active',TRUE,'2023-06-01',NULL,500,'check','सुनीता मिश्रा','Madhubani, Bihar','Doctor'),
      ('Vivek','Thakur','vivek.thakur@example.com','555-0103','New Brunswick','NJ','student','annual','active',TRUE,'2024-03-10','2025-03-10',25,'zelle','विवेक ठाकुर','Sitamarhi, Bihar','Student'),
      ('Anita','Choudhary','anita.choudhary@example.com','555-0104','Houston','TX','individual','annual','active',TRUE,'2024-02-20','2025-02-20',50,'credit_card','अनिता चौधरी','Saharsa, Bihar','Teacher'),
      ('Manoj','Kumar','manoj.kumar@example.com','555-0105','San Jose','CA','corporate','annual','active',TRUE,'2024-01-01','2025-01-01',500,'check','मनोज कुमार','Muzaffarpur, Bihar','Business Owner'),
      ('Priya','Jha','priya.jha@example.com','555-0106','Boston','MA','honorary','lifetime','active',TRUE,'2022-08-15',NULL,0,NULL,'प्रिया झा','Darbhanga, Bihar','Professor')`;

    await sql`INSERT INTO events (title,title_maithili,description,event_date,event_time,location,city,state,category,status,organizer) VALUES
      ('Maithili New Year Celebration 2025','मैथिली नव वर्ष उत्सव २०२५','Grand celebration with cultural programs, traditional food, and community gathering.','2025-04-14','6:00 PM','Edison Community Center','Edison','NJ','cultural','upcoming','MAA Events Committee'),
      ('Chhath Puja 2024','छठ पूजा २०२४','Sacred Chhath Puja celebration with sunrise and sunset rituals.','2024-11-07','5:00 AM','Hudson River Waterfront','New York','NY','religious','completed','MAA Religious Committee'),
      ('Maithili Language Workshop','मैथिली भाषा कार्यशाला','Learn to read and write Maithili script. Open to all ages.','2025-02-15','10:00 AM','Online (Zoom)','Online','NJ','educational','upcoming','MAA Cultural Committee')`;

    await sql`INSERT INTO news_posts (title,title_maithili,excerpt,content,category,status,author,published_at) VALUES
      ('MAA Annual Gala 2025 — Save the Date','MAA वार्षिक गाला २०२५','Mark your calendars! The MAA Annual Gala is coming up in April 2025.','The Maithil Association of America is thrilled to announce our Annual Gala 2025. Join us for a spectacular evening of culture, food, and community.','announcement','published','MAA Communications Team',NOW()),
      ('Maithili Language Gains International Recognition','मैथिली भाषाक अंतरराष्ट्रीय पहचान','A proud moment for the Maithili community worldwide.','Maithili, spoken by over 50 million people, has received renewed international attention. MAA celebrates this milestone and renews its commitment to preserving our language.','cultural','published','Dr. Sunita Mishra',NOW())`;

    await sql`INSERT INTO committee_members (name,email,role,committee,term_start,term_end,is_current,sort_order) VALUES
      ('Dr. Rajesh Kumar Jha','president@maa-america.org','President','executive','2024-01-01','2025-12-31',TRUE,1),
      ('Mrs. Sunita Mishra','vp@maa-america.org','Vice President','executive','2024-01-01','2025-12-31',TRUE,2),
      ('Mr. Vivek Thakur','treasurer@maa-america.org','Treasurer','executive','2024-01-01','2025-12-31',TRUE,3),
      ('Ms. Priya Choudhary','secretary@maa-america.org','General Secretary','executive','2024-01-01','2025-12-31',TRUE,4)`;

    console.log('  🌱  Seeded sample data');
  }

  console.log('\n✅  Done! Run: npm run dev');
  process.exit(0);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
