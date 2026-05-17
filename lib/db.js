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

  // Patch existing receipt html_content to add base64 logo if missing
  const LOGO_IMG = `<img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCABaAFoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5/oorrPAPgHU/HutfZLT9zaRYa6u2XKxL/Vj2H9M0AYWj6JqfiDUEsNJspru6fpHEucD1J6Ae54r2jwt+z/A16sHijVmW68oTmysh0TOOZSMZz1AH417X4V8IaN4N0pbDSLURrwZZm5kmb1Zu/wBOg7V5nY+NIrn4si8CDyZJBbCYSHBhYlFyOn3lQ/iamUuWxtSpc6k77I7rSfhb4J0YJ9m8PWjuvSS5UzNn1+fP6V1EVnawReVFbQxx9NqIAPyqeiqMTB1TwV4Y1kH+0NB0+dj/ABmBQ3/fQ5/WvNPF/wAB/Cn2N7zTbu60l9wUIAbiMliABtPzdT2PA7V7TXEePbqCe5sNHmWR43V7mULCzjAG1ckdOWJ/4D7VlXrKjTlUl0LpxU5qL2PmPxj8OfEfgmXOp2m+zY4S8gO+JvTn+E+xArk6+3vDd7Z+JfCiLMguYfntZ47iPO4oxQ7lPrgH8a8G+LXwcPh1Ztf8Oxu+lZ3XFryzW3+0O5T9R9OmkWpJNEtWdjxqiiimIv6Jo954g1qz0mwj33V1II0HYepPsBkn2FfafhDwpYeDfDlvpFguVjG6WUjDTSH7zn6/oMDtXjf7OXhZWOo+KLiPJU/ZLUkdDgGRh+ajP+9X0DQBzXj7WjoPgvULuN1S4dPIgLHHzv8AKD+GSfwrwG10WdJIZReRxqEjjVFjzjbluufXnPbFd/8AGfVjPf6do0TttiPnSgdN75CA/gG/76FebQy3MF0scjOlijEKPLYkZBVct6EkgdemKWJw83RhOEkrtp3vou+n9bHqYDkgpOpFvS6t+R9N+H9TXWdAsdQVgxmiBYjpuHDfqDWlXn/wr1FX02+0rdk2koZOMfKwBP65J/3q9ArScOSTj2PLUub3rWuFePaxqy3vjnUZm1XULNYgIoobYMVmROrHg/xE4wOjZya9S1zVIdE0O+1Oc4jtYWkPvgcD8TgV4PY6i6JJeHMrXiRGWOc7NvyllJYdTjt06V5eaS/cclvi9PLumdOGpuctP6/r1O1+GGrCLXtX0R5J2WQm5iMyuCWBw33gOqtGePevUHRJI2jkVWRgQysMgg9jXi+iXRg1y11OaGGK6jG+PyEwTEMhkJPXKlyMY5VfWvaQQQCDkHoRWmAqOdFKW6IxDi6rUemj9bHyP8YPAA8FeJhPYxkaRfkyW+OkTfxR/hnI9j7GvOa+0Pib4WXxb4E1CwWMNdRJ9otTjkSoCQB9Rlf+BV8X12mJ9n/C3SRo3w00K22bXe3E8gPXdId/P/fWPwrr2ZUUsxCqoySTwBUdtClvaQwxY8uNFRcegGBXJfFHWjo3gW9EbFbi9xaRFeo353EfRAx/CqjFykox3Y4q7seE69rk3iTWL7Vcusb3pMOTgPGcKo+oVAePWtiXwd5Pw+g8VfZ4/wDSJWjdWEkixWzfLG6jrkONwOOkntXI2sQkt/syYLo5cBc4bIx9B27jvXT6h4h1bVbeSxv5y9nGiRRW8EqpBABwvAOWOeMHPQYPNdGPgoKMo76K10mvPV/j02PZ5J1FGkvhWvNZvbS2npt13NPwB4ij8P639tu2zb3EYWTYN0h+UdAOvzY/WvVG+Jfh5YhKGu3jI+8luSB7H0P1rwxrqw063MV5NHHCqL+7lJWTgYwAPmB6cj8eK6Wx8G6nq+mrqWm6XdSQ3MQaJpfKVSh5G0MynnqDj865ZqMJcifz3T+56HnVnOp+8cbeXwta+a1/M6rx34q0zxJ4Z/s6zvJ4VkljknKQlnCA7gBzhTkDljx6GqHg/wAP2Wt3kdvLbvJZ28QxI05feFBRT8oC5yfTt7VzF1AbW4vEmgdLi0hVrlLqUq0altoVAn3m2kEnd3Aos9Za28dveaWrpY6fb7AweSNptwyQyk84weoxwK8+tWpe0XOm+W72slt57u6auRSo4mUlyNRvb1fle3f0NS6truwvxBiR57efcYllDYw2C2G5AOOcHGD3r13wveG70ONXDCS3Zrdgw5wpwp/Fdp/GvKbzVovFN3FOpHnl1M1lJxnAxuBHDdumCMds12ngq5WHVbmISO0d7lxubIDoccegKkcf7NY4WpTjiOWl8Mr/ANa/MmusTTqypYxPmW11q1r1W68/kd3Xyl4h+FN+fEuqm0G22N5MYlx0Secfpivq2qb2Ns8jMyrkkk8V6xmUPB2qDWvBmjajnLXFnGzf720Bv1Bryb4ya19r8VWOlKWMNkmX2/8APWQZwfogH/fdaXwE8UwT/D67sLqYK2jO7tk9IWy4P4Hf+QryzW9Wl1K9uNXnJ864u/PIQglAzcKfYKQtJTcZxS6u3/BPXyfDqdWVaW0Ff/gfdf7htksk+pLZQpJO08xgjtYkIyT90n+HGR9eTzXvvgb4bWHhe0invhHe6qMsZSvyQ5JO2NewHr1+lZHwj8MrHayeJrkEzXIMVqD0WMHBbHqSDg+g969Ro1aTf4/8N3uLMsU3VlSpv3U3quv47aI8b+L2h28OrW+rx2UDzXMRR5ZI92GTGCMnGcH0OQKt+CPH0OmeG7yz1RoY3sYTNZqrj97FgED5chcFhwOi9QMGus+JGnLfeDrqXkSWuJlZVyQOjfoTXgfmiWxuLeSMPEsaXEMRUEqdpXzFCkLnA/1h5zwykVxXdKtLs/10B8tbCQvunJfck1/kdbnUPFF7G1+jvMpEdmyEAicyDLvtz6gjHB217VfaFYalpf2C7hWSPy9gfADLxjIPY15V8OrA6r43/tFpEmhsopXJebdIJXYKC6D5UbCtyMg17PRg6MfZttaO+nZX/V6vzZy4mTpVbQeq6+Z4/qPhlvDutC5uikNlbRMIJkPzTcfxAdNv6k+9T6dcTwTwX0UElra27LOPNAEkwAIIUdQu0nrXpGt6VHrGly2rYEmN0Tkfdfsfp2PsTXB5Zb03LxzXk+4n7OgwEIODnPGQcjrXh5rz4KcZ09n19On/AA/mK6ruMpfZVkune/q23+lj0xWV1DKQVIyCO4ryHWPixZadrmoWTTKGtrmSE8/3WI/pXbwa+mi+B7vUdQAT+zIXLrnqFGUA9yCo+tfF13dS3t5PdztumnkaSRvVmOSfzNfT0qkasFOOz1OWS5XY0NC1y90Z7yK1ufs8WoW5tLltu792xGTj1GP5+tewRfC3xILW3vIvHeliC5j82GXaQJF4OQce4rwmvUvhj4/srL7P4c8Uu50kSF7O53c2ch7/AO7nnP8ACST0JrRSa0TLhWqU9ISav2Z9C+G7ltG0DTtP1C504i3h+ziaCZsOYhtY4K8H5TkZ9a2F13S3iaVb6FkVSxIboAMn9Kqaf4fsrVYprO6uDHvMynzQysWQKW6c5HP1OaztU02w02a3yJnkktzb+YZgrFAAm0fL8zYbOPYmkZnReZbalbXEEcodSDHJt6rlc/yIP415NF4V8SQsqjWvDTsJGhBaFs71wCDgcEcfmPau80i9U6Zda85mRShbynn3o2FAyMKOTtA6H9a5uLVNNik8yOyuwzSCd993gGb5Ay5xneCxBHHC+hxWdSjCp8aubUq9SldQe/kn+aNzwekei6Qy6lqOnS3UrF99qNqbB0HPP94/yroBrWmlGf7bDtVVZmLcAM20E/jx9a4+2fTn82BY2Xyp4RuN7hWZmIV1O3qpORgY9akubvT7ya2s75pnivikMm263bAMlfMAUYbe+CM8HHpVQhGEeWKsjOc3N80jrRrOmmVoheRGRZREyg8hySAP0NeYeI/D3iXVPFN3P4e8b2Or2V46tFZkbiW2qrHoep549R616T/YcXllDc3LZlSUlnBJKqFAPHIIAyK81+JnizQ/AUUS2jvd+IwubWN5NwtxjAd8dgOAp6459aJwjNWmrrzEm1seV/EjVfEuhC68Jar4lh1dpzFNdGJCPK25Kxk4HXIYj2WvMqmurqe+u5ru6lea4mcySSOcszE5JNQ04xjFcsVZA227sKKKKYj0X4f/ABf1vwTospgdQ0gH/j2kbDRD/pm3b6Hj6da+ivC/xL8KeL40Wx1KOO6PW0uiI5QfYHhv+Ak18YUUAffyoqghVABOTgUnlpgjYvPXivln4S+INafU/sravftbqQFiNy5QfhnFfUFozNaqWYk46k0ATeWhzlF5GDxWdrOsaNodobnWL60tIRzuncDP0B5J+lee/FbVtS0/S5WstQu7ZgOsEzIf0NfLl1eXV9O095czXEzdZJnLsfxPNAHvPjj9oNTHLYeD4WyQVOoTpjHvGh/m35V4LdXdxfXct1dzyT3ErF5JZGLMxPck1DRQAUUUUAf/2Q==" alt="MAA Logo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;border:3px solid #E8720C;" />`;
  try {
    await sql`UPDATE receipts SET html_content = REPLACE(html_content, '<h1 style="color:#0D2137;font-size:24px;margin:0">Maithil Association of America</h1>', ${LOGO_IMG + '<h1 style="color:#0D2137;font-size:24px;margin:0">Maithil Association of America</h1>'}) WHERE html_content NOT LIKE '%data:image/jpeg;base64%' AND html_content LIKE '%Maithil Association of America%'`;
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
  const donationBody = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;border:1px solid #e0c97f;border-radius:8px">
  <div style="text-align:center;border-bottom:3px solid #E8720C;padding-bottom:16px;margin-bottom:24px">
    <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCABaAFoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5/oorrPAPgHU/HutfZLT9zaRYa6u2XKxL/Vj2H9M0AYWj6JqfiDUEsNJspru6fpHEucD1J6Ae54r2jwt+z/A16sHijVmW68oTmysh0TOOZSMZz1AH417X4V8IaN4N0pbDSLURrwZZm5kmb1Zu/wBOg7V5nY+NIrn4si8CDyZJBbCYSHBhYlFyOn3lQ/iamUuWxtSpc6k77I7rSfhb4J0YJ9m8PWjuvSS5UzNn1+fP6V1EVnawReVFbQxx9NqIAPyqeiqMTB1TwV4Y1kH+0NB0+dj/ABmBQ3/fQ5/WvNPF/wAB/Cn2N7zTbu60l9wUIAbiMliABtPzdT2PA7V7TXEePbqCe5sNHmWR43V7mULCzjAG1ckdOWJ/4D7VlXrKjTlUl0LpxU5qL2PmPxj8OfEfgmXOp2m+zY4S8gO+JvTn+E+xArk6+3vDd7Z+JfCiLMguYfntZ47iPO4oxQ7lPrgH8a8G+LXwcPh1Ztf8Oxu+lZ3XFryzW3+0O5T9R9OmkWpJNEtWdjxqiiimIv6Jo954g1qz0mwj33V1II0HYepPsBkn2FfafhDwpYeDfDlvpFguVjG6WUjDTSH7zn6/oMDtXjf7OXhZWOo+KLiPJU/ZLUkdDgGRh+ajP+9X0DQBzXj7WjoPgvULuN1S4dPIgLHHzv8AKD+GSfwrwG10WdJIZReRxqEjjVFjzjbluufXnPbFd/8AGfVjPf6do0TttiPnSgdN75CA/gG/76FebQy3MF0scjOlijEKPLYkZBVct6EkgdemKWJw83RhOEkrtp3vou+n9bHqYDkgpOpFvS6t+R9N+H9TXWdAsdQVgxmiBYjpuHDfqDWlXn/wr1FX02+0rdk2koZOMfKwBP65J/3q9ArScOSTj2PLUub3rWuFePaxqy3vjnUZm1XULNYgIoobYMVmROrHg/xE4wOjZya9S1zVIdE0O+1Oc4jtYWkPvgcD8TgV4PY6i6JJeHMrXiRGWOc7NvyllJYdTjt06V5eaS/cclvi9PLumdOGpuctP6/r1O1+GGrCLXtX0R5J2WQm5iMyuCWBw33gOqtGePevUHRJI2jkVWRgQysMgg9jXi+iXRg1y11OaGGK6jG+PyEwTEMhkJPXKlyMY5VfWvaQQQCDkHoRWmAqOdFKW6IxDi6rUemj9bHyP8YPAA8FeJhPYxkaRfkyW+OkTfxR/hnI9j7GvOa+0Pib4WXxb4E1CwWMNdRJ9otTjkSoCQB9Rlf+BV8X12mJ9n/C3SRo3w00K22bXe3E8gPXdId/P/fWPwrr2ZUUsxCqoySTwBUdtClvaQwxY8uNFRcegGBXJfFHWjo3gW9EbFbi9xaRFeo353EfRAx/CqjFykox3Y4q7seE69rk3iTWL7Vcusb3pMOTgPGcKo+oVAePWtiXwd5Pw+g8VfZ4/wDSJWjdWEkixWzfLG6jrkONwOOkntXI2sQkt/syYLo5cBc4bIx9B27jvXT6h4h1bVbeSxv5y9nGiRRW8EqpBABwvAOWOeMHPQYPNdGPgoKMo76K10mvPV/j02PZ5J1FGkvhWvNZvbS2npt13NPwB4ij8P639tu2zb3EYWTYN0h+UdAOvzY/WvVG+Jfh5YhKGu3jI+8luSB7H0P1rwxrqw063MV5NHHCqL+7lJWTgYwAPmB6cj8eK6Wx8G6nq+mrqWm6XdSQ3MQaJpfKVSh5G0MynnqDj865ZqMJcifz3T+56HnVnOp+8cbeXwta+a1/M6rx34q0zxJ4Z/s6zvJ4VkljknKQlnCA7gBzhTkDljx6GqHg/wAP2Wt3kdvLbvJZ28QxI05feFBRT8oC5yfTt7VzF1AbW4vEmgdLi0hVrlLqUq0altoVAn3m2kEnd3Aos9Za28dveaWrpY6fb7AweSNptwyQyk84weoxwK8+tWpe0XOm+W72slt57u6auRSo4mUlyNRvb1fle3f0NS6truwvxBiR57efcYllDYw2C2G5AOOcHGD3r13wveG70ONXDCS3Zrdgw5wpwp/Fdp/GvKbzVovFN3FOpHnl1M1lJxnAxuBHDdumCMds12ngq5WHVbmISO0d7lxubIDoccegKkcf7NY4WpTjiOWl8Mr/ANa/MmusTTqypYxPmW11q1r1W68/kd3Xyl4h+FN+fEuqm0G22N5MYlx0Secfpivq2qb2Ns8jMyrkkk8V6xmUPB2qDWvBmjajnLXFnGzf720Bv1Bryb4ya19r8VWOlKWMNkmX2/8APWQZwfogH/fdaXwE8UwT/D67sLqYK2jO7tk9IWy4P4Hf+QryzW9Wl1K9uNXnJ864u/PIQglAzcKfYKQtJTcZxS6u3/BPXyfDqdWVaW0Ff/gfdf7htksk+pLZQpJO08xgjtYkIyT90n+HGR9eTzXvvgb4bWHhe0invhHe6qMsZSvyQ5JO2NewHr1+lZHwj8MrHayeJrkEzXIMVqD0WMHBbHqSDg+g969Ro1aTf4/8N3uLMsU3VlSpv3U3quv47aI8b+L2h28OrW+rx2UDzXMRR5ZI92GTGCMnGcH0OQKt+CPH0OmeG7yz1RoY3sYTNZqrj97FgED5chcFhwOi9QMGus+JGnLfeDrqXkSWuJlZVyQOjfoTXgfmiWxuLeSMPEsaXEMRUEqdpXzFCkLnA/1h5zwykVxXdKtLs/10B8tbCQvunJfck1/kdbnUPFF7G1+jvMpEdmyEAicyDLvtz6gjHB217VfaFYalpf2C7hWSPy9gfADLxjIPY15V8OrA6r43/tFpEmhsopXJebdIJXYKC6D5UbCtyMg17PRg6MfZttaO+nZX/V6vzZy4mTpVbQeq6+Z4/qPhlvDutC5uikNlbRMIJkPzTcfxAdNv6k+9T6dcTwTwX0UElra27LOPNAEkwAIIUdQu0nrXpGt6VHrGly2rYEmN0Tkfdfsfp2PsTXB5Zb03LxzXk+4n7OgwEIODnPGQcjrXh5rz4KcZ09n19On/AA/mK6ruMpfZVkune/q23+lj0xWV1DKQVIyCO4ryHWPixZadrmoWTTKGtrmSE8/3WI/pXbwa+mi+B7vUdQAT+zIXLrnqFGUA9yCo+tfF13dS3t5PdztumnkaSRvVmOSfzNfT0qkasFOOz1OWS5XY0NC1y90Z7yK1ufs8WoW5tLltu792xGTj1GP5+tewRfC3xILW3vIvHeliC5j82GXaQJF4OQce4rwmvUvhj4/srL7P4c8Uu50kSF7O53c2ch7/AO7nnP8ACST0JrRSa0TLhWqU9ISav2Z9C+G7ltG0DTtP1C504i3h+ziaCZsOYhtY4K8H5TkZ9a2F13S3iaVb6FkVSxIboAMn9Kqaf4fsrVYprO6uDHvMynzQysWQKW6c5HP1OaztU02w02a3yJnkktzb+YZgrFAAm0fL8zYbOPYmkZnReZbalbXEEcodSDHJt6rlc/yIP415NF4V8SQsqjWvDTsJGhBaFs71wCDgcEcfmPau80i9U6Zda85mRShbynn3o2FAyMKOTtA6H9a5uLVNNik8yOyuwzSCd993gGb5Ay5xneCxBHHC+hxWdSjCp8aubUq9SldQe/kn+aNzwekei6Qy6lqOnS3UrF99qNqbB0HPP94/yroBrWmlGf7bDtVVZmLcAM20E/jx9a4+2fTn82BY2Xyp4RuN7hWZmIV1O3qpORgY9akubvT7ya2s75pnivikMm263bAMlfMAUYbe+CM8HHpVQhGEeWKsjOc3N80jrRrOmmVoheRGRZREyg8hySAP0NeYeI/D3iXVPFN3P4e8b2Or2V46tFZkbiW2qrHoep549R616T/YcXllDc3LZlSUlnBJKqFAPHIIAyK81+JnizQ/AUUS2jvd+IwubWN5NwtxjAd8dgOAp6459aJwjNWmrrzEm1seV/EjVfEuhC68Jar4lh1dpzFNdGJCPK25Kxk4HXIYj2WvMqmurqe+u5ru6lea4mcySSOcszE5JNQ04xjFcsVZA227sKKKKYj0X4f/ABf1vwTospgdQ0gH/j2kbDRD/pm3b6Hj6da+ivC/xL8KeL40Wx1KOO6PW0uiI5QfYHhv+Ak18YUUAffyoqghVABOTgUnlpgjYvPXivln4S+INafU/sravftbqQFiNy5QfhnFfUFozNaqWYk46k0ATeWhzlF5GDxWdrOsaNodobnWL60tIRzuncDP0B5J+lee/FbVtS0/S5WstQu7ZgOsEzIf0NfLl1eXV9O095czXEzdZJnLsfxPNAHvPjj9oNTHLYeD4WyQVOoTpjHvGh/m35V4LdXdxfXct1dzyT3ErF5JZGLMxPck1DRQAUUUUAf/2Q==" alt="MAA Logo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;border:3px solid #E8720C;" />
    <h1 style="color:#0D2137;font-size:24px;margin:0">Maithil Association of America</h1>
    <p style="color:#C9960C;margin:4px 0 0;font-style:italic">मैथिल एसोसिएशन ऑफ अमेरिका</p>
    <p style="color:#666;font-size:13px;margin:8px 0 0">Official Donation Receipt</p>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr><td style="padding:8px 0;color:#555;width:40%">Receipt No.</td><td style="padding:8px 0;font-weight:bold;color:#0D2137">{{receipt_number}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Date</td><td style="padding:8px 0;color:#0D2137">{{transaction_date}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Donor Name</td><td style="padding:8px 0;color:#0D2137">{{recipient_name}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Description</td><td style="padding:8px 0;color:#0D2137">{{description}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Payment Method</td><td style="padding:8px 0;color:#0D2137">{{payment_method}}</td></tr>
    <tr style="background:#fdf6e3"><td style="padding:12px 8px;color:#555;font-weight:bold">Amount</td><td style="padding:12px 8px;font-size:20px;font-weight:bold;color:#E8720C">${{amount}}</td></tr>
  </table>
  <p style="color:#555;font-size:13px;line-height:1.6">Thank you for your generous contribution to the Maithil Association of America. Your donation supports our mission to preserve and promote Maithili culture and heritage across America.</p>
  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;text-align:center;color:#999;font-size:11px">
    <p>MAA is a non-profit organization</p>
    <p>contributemaa@maithilusa.org</p>
  </div>
</div>`;

  const membershipBody = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;border:1px solid #e0c97f;border-radius:8px">
  <div style="text-align:center;border-bottom:3px solid #E8720C;padding-bottom:16px;margin-bottom:24px">
    <img src="data:image/jpeg;base64,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" alt="MAA Logo" style="width:80px;height:80px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 12px;border:3px solid #E8720C;" />
    <h1 style="color:#0D2137;font-size:24px;margin:0">Maithil Association of America</h1>
    <p style="color:#C9960C;margin:4px 0 0;font-style:italic">मैथिल एसोसिएशन ऑफ अमेरिका</p>
    <p style="color:#666;font-size:13px;margin:8px 0 0">Membership Payment Receipt</p>
  </div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr><td style="padding:8px 0;color:#555;width:40%">Receipt No.</td><td style="padding:8px 0;font-weight:bold;color:#0D2137">{{receipt_number}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Date</td><td style="padding:8px 0;color:#0D2137">{{transaction_date}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Member Name</td><td style="padding:8px 0;color:#0D2137">{{recipient_name}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Membership</td><td style="padding:8px 0;color:#0D2137">{{description}}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Payment Method</td><td style="padding:8px 0;color:#0D2137">{{payment_method}}</td></tr>
    <tr style="background:#fdf6e3"><td style="padding:12px 8px;color:#555;font-weight:bold">Amount Paid</td><td style="padding:12px 8px;font-size:20px;font-weight:bold;color:#E8720C">${{amount}}</td></tr>
  </table>
  <p style="color:#555;font-size:13px;line-height:1.6">Welcome to the Maithil Association of America! Your membership helps us celebrate and preserve our rich Maithili heritage. We look forward to your participation in our events and activities.</p>
  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;text-align:center;color:#999;font-size:11px">
    <p>MAA is a non-profit organization</p>
    <p>contributemaa@maithilusa.org</p>
  </div>
</div>`;

  if (parseInt(tplCount.c) === 0) {
    try {
      await sql`INSERT INTO receipt_templates (name,subject,body_html,is_default,is_active)
        VALUES ('Default Donation Receipt','Donation Receipt from Maithil Association of America - {{receipt_number}}',${donationBody},true,true)`;
      await sql`INSERT INTO receipt_templates (name,subject,body_html,is_default,is_active)
        VALUES ('Default Membership Receipt','Membership Payment Receipt - Maithil Association of America',${membershipBody},false,true)`;
    } catch {}
  } else {
    // Patch existing templates: replace URL-based logo with embedded base64 version
    try {
      await sql`UPDATE receipt_templates SET body_html = ${donationBody} WHERE name = 'Default Donation Receipt' AND body_html NOT LIKE '%data:image/jpeg;base64%'`;
      await sql`UPDATE receipt_templates SET body_html = ${membershipBody} WHERE name = 'Default Membership Receipt' AND body_html NOT LIKE '%data:image/jpeg;base64%'`;
    } catch {}
  }

  // Set committee member photos by name (always overwrite)
  try { await sql`UPDATE committee_members SET photo_url='/images/gallery/SunilJha.jpg'    WHERE LOWER(name) LIKE '%sunil%jha%'`; } catch {}
  try { await sql`UPDATE committee_members SET photo_url='/images/gallery/Aditi.png'        WHERE LOWER(name) LIKE '%aditi%'`; } catch {}
  try { await sql`UPDATE committee_members SET photo_url='/images/gallery/DeepakMishra.png' WHERE LOWER(name) LIKE '%deepak%mishra%'`; } catch {}

  await sql`CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql`;
  for (const t of ['members','events','news_posts','budget_items','finance_transactions','receipt_templates']) {
    try { await sql.unsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_${t}_upd') THEN CREATE TRIGGER trg_${t}_upd BEFORE UPDATE ON ${t} FOR EACH ROW EXECUTE FUNCTION update_updated_at(); END IF; END $$;`); } catch {}
  }
}
