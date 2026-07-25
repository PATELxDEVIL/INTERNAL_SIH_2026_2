import { NextResponse } from 'next/server';
import { updateTeamProblem, getTeamById, getConfig } from '@/lib/db';

export async function POST(req) {
  try {
    const { teamId, problemId } = await req.json();
    if (!teamId || !problemId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if deadline has passed
    const config = await getConfig();
    if (config && config.deadline) {
      if (new Date().getTime() > new Date(config.deadline).getTime()) {
        return NextResponse.json({ error: "Deadline has passed. Cannot change problem statement." }, { status: 403 });
      }
    }

    await updateTeamProblem(teamId, problemId);
    
    // Return updated team
    const team = await getTeamById(teamId);
    return NextResponse.json({ success: true, team });
  } catch (err) {
    console.error("Select problem error", err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
