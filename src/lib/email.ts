import { Resend } from 'resend';

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() || process.env.SMTP_FROM?.trim();
  if (!apiKey || !from || !payload.to) return false;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    return true;
  } catch {
    return false;
  }
}
