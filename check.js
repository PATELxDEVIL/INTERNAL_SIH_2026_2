require('dotenv').config({path: '.env.local'});
const { neon } = require('@neondatabase/serverless');

async function check() {
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'problem_statements'`;
  console.table(rows);
}

check().catch(console.error);
