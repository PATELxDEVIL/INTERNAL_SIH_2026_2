import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

// For local testing without SMTP credentials, we will just log the emails to a file
const MOCK_EMAIL = !process.env.SMTP_HOST;

export async function sendEmail({ to, subject, text, html }) {
  if (MOCK_EMAIL) {
    const logPath = path.join(process.cwd(), 'data', 'emails.log');
    const logEntry = `\n--- Email Sent at ${new Date().toISOString()} ---\nTo: ${to}\nSubject: ${subject}\nBody: ${text}\n---------------------------------------\n`;
    
    console.log(`Mock Email Sent to ${to}: ${subject}`);
    
    try {
      await fs.appendFile(logPath, logEntry);
    } catch (e) {
      console.error("Failed to write to email log", e);
    }
    return true;
  }

  // Real nodemailer configuration would go here
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    }
  });

  return transporter.sendMail({
    from: '"Internal SIH 2026" <noreply@vsitr.ac.in>',
    to,
    subject,
    text,
    html
  });
}
