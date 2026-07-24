import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

// GET: fetch all live problem statements
export async function GET() {
  try {
    const db = await readDB();
    const liveProblems = (db.problemStatements || []).filter(p => p.isLive);
    return NextResponse.json({ success: true, problems: liveProblems }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: save team's selected problem statement
export async function POST(req) {
  try {
    const { teamId, problemId } = await req.json();
    const db = await readDB();

    const teamIndex = db.teams.findIndex(t => t.teamId === teamId);
    if (teamIndex === -1) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    const problem = (db.problemStatements || []).find(p => p.id === problemId);
    if (!problem) return NextResponse.json({ error: "Problem statement not found" }, { status: 404 });
    if (!problem.isLive) return NextResponse.json({ error: "This problem statement is not available" }, { status: 400 });

    db.teams[teamIndex].selectedProblemStatement = { id: problem.id, title: problem.title };
    await writeDB(db);

    return NextResponse.json({ success: true, selected: db.teams[teamIndex].selectedProblemStatement }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
