require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs/promises');
const path = require('path');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  
  console.log("Creating app_data table...");
  await sql`
    CREATE TABLE IF NOT EXISTS app_data (
      id integer PRIMARY KEY,
      data jsonb NOT NULL
    )
  `;
  
  const dbPath = path.join(process.cwd(), 'data', 'database.json');
  try {
    const fileData = await fs.readFile(dbPath, 'utf-8');
    const parsedData = JSON.parse(fileData);
    
    console.log("Seeding existing data from database.json to Neon...");
    await sql`
      INSERT INTO app_data (id, data) 
      VALUES (1, ${JSON.stringify(parsedData)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    `;
    console.log("Data migrated successfully!");
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log("No existing database.json found. Initializing with empty state...");
      const initialData = { 
        config: { logos: {}, heroMedia: [], deadline: "2026-08-02T23:59:00" }, 
        teams: [], 
        problemStatements: [],
        admin: { username: "admin", password: "password" } 
      };
      await sql`
        INSERT INTO app_data (id, data) 
        VALUES (1, ${JSON.stringify(initialData)}::jsonb)
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
      `;
      console.log("Initialized empty database successfully!");
    } else {
      console.error("Error reading database.json:", err);
      process.exit(1);
    }
  }
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
