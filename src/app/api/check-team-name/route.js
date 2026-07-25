import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const name = (searchParams.get('name') || '').trim();

    if (!name) {
      return NextResponse.json({ available: false, message: 'No name provided.' });
    }

    const db = await readDB();
    const taken = db.teams.some(t => t.teamName.toLowerCase() === name.toLowerCase());

    return NextResponse.json({
      available: !taken,
      message: taken ? 'This team name is already registered.' : 'Team name is available!'
    });
  } catch (error) {
    console.error('Check team name error:', error);
    return NextResponse.json({ available: false, message: 'Could not verify.' }, { status: 500 });
  }
}
