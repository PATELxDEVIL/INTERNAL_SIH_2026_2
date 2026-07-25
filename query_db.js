const { neon } = require('@neondatabase/serverless');

const dbUrl = "postgresql://neondb_owner:npg_bLeUIMoK0DC9@ep-solitary-sun-azzrnwza-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
  const sql = neon(dbUrl);
  const result = await sql`SELECT data FROM app_data WHERE id = 1`;
  if (result.length > 0) {
    const data = result[0].data;
    console.log("=== DB TEAMS ===");
    console.log(JSON.stringify(data.teams, null, 2));
  } else {
    console.log("No data found in app_data");
  }
}

main().catch(console.error);
