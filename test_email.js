require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testEmail() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'internalsih.vsitr@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  console.log('Sending test email...');
  const info = await transporter.sendMail({
    from: '"Internal SIH 2026" <internalsih.vsitr@gmail.com>',
    to: 'devangpatel1972003@gmail.com',
    subject: '✅ Test Email - Internal SIH 2026 Portal',
    html: `
      <div style="font-family:Arial;padding:30px;background:#f0f4f8;">
        <div style="background:white;border-radius:10px;padding:30px;max-width:500px;margin:auto;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          <h2 style="color:#1a3a6b;">🏆 Internal SIH 2026</h2>
          <p>This is a test email from the registration portal.</p>
          <div style="background:#f8f9ff;border:2px solid #1a3a6b;border-radius:8px;padding:20px;margin:20px 0;">
            <p style="margin:0 0 6px;color:#888;font-size:12px;text-transform:uppercase;font-weight:600;">Sample Team ID</p>
            <p style="margin:0 0 16px;color:#1a3a6b;font-size:26px;font-weight:800;font-family:monospace;">SIH2026-007</p>
            <p style="margin:0 0 6px;color:#888;font-size:12px;text-transform:uppercase;font-weight:600;">Sample Password</p>
            <p style="margin:0;color:#c0392b;font-size:26px;font-weight:800;font-family:monospace;">Ab3!xZ9k</p>
          </div>
          <p style="color:#555;">If you received this, Gmail SMTP is working perfectly! ✅</p>
          <p style="color:#999;font-size:12px;margin-top:20px;">© 2026 Internal SIH — VSITR, KSV</p>
        </div>
      </div>
    `,
  });

  console.log('✅ Email sent successfully!');
  console.log('Message ID:', info.messageId);
}

testEmail().catch(err => {
  console.error('❌ Email failed:', err.message);
});
