import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email || '').trim());
const isValidPhone = (phone) => /^[6-9]\d{9}$/.test((phone || '').trim());


const generatePassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export async function POST(req) {
  try {
    const data = await req.json();
    const { teamName, leader, members } = data;

    const db = await readDB();

    // Validations
    if (db.teams.some(t => t.teamName.toLowerCase() === teamName.toLowerCase())) {
      return NextResponse.json({ error: "Team Name Already Exists" }, { status: 400 });
    }

    if (teamName.toLowerCase().includes('vsitr') || teamName.toLowerCase().includes('vidush somany')) {
      return NextResponse.json({ error: "Team name must not include the institute's name" }, { status: 400 });
    }

    const allMembers = [leader, ...members];
    
    if (allMembers.length !== 6) {
      return NextResponse.json({ error: "Team must consist of exactly 6 members" }, { status: 400 });
    }

    // Validate email & phone for every member
    for (let i = 0; i < allMembers.length; i++) {
      const m = allMembers[i];
      const label = i === 0 ? 'Team Leader' : `Member ${i}`;
      if (!isValidEmail(m.email)) {
        return NextResponse.json({ error: `${label}: "${m.email}" is not a valid email address.` }, { status: 400 });
      }
      if (!isValidPhone(m.phone)) {
        return NextResponse.json({ error: `${label}: Mobile number must be exactly 10 digits and start with 6–9. Got: "${m.phone}"` }, { status: 400 });
      }
    }

    if (!allMembers.some(m => m.gender.toLowerCase() === 'female')) {
      return NextResponse.json({ error: "Team must include at least 1 female participant" }, { status: 400 });
    }

    const enrollments = allMembers.map(m => m.enrollment);
    if (new Set(enrollments).size !== enrollments.length) {
      return NextResponse.json({ error: "Duplicate enrollment numbers within team" }, { status: 400 });
    }

    const allExistingEnrollments = db.teams.flatMap(t => [t.leader.enrollment, ...t.members.map(m => m.enrollment)]);
    for (const enr of enrollments) {
      if (allExistingEnrollments.includes(enr)) {
        return NextResponse.json({ error: `Participant with enrollment ${enr} already registered` }, { status: 400 });
      }
    }

    // Generate Team ID
    const nextId = db.teams.length + 1;
    const teamId = `SIH2026-${String(nextId).padStart(3, '0')}`;

    // Generate Password
    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newTeam = {
      teamId,
      teamName,
      password: hashedPassword,
      leader,
      members,
      mentor: null,
      status: 'Pending Mentor Details',
      createdAt: new Date().toISOString()
    };

    db.teams.push(newTeam);
    await writeDB(db);

    // Send Email to Leader
    const rulesText = `Internal SIH 2026 Rules:
1. Team must have 6 members and 1 female.
2. Complete Mentor Details for final confirmation.
3. Plagiarism leads to disqualification.
4. Decisions of the committee are final.`;

    await sendEmail({
      to: leader.email,
      subject: `Registration Successful - ${teamName} - Internal SIH 2026`,
      text: `Congratulations! Your team ${teamName} has been successfully registered.

Your Team Registration ID: ${teamId}
Your Team Password: ${plainPassword}

Please use these credentials to log in to the Team Portal and submit your Mentor Details.

${rulesText}`
    });

    // Send Email to Members
    for (const member of members) {
      if (member.email) {
        await sendEmail({
          to: member.email,
          subject: `You have been registered for Internal SIH 2026`,
          text: `Hello ${member.name},

You have been registered for Internal SIH 2026 as part of the team "${teamName}" led by ${leader.name}.

${rulesText}`
        });
      }
    }

    return NextResponse.json({ success: true, teamId }, { status: 200 });
  } catch (error) {
    console.error("Registration Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
