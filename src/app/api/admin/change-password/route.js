import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function POST(req) {
  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
    }

    const db = await readDB();

    if (db.admin.password !== currentPassword) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    db.admin.password = newPassword;
    await writeDB(db);

    return NextResponse.json({ success: true, message: 'Password changed successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
