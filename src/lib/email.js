import { Resend } from 'resend';

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
    from: 'Internal SIH 2026 <internalsih.vsitr@gmail.com>',
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

// Builds a beautiful HTML registration confirmation email
export function buildRegistrationEmail({ teamName, teamId, password, leaderName }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registration Successful - Internal SIH 2026</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#c0392b 0%,#1a3a6b 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:1px;">🏆 Internal SIH 2026</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Vidush Somany Institute of Technology & Research</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#1a3a6b;font-size:22px;">✅ Registration Successful!</h2>
              <p style="margin:0 0 24px;color:#555;font-size:15px;">Hello <strong>${leaderName}</strong>,</p>
              <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 28px;">
                Your team <strong style="color:#c0392b;">${teamName}</strong> has been successfully registered for <strong>Internal Smart India Hackathon 2026</strong>. Use the credentials below to log into the Team Portal and complete Phase 2 (Mentor Details).
              </p>

              <!-- Credentials Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9ff;border:2px solid #1a3a6b;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;">
                    <p style="margin:0 0 6px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Team Registration ID</p>
                    <p style="margin:0 0 20px;color:#1a3a6b;font-size:28px;font-weight:800;letter-spacing:3px;font-family:monospace;">${teamId}</p>
                    
                    <p style="margin:0 0 6px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Team Password</p>
                    <p style="margin:0;color:#c0392b;font-size:28px;font-weight:800;letter-spacing:4px;font-family:monospace;">${password}</p>
                  </td>
                </tr>
              </table>

              <p style="color:#555;font-size:14px;margin:0 0 8px;"><strong>Login URL:</strong> <a href="https://internal-sih-2026-2.vercel.app/team/login" style="color:#1a3a6b;">https://internal-sih-2026-2.vercel.app/team/login</a></p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #eee;margin:28px 0;">

              <!-- Rules -->
              <h3 style="margin:0 0 12px;color:#1a3a6b;font-size:16px;">📋 Important Rules</h3>
              <ul style="margin:0;padding:0 0 0 20px;color:#555;font-size:14px;line-height:2;">
                <li>Team must have exactly 6 members including 1 Team Leader.</li>
                <li>At least 1 female participant is mandatory.</li>
                <li>Submit Mentor Details via the Team Portal to complete registration.</li>
                <li>Plagiarism or cheating leads to immediate disqualification.</li>
                <li>Decisions of the organizing committee are final and binding.</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f5f5;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;color:#999;font-size:12px;">© 2026 Internal SIH Hackathon — VSITR, KSV. Do not reply to this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Member notification email (plain)
export function buildMemberEmail({ memberName, teamName, leaderName }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
          <tr>
            <td style="background:linear-gradient(135deg,#c0392b 0%,#1a3a6b 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">🏆 Internal SIH 2026</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Vidush Somany Institute of Technology & Research</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1a3a6b;">You're Registered!</h2>
              <p style="color:#555;font-size:15px;line-height:1.7;">Hello <strong>${memberName}</strong>,</p>
              <p style="color:#555;font-size:15px;line-height:1.7;">
                You have been successfully registered for <strong>Internal Smart India Hackathon 2026</strong> as a member of team <strong style="color:#c0392b;">${teamName}</strong>, led by <strong>${leaderName}</strong>.
              </p>
              <p style="color:#555;font-size:15px;line-height:1.7;">
                Your Team Leader will log into the portal to submit Mentor Details and select a Problem Statement. Stay in touch with your team.
              </p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
              <h3 style="margin:0 0 12px;color:#1a3a6b;font-size:16px;">📋 Important Rules</h3>
              <ul style="margin:0;padding:0 0 0 20px;color:#555;font-size:14px;line-height:2;">
                <li>All 6 team members must attend the hackathon event.</li>
                <li>At least 1 female participant is mandatory per team.</li>
                <li>Plagiarism or cheating leads to immediate disqualification.</li>
                <li>Decisions of the organizing committee are final and binding.</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td style="background:#f5f5f5;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0;color:#999;font-size:12px;">© 2026 Internal SIH Hackathon — VSITR, KSV. Do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
