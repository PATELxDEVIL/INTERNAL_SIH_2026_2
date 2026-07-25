import { NextResponse } from 'next/server';
import { saveMentor } from '@/lib/db';

export async function POST(req) {
  try {
    const { teamId, mentor } = await req.json();

    if (!teamId || !mentor) {
      return NextResponse.json({ error: "Team ID and mentor details are required" }, { status: 400 });
    }

    if (!mentor.name || !mentor.email) {
      return NextResponse.json({ error: "Mentor name and email are required" }, { status: 400 });
    }

    await saveMentor(teamId, mentor);
    return NextResponse.json({ success: true, message: "Mentor details saved successfully" });
  } catch (error) {
    console.error("Mentor Save Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
