import { NextResponse } from 'next/server';
import { saveOtp, validateOtp, updateAdminPassword } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'send_otp') {
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
      await saveOtp('admin', otp, expiresAt);

      try {
        await sendEmail({
          to: 'internalsih.vsitr@gmail.com',
          subject: 'Admin Password Reset OTP - Internal SIH 2026',
          text: `Your OTP for admin password reset is: ${otp}\n\nThis OTP is valid for 10 minutes. Do not share it with anyone.`
        });
      } catch (emailErr) {
        console.error("OTP email failed:", emailErr);
        return NextResponse.json({ error: "Failed to send OTP email. Please try again." }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "OTP sent to admin email" });
    }

    if (action === 'reset_password') {
      const { otp, newPassword } = body;
      if (!otp || !newPassword) {
        return NextResponse.json({ error: "OTP and new password are required" }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }

      const isValid = await validateOtp('admin', otp);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await updateAdminPassword(hashed);

      return NextResponse.json({ success: true, message: "Password reset successfully" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Forgot Password Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
