import { Resend } from 'resend';

// Use Resend if RESEND_API_KEY is set, otherwise log to console (dev mock)
const MOCK_EMAIL = !process.env.RESEND_API_KEY;

export async function sendEmail({ to, subject, text, html }) {
  if (MOCK_EMAIL) {
    console.log(`\n--- Mock Email ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log(`-----------------\n`);
    return true;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: 'Internal SIH 2026 <onboarding@resend.dev>',
    to,
    subject,
    text,
    html,
  });

  if (error) {
    console.error('Resend email error:', error);
    throw new Error(error.message);
  }

  return data;
}
