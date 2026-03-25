import nodemailer from 'nodemailer'

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? 'admin@localhost'

  const transporter = createTransport()

  await transporter.sendMail({
    from,
    to,
    subject: 'Your admin verification code',
    text: [
      `Your Scavenger Hunt admin login code is:`,
      ``,
      `  ${code}`,
      ``,
      `This code expires in 10 minutes.`,
      `If you did not request this code, ignore this email.`,
    ].join('\n'),
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="margin:0 0 8px;">Admin verification code</h2>
        <p style="color:#555;margin:0 0 24px;">Use the code below to complete your sign-in.</p>
        <div style="background:#f4f4f5;border-radius:8px;padding:20px 24px;text-align:center;letter-spacing:0.2em;font-size:2rem;font-weight:700;font-family:monospace;">
          ${code}
        </div>
        <p style="color:#888;font-size:13px;margin:20px 0 0;">
          Expires in 10 minutes. If you did not request this, ignore this email.
        </p>
      </div>
    `,
  })
}
