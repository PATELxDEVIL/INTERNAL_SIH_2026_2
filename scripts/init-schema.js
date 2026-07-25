// scripts/init-schema.js
// Run once: node scripts/init-schema.js
// Creates all relational tables in Neon DB

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function initSchema() {
  const sql = neon(process.env.DATABASE_URL);

  console.log('Creating relational schema...\n');

  // 1. Admins table
  await sql`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✅ admins table created');

  // 2. Config table (key-value store for settings)
  await sql`
    CREATE TABLE IF NOT EXISTS config (
      key VARCHAR(255) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✅ config table created');

  // 3. Teams table
  await sql`
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      team_id VARCHAR(50) UNIQUE NOT NULL,
      team_name VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      status VARCHAR(100) DEFAULT 'Pending Mentor Details',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✅ teams table created');

  // 4. Team members table (includes leader with is_leader=true)
  await sql`
    CREATE TABLE IF NOT EXISTS team_members (
      id SERIAL PRIMARY KEY,
      team_id VARCHAR(50) NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
      is_leader BOOLEAN DEFAULT FALSE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      gender VARCHAR(10) NOT NULL,
      enrollment VARCHAR(100) UNIQUE NOT NULL,
      semester VARCHAR(10),
      department VARCHAR(255)
    )
  `;
  console.log('✅ team_members table created');

  // 5. Mentors table
  await sql`
    CREATE TABLE IF NOT EXISTS mentors (
      id SERIAL PRIMARY KEY,
      team_id VARCHAR(50) UNIQUE NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      contact VARCHAR(20),
      address TEXT,
      institute VARCHAR(255),
      department VARCHAR(255),
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✅ mentors table created');

  // 6. Problem statements table
  await sql`
    CREATE TABLE IF NOT EXISTS problem_statements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(500) NOT NULL,
      description TEXT,
      pdf_url TEXT,
      is_live BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✅ problem_statements table created');

  // 7. Hero media table
  await sql`
    CREATE TABLE IF NOT EXISTS hero_media (
      id SERIAL PRIMARY KEY,
      url TEXT NOT NULL,
      display_order INTEGER DEFAULT 0
    )
  `;
  console.log('✅ hero_media table created');

  // 8. OTPs table (for password reset)
  await sql`
    CREATE TABLE IF NOT EXISTS otps (
      id SERIAL PRIMARY KEY,
      identifier VARCHAR(255) NOT NULL,
      otp VARCHAR(10) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✅ otps table created');

  console.log('\n🎉 All tables created successfully!');
  
  // Show all created tables
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  console.log('\nTables in database:');
  tables.forEach(t => console.log(` - ${t.table_name}`));
}

initSchema().catch(err => {
  console.error('❌ Error creating schema:', err);
  process.exit(1);
});
