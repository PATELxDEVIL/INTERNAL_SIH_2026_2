import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(req) {
  try {
    const db = await readDB();
    // Don't send passwords to frontend
    const teams = db.teams.map(({ password, ...t }) => t);
    return NextResponse.json({ success: true, teams }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { teamId, action, newPassword } = await req.json();
    const db = await readDB();
    
    const teamIndex = db.teams.findIndex(t => t.teamId === teamId);
    if (teamIndex === -1) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    if (action === 'reset_password') {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      db.teams[teamIndex].password = hashedNewPassword;
      await writeDB(db);
      return NextResponse.json({ success: true, message: "Password reset successfully" }, { status: 200 });
    }
    
    // other actions (delete, edit) can be added here
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
