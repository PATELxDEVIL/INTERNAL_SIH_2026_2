import nodemailer from 'nodemailer';

// If no SMTP_HOST is set, just log the email (development mock)
const MOCK_EMAIL = !process.env.SMTP_HOST;

export async function sendEmail({ to, subject, text, html }) {
  if (MOCK_EMAIL) {
    console.log(`\n--- Mock Email ---`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log(`-----------------\n`);
    return true;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter.sendMail({
    from: `"Internal SIH 2026" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
}
