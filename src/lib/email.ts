import { Resend } from 'resend';

type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

let resendClient: Resend | null = null;
let resendClientKey: string | null = null;

function getResendClient(apiKey: string) {
  if (!resendClient || resendClientKey !== apiKey) {
    resendClient = new Resend(apiKey);
    resendClientKey = apiKey;
  }
  return resendClient;
}

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() || process.env.SMTP_FROM?.trim();
  if (!apiKey || !from || !payload.to) return false;

  try {
    const resend = getResendClient(apiKey);
    await resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email via Resend', error);
    return false;
  }
}
