import { NextResponse } from 'next/server';
import { getProblems } from '@/lib/db';

export async function GET() {
  try {
    const allProblems = await getProblems();
    const liveProblems = allProblems.filter(p => p.isLive);
    return NextResponse.json({ success: true, problems: liveProblems });
  } catch (error) {
    console.error("Team Problems Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
