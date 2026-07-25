import { NextResponse } from 'next/server';
import { getAdmin, updateAdminPassword } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both current and new password are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await updateAdminPassword(hashed);

    return NextResponse.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
