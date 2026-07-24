import { neon } from '@neondatabase/serverless';

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not defined");
  }
  return neon(process.env.DATABASE_URL);
}

export async function readDB() {
  const sql = getSql();
  const result = await sql`SELECT data FROM app_data WHERE id = 1`;
  if (result.length > 0) {
    return result[0].data;
  }
  
  // Fallback if empty (should be seeded via init-neon.js)
  const initialData = { 
    config: { logos: {}, heroMedia: [], deadline: "2026-08-02T23:59:00" }, 
    teams: [], 
    problemStatements: [],
    admin: { username: "admin", password: "password" } 
  };
  await writeDB(initialData);
  return initialData;
}

export async function writeDB(data) {
  const sql = getSql();
  await sql`
    INSERT INTO app_data (id, data) 
    VALUES (1, ${JSON.stringify(data)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `;
}
