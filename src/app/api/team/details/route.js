import { NextResponse } from 'next/server';
import { getTeamById } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    if (!teamId) return NextResponse.json({ error: 'Team ID required' }, { status: 400 });

    const team = await getTeamById(teamId);
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    return NextResponse.json({ success: true, team });
  } catch (err) {
    console.error("Team details error", err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
