import { NextResponse } from 'next/server';
import { getAllTeams, updateTeamPassword, deleteTeam } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const teams = await getAllTeams();
    return NextResponse.json({ success: true, teams });
  } catch (error) {
    console.error("Error fetching teams", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { action, teamId, newPassword } = await req.json();

    if (action === 'reset_password') {
      if (!teamId || !newPassword) {
        return NextResponse.json({ error: "Team ID and new password required" }, { status: 400 });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await updateTeamPassword(teamId, hashed);
      return NextResponse.json({ success: true, message: "Password reset successfully" });
    }

    if (action === 'delete') {
      if (!teamId) {
        return NextResponse.json({ error: "Team ID required" }, { status: 400 });
      }
      await deleteTeam(teamId);
      return NextResponse.json({ success: true, message: "Team deleted successfully" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating team", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
