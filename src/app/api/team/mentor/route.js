import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function POST(req) {
  try {
    const { teamId, mentor } = await req.json();
    const db = await readDB();

    const teamIndex = db.teams.findIndex(t => t.teamId === teamId);
    if (teamIndex === -1) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (db.teams[teamIndex].mentor) {
      return NextResponse.json({ error: "Mentor details already submitted" }, { status: 400 });
    }

    db.teams[teamIndex].mentor = mentor;
    db.teams[teamIndex].status = "Registration Completed";

    await writeDB(db);

    return NextResponse.json({ success: true, team: db.teams[teamIndex] }, { status: 200 });
  } catch (error) {
    console.error("Mentor Update Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
