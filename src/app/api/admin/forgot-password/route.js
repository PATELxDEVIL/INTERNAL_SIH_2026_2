import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { sendEmail } from '@/lib/email';

// In-memory OTP store (resets on server restart — fine for serverless)
// For production persistence, store OTPs in the DB
const otpStore = new Map();

export async function POST(req) {
  try {
    const { action, otp, newPassword } = await req.json();

    // --- Step 1: Request OTP ---
    if (action === 'request_otp') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
      otpStore.set('admin_reset', { otp: generatedOtp, expiry });

      await sendEmail({
        to: 'internalsih.vsitr@gmail.com',
        subject: 'Admin Password Reset OTP — Internal SIH 2026',
        text: `Your OTP to reset the admin password is: ${generatedOtp}\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 2rem; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #003580;">Internal SIH 2026 — Admin Password Reset</h2>
            <p>Use the OTP below to reset your admin password:</p>
            <div style="font-size: 2.5rem; font-weight: 700; letter-spacing: 0.5rem; color: #cc0000; text-align: center; padding: 1rem; background: #fff5f5; border-radius: 8px; margin: 1.5rem 0;">
              ${generatedOtp}
            </div>
            <p style="color: #666; font-size: 0.875rem;">This OTP is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
          </div>
        `
      });

      return NextResponse.json({ success: true, message: 'OTP sent to admin email.' });
    }

    // --- Step 2: Verify OTP & Reset Password ---
    if (action === 'verify_otp') {
      const stored = otpStore.get('admin_reset');
      if (!stored) {
        return NextResponse.json({ error: 'No OTP requested. Please request a new OTP.' }, { status: 400 });
      }
      if (Date.now() > stored.expiry) {
        otpStore.delete('admin_reset');
        return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
      }
      if (stored.otp !== otp) {
        return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
      }

      const db = await readDB();
      db.admin.password = newPassword;
      await writeDB(db);
      otpStore.delete('admin_reset');

      return NextResponse.json({ success: true, message: 'Password reset successfully!' });
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
