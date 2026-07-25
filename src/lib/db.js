import { neon } from '@neondatabase/serverless';

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
  return neon(process.env.DATABASE_URL);
}

// ─── TEAMS ────────────────────────────────────────────────────────────────────

export async function getAllTeams() {
  const sql = getSql();
  const teams = await sql`SELECT * FROM teams ORDER BY created_at DESC`;
  const members = await sql`SELECT * FROM team_members ORDER BY team_id, is_leader DESC`;
  const mentors = await sql`SELECT * FROM mentors`;

  return teams.map(team => {
    const teamMembers = members.filter(m => m.team_id === team.team_id);
    const leader = teamMembers.find(m => m.is_leader);
    const mems = teamMembers.filter(m => !m.is_leader);
    const mentor = mentors.find(m => m.team_id === team.team_id) || null;

    return {
      teamId: team.team_id,
      teamName: team.team_name,
      password: team.password,
      status: team.status,
      createdAt: team.created_at,
      leader: leader ? formatMember(leader) : null,
      members: mems.map(formatMember),
      mentor: mentor ? formatMentor(mentor) : null,
    };
  });
}

export async function getTeamById(teamId) {
  const sql = getSql();
  const [team] = await sql`SELECT * FROM teams WHERE team_id = ${teamId}`;
  if (!team) return null;

  const members = await sql`SELECT * FROM team_members WHERE team_id = ${teamId} ORDER BY is_leader DESC`;
  const [mentor] = await sql`SELECT * FROM mentors WHERE team_id = ${teamId}`;

  const leader = members.find(m => m.is_leader);
  const mems = members.filter(m => !m.is_leader);

  return {
    teamId: team.team_id,
    teamName: team.team_name,
    password: team.password,
    status: team.status,
    createdAt: team.created_at,
    leader: leader ? formatMember(leader) : null,
    members: mems.map(formatMember),
    mentor: mentor ? formatMentor(mentor) : null,
  };
}

export async function createTeam({ teamId, teamName, password, leader, members }) {
  const sql = getSql();

  await sql`
    INSERT INTO teams (team_id, team_name, password)
    VALUES (${teamId}, ${teamName}, ${password})
  `;

  // Insert leader
  await sql`
    INSERT INTO team_members (team_id, is_leader, name, email, phone, gender, enrollment, semester, department)
    VALUES (${teamId}, true, ${leader.name}, ${leader.email}, ${leader.phone}, ${leader.gender},
            ${leader.enrollment}, ${leader.semester || ''}, ${leader.department || ''})
  `;

  // Insert members
  for (const m of members) {
    await sql`
      INSERT INTO team_members (team_id, is_leader, name, email, phone, gender, enrollment, semester, department)
      VALUES (${teamId}, false, ${m.name}, ${m.email}, ${m.phone}, ${m.gender},
              ${m.enrollment}, ${m.semester || ''}, ${m.department || ''})
    `;
  }
}

export async function updateTeamPassword(teamId, hashedPassword) {
  const sql = getSql();
  await sql`UPDATE teams SET password = ${hashedPassword} WHERE team_id = ${teamId}`;
}

export async function updateTeamStatus(teamId, status) {
  const sql = getSql();
  await sql`UPDATE teams SET status = ${status} WHERE team_id = ${teamId}`;
}

export async function getNextTeamId() {
  const sql = getSql();
  const [row] = await sql`SELECT COUNT(*) as count FROM teams`;
  const next = parseInt(row.count) + 1;
  return `SIH2026-${String(next).padStart(3, '0')}`;
}

export async function isEnrollmentTaken(enrollment) {
  const sql = getSql();
  const [row] = await sql`SELECT 1 FROM team_members WHERE LOWER(enrollment) = LOWER(${enrollment}) LIMIT 1`;
  return !!row;
}

export async function isTeamNameTaken(teamName) {
  const sql = getSql();
  const [row] = await sql`SELECT 1 FROM teams WHERE LOWER(team_name) = LOWER(${teamName}) LIMIT 1`;
  return !!row;
}

// ─── MENTOR ───────────────────────────────────────────────────────────────────

export async function saveMentor(teamId, mentor) {
  const sql = getSql();
  await sql`
    INSERT INTO mentors (team_id, name, email, contact, address, institute, department)
    VALUES (${teamId}, ${mentor.name}, ${mentor.email}, ${mentor.contact || ''},
            ${mentor.address || ''}, ${mentor.institute || ''}, ${mentor.department || ''})
    ON CONFLICT (team_id) DO UPDATE SET
      name = EXCLUDED.name, email = EXCLUDED.email,
      contact = EXCLUDED.contact, address = EXCLUDED.address,
      institute = EXCLUDED.institute, department = EXCLUDED.department
  `;
  await sql`UPDATE teams SET status = 'Registration Completed' WHERE team_id = ${teamId}`;
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export async function getAdmin() {
  const sql = getSql();
  const [admin] = await sql`SELECT * FROM admins LIMIT 1`;
  return admin || null;
}

export async function updateAdminPassword(newHashedPassword) {
  const sql = getSql();
  await sql`UPDATE admins SET password = ${newHashedPassword}`;
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

export async function getConfig() {
  const sql = getSql();
  const rows = await sql`SELECT key, value FROM config`;
  const cfg = {};
  rows.forEach(r => { cfg[r.key] = r.value; });

  // Get hero media
  const heroRows = await sql`SELECT url FROM hero_media ORDER BY display_order`;
  cfg.heroMedia = heroRows.map(r => r.url);

  return cfg;
}

export async function setConfig(key, value) {
  const sql = getSql();
  await sql`
    INSERT INTO config (key, value) VALUES (${key}, ${JSON.stringify(value)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;
}

export async function setHeroMedia(urls) {
  const sql = getSql();
  await sql`DELETE FROM hero_media`;
  for (let i = 0; i < urls.length; i++) {
    await sql`INSERT INTO hero_media (url, display_order) VALUES (${urls[i]}, ${i})`;
  }
}

export async function setLogos(logos) {
  await setConfig('logos', logos);
}

// ─── PROBLEM STATEMENTS ───────────────────────────────────────────────────────

export async function getProblems() {
  const sql = getSql();
  const rows = await sql`SELECT * FROM problem_statements ORDER BY created_at DESC`;
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    pdfUrl: r.pdf_url,
    isLive: r.is_live,
    createdAt: r.created_at,
  }));
}

export async function createProblem({ title, description, pdfUrl }) {
  const sql = getSql();
  const [row] = await sql`
    INSERT INTO problem_statements (title, description, pdf_url)
    VALUES (${title}, ${description}, ${pdfUrl || null})
    RETURNING id
  `;
  return row.id;
}

export async function toggleProblemLive(id) {
  const sql = getSql();
  await sql`UPDATE problem_statements SET is_live = NOT is_live WHERE id = ${id}`;
}

// ─── OTPs ─────────────────────────────────────────────────────────────────────

export async function saveOtp(identifier, otp, expiresAt) {
  const sql = getSql();
  await sql`DELETE FROM otps WHERE identifier = ${identifier}`;
  await sql`INSERT INTO otps (identifier, otp, expires_at) VALUES (${identifier}, ${otp}, ${expiresAt})`;
}

export async function validateOtp(identifier, otp) {
  const sql = getSql();
  const [row] = await sql`
    SELECT * FROM otps
    WHERE identifier = ${identifier} AND otp = ${otp} AND expires_at > NOW()
  `;
  if (row) {
    await sql`DELETE FROM otps WHERE identifier = ${identifier}`;
    return true;
  }
  return false;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatMember(m) {
  return {
    name: m.name,
    email: m.email,
    phone: m.phone,
    gender: m.gender,
    enrollment: m.enrollment,
    semester: m.semester,
    department: m.department,
  };
}

function formatMentor(m) {
  return {
    name: m.name,
    email: m.email,
    contact: m.contact,
    address: m.address,
    institute: m.institute,
    department: m.department,
  };
}
