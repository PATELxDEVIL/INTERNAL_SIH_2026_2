const { neon } = require('@neondatabase/serverless');

const dbUrl = "postgresql://neondb_owner:npg_bLeUIMoK0DC9@ep-solitary-sun-azzrnwza-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
  const sql = neon(dbUrl);
  const result = await sql`SELECT data FROM app_data WHERE id = 1`;
  const db = result[0].data;
  const teams = db.teams;

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║              NEON DB — app_data.teams TABLE                  ║");
  console.log(`╠══════════════════════════════════════════════════════════════╣`);
  console.log(`║  Total Teams Registered: ${String(teams.length).padEnd(37)}║`);
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  console.log("┌──────────────┬──────────────────────┬───────────────────────────────────┬────────────┬─────────────────────────────┐");
  console.log("│   Team ID    │      Team Name       │          Leader Email              │   Status   │         Created At          │");
  console.log("├──────────────┼──────────────────────┼───────────────────────────────────┼────────────┼─────────────────────────────┤");

  for (const team of teams) {
    const id = (team.teamId || '').padEnd(12);
    const name = (team.teamName || '').substring(0, 20).padEnd(20);
    const email = (team.leader?.email || '').substring(0, 33).padEnd(33);
    const status = (team.mentor ? 'Completed' : 'Pending').padEnd(10);
    const created = new Date(team.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    console.log(`│ ${id} │ ${name} │ ${email} │ ${status} │ ${created.padEnd(27)} │`);
  }

  console.log("└──────────────┴──────────────────────┴───────────────────────────────────┴────────────┴─────────────────────────────┘\n");

  console.log("════════════════════ DETAILED TEAM VIEW ════════════════════\n");
  for (const team of teams) {
    console.log(`🏷  Team ID   : ${team.teamId}`);
    console.log(`📛 Team Name  : ${team.teamName}`);
    console.log(`👤 Leader     : ${team.leader.name} (${team.leader.email})`);
    console.log(`📱 Phone      : ${team.leader.phone}`);
    console.log(`🎓 Department : ${team.leader.department || team.leader.branch || 'N/A'}`);
    console.log(`📋 Enrollment : ${team.leader.enrollment}`);
    console.log(`✅ Status     : ${team.status}`);
    console.log(`🧑‍🏫 Mentor    : ${team.mentor ? team.mentor.name + ' (' + team.mentor.email + ')' : 'Not Submitted'}`);
    console.log(`👥 Members    :`);
    for (let i = 0; i < team.members.length; i++) {
      const m = team.members[i];
      console.log(`   ${i+1}. ${m.name} | ${m.gender} | ${m.email} | Enr: ${m.enrollment}`);
    }
    console.log(`📅 Created At : ${new Date(team.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.log("─────────────────────────────────────────────────────────────\n");
  }
}

main().catch(console.error);
