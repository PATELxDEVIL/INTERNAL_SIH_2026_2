require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
  const sql = neon(process.env.DATABASE_URL);
  // Hash the actual password "Devang" which was being used
  const hashed = await bcrypt.hash('Devang', 10);
  await sql`UPDATE admins SET password = ${hashed}`;
  console.log('✅ Admin password set to: Devang (bcrypt hashed)');
  console.log('Login with: username=admin, password=Devang');
}

fixAdmin().catch(console.error);
