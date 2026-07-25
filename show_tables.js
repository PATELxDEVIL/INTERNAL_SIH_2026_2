const { neon } = require('@neondatabase/serverless');

const dbUrl = "postgresql://neondb_owner:npg_bLeUIMoK0DC9@ep-solitary-sun-azzrnwza-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
  const sql = neon(dbUrl);
  
  // Query to list all tables in the public schema
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;
  
  console.log("=== TABLES IN DATABASE ===");
  for (const t of tables) {
    console.log(`\nTable: ${t.table_name}`);
    
    // Get column info
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = ${t.table_name} AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    console.table(columns);

    // Get row count
    const countRes = await sql`SELECT COUNT(*) FROM app_data`; // assuming app_data is the main one, or we can use dynamic sql if we want, but since neon serverless doesn't support parameterized table names easily we do this:
    if (t.table_name === 'app_data') {
      const count = await sql`SELECT COUNT(*) as count FROM app_data`;
      console.log(`Row count: ${count[0].count}`);
    }
  }
}

main().catch(console.error);
