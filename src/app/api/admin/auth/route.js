import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    const admin = await getAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
    }

    if (username !== admin.username) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Admin Auth Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
