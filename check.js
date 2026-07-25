require('dotenv').config({path: '.env.local'});
const { neon } = require('@neondatabase/serverless');

async function check() {
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'team_members'`;
  console.table(rows);
}

check().catch(console.error);
