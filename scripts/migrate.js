// scripts/migrate.js
// Run once: node scripts/migrate.js
// Migrates existing JSON blob data from app_data into new relational tables

require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function migrate() {
  const sql = neon(process.env.DATABASE_URL);

  console.log('Reading existing app_data JSON blob...\n');
  const result = await sql`SELECT data FROM app_data WHERE id = 1`;
  if (result.length === 0) {
    console.log('No existing data found in app_data. Nothing to migrate.');
    return;
  }

  const db = result[0].data;
  console.log(`Found: ${db.teams?.length || 0} teams, ${db.problemStatements?.length || 0} problem statements\n`);

  // --- 1. Migrate Admin ---
  if (db.admin) {
    await sql`
      INSERT INTO admins (username, password)
      VALUES (${db.admin.username}, ${db.admin.password})
      ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password
    `;
    console.log(`✅ Admin migrated: ${db.admin.username}`);
  }

  // --- 2. Migrate Config ---
  const c = db.config || {};
  const configItems = [
    { key: 'deadline', value: JSON.stringify(c.deadline || '2026-08-02T23:59:00') },
    { key: 'registrationHeading', value: JSON.stringify(c.registrationHeading || 'Registration Closes In') },
    { key: 'registrationButtonText', value: JSON.stringify(c.registrationButtonText || 'Register Your Team') },
    { key: 'registrationButtonLink', value: JSON.stringify(c.registrationButtonLink || '/register') },
    { key: 'registrationFooterText', value: JSON.stringify(c.registrationFooterText || 'Registration closes on') },
    { key: 'logos', value: JSON.stringify(c.logos || {}) },
  ];

  for (const item of configItems) {
    await sql`
      INSERT INTO config (key, value)
      VALUES (${item.key}, ${item.value}::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
  }
  console.log(`✅ Config migrated (${configItems.length} settings)`);

  // --- 3. Migrate Hero Media ---
  if (c.heroMedia && c.heroMedia.length > 0) {
    for (let i = 0; i < c.heroMedia.length; i++) {
      await sql`
        INSERT INTO hero_media (url, display_order)
        VALUES (${c.heroMedia[i]}, ${i})
        ON CONFLICT DO NOTHING
      `;
    }
    console.log(`✅ Hero media migrated: ${c.heroMedia.length} images`);
  }

  // --- 4. Migrate Teams ---
  let teamsOk = 0;
  let teamsSkipped = 0;
  for (const team of (db.teams || [])) {
    try {
      // Insert team
      await sql`
        INSERT INTO teams (team_id, team_name, password, status, created_at)
        VALUES (
          ${team.teamId},
          ${team.teamName},
          ${team.password},
          ${team.status || 'Pending Mentor Details'},
          ${team.createdAt || new Date().toISOString()}
        )
        ON CONFLICT (team_id) DO NOTHING
      `;

      // Insert leader
      const l = team.leader;
      if (l) {
        try {
          await sql`
            INSERT INTO team_members (team_id, is_leader, name, email, phone, gender, enrollment, semester, department)
            VALUES (
              ${team.teamId}, true,
              ${l.name || ''}, ${l.email || ''}, ${l.phone || ''},
              ${l.gender || 'Male'}, ${l.enrollment || ''},
              ${l.semester || l.year || ''}, ${l.department || l.branch || ''}
            )
            ON CONFLICT (enrollment) DO NOTHING
          `;
        } catch (e) {
          console.warn(`  ⚠ Leader enrollment conflict: ${l.enrollment}`);
        }
      }

      // Insert members
      for (const m of (team.members || [])) {
        try {
          await sql`
            INSERT INTO team_members (team_id, is_leader, name, email, phone, gender, enrollment, semester, department)
            VALUES (
              ${team.teamId}, false,
              ${m.name || ''}, ${m.email || ''}, ${m.phone || ''},
              ${m.gender || 'Male'}, ${m.enrollment || ''},
              ${m.semester || m.year || ''}, ${m.department || m.branch || ''}
            )
            ON CONFLICT (enrollment) DO NOTHING
          `;
        } catch (e) {
          console.warn(`  ⚠ Member enrollment conflict: ${m.enrollment}`);
        }
      }

      // Insert mentor if exists
      if (team.mentor) {
        const mentor = team.mentor;
        await sql`
          INSERT INTO mentors (team_id, name, email, contact, address, institute, department)
          VALUES (
            ${team.teamId},
            ${mentor.name || ''}, ${mentor.email || ''},
            ${mentor.contact || ''}, ${mentor.address || ''},
            ${mentor.institute || ''}, ${mentor.department || ''}
          )
          ON CONFLICT (team_id) DO NOTHING
        `;
        // Update team status
        await sql`UPDATE teams SET status = 'Registration Completed' WHERE team_id = ${team.teamId}`;
      }

      teamsOk++;
      console.log(`  ✅ Team migrated: ${team.teamId} - ${team.teamName}`);
    } catch (e) {
      teamsSkipped++;
      console.error(`  ❌ Failed to migrate ${team.teamId}:`, e.message);
    }
  }
  console.log(`\n✅ Teams: ${teamsOk} migrated, ${teamsSkipped} skipped`);

  // --- 5. Migrate Problem Statements ---
  for (const p of (db.problemStatements || [])) {
    // Old IDs like "PS-xxxx" are not valid UUIDs, so generate new UUIDs
    await sql`
      INSERT INTO problem_statements (title, description, pdf_url, is_live)
      VALUES (${p.title}, ${p.description || ''}, ${p.pdfUrl || ''}, ${p.isLive || false})
    `;
  }
  console.log(`✅ Problem statements migrated: ${db.problemStatements?.length || 0}`);

  // Verify counts
  console.log('\n─── VERIFICATION ───');
  const [tCount] = await sql`SELECT COUNT(*) as c FROM teams`;
  const [mCount] = await sql`SELECT COUNT(*) as c FROM team_members`;
  const [menCount] = await sql`SELECT COUNT(*) as c FROM mentors`;
  const [adminCount] = await sql`SELECT COUNT(*) as c FROM admins`;
  const [psCount] = await sql`SELECT COUNT(*) as c FROM problem_statements`;
  console.log(`Teams: ${tCount.c}`);
  console.log(`Team Members: ${mCount.c}`);
  console.log(`Mentors: ${menCount.c}`);
  console.log(`Admins: ${adminCount.c}`);
  console.log(`Problem Statements: ${psCount.c}`);
  console.log('\n🎉 Migration complete!');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
