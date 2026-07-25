import { NextResponse } from 'next/server';
import { isTeamNameTaken } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const teamName = searchParams.get('name');

    if (!teamName || teamName.trim().length < 3) {
      return NextResponse.json({ available: false, message: 'Name too short' });
    }

    const name = teamName.trim();

    if (name.toLowerCase().includes('vsitr') || name.toLowerCase().includes('vidush somany')) {
      return NextResponse.json({ available: false, message: "Team name must not include the institute's name" });
    }

    const taken = await isTeamNameTaken(name);
    return NextResponse.json({
      available: !taken,
      message: taken ? 'This team name is already registered.' : 'Team name is available!'
    });
  } catch (error) {
    console.error("Check team name error:", error);
    return NextResponse.json({ available: false, message: 'Error checking name' }, { status: 500 });
  }
}
