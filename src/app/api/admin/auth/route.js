import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    const db = await readDB();

    if (username === db.admin.username && password === db.admin.password) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Invalid Admin Credentials" }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
