import { NextResponse } from 'next/server';
import { getTeamById, getConfig } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { teamId, password } = await req.json();

    const config = await getConfig();
    if (config && config.registrationButtonLink === '/team/login' && config.deadline) {
      if (new Date().getTime() > new Date(config.deadline).getTime()) {
        return NextResponse.json({ error: "Login window has closed." }, { status: 403 });
      }
    }

    if (!teamId || !password) {
      return NextResponse.json({ error: "Team ID and password are required" }, { status: 400 });
    }

    const team = await getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, team.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        status: team.status,
        leader: team.leader,
        members: team.members,
        mentor: team.mentor,
      }
    });
  } catch (error) {
    console.error("Team Auth Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
