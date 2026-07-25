require('dotenv').config({path: '.env.local'});
const { neon } = require('@neondatabase/serverless');

async function migrate() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    await sql`ALTER TABLE teams ADD COLUMN problem_id UUID REFERENCES problem_statements(id) ON DELETE SET NULL`;
    console.log("Successfully added problem_id to teams table.");
  } catch (err) {
    console.error("Migration failed (it might already exist):", err.message);
  }
}

migrate().catch(console.error);
