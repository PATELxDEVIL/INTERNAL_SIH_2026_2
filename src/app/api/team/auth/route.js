import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { teamId, password } = await req.json();
    const db = await readDB();

    const team = db.teams.find(t => t.teamId === teamId);
    if (!team) {
      return NextResponse.json({ error: "Invalid Team ID or Password" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, team.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid Team ID or Password" }, { status: 401 });
    }

    // In a real app, you'd set a HttpOnly cookie here with JWT
    // For this prototype, we'll return the team info
    const { password: _, ...teamData } = team;

    return NextResponse.json({ success: true, team: teamData }, { status: 200 });
  } catch (error) {
    console.error("Login Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { teamId, oldPassword, newPassword } = await req.json();
    const db = await readDB();

    const teamIndex = db.teams.findIndex(t => t.teamId === teamId);
    if (teamIndex === -1) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const team = db.teams[teamIndex];
    const isMatch = await bcrypt.compare(oldPassword, team.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 401 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    db.teams[teamIndex].password = hashedNewPassword;

    await writeDB(db);

    return NextResponse.json({ success: true, message: "Password updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Password Update Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
