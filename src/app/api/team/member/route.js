import { NextResponse } from 'next/server';
import { updateTeamMember, getTeamById } from '@/lib/db';

export async function PUT(req) {
  try {
    const { teamId, member } = await req.json();
    if (!teamId || !member || !member.id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await updateTeamMember(member.id, member);
    
    // Return updated team
    const team = await getTeamById(teamId);
    return NextResponse.json({ success: true, team });
  } catch (err) {
    console.error("Update member error", err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
