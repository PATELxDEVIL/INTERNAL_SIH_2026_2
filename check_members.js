require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function checkTeamMembers() {
  const sql = neon(process.env.DATABASE_URL);
  const [count] = await sql`SELECT COUNT(*) FROM team_members`;
  console.log('Total Team Members in DB:', count.count);
  
  const members = await sql`SELECT * FROM team_members LIMIT 5`;
  console.log('Sample Members:', members);
}
checkTeamMembers().catch(console.error);
