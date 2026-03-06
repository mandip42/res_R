import { Resend } from "resend";

let client: Resend | null = null;

function getResendClient(): Resend | null {
  const key = process.env.RESEND_KEY;
  if (!key) return null;
  if (!client) {
    client = new Resend(key);
  }
  return client;
}

export async function sendRoastReadyEmail(opts: {
  to: string;
  roastId: string;
  isJobCompare?: boolean;
}) {
  const resend = getResendClient();
  if (!resend) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${appUrl}/roast/${opts.roastId}`;

  const subject = opts.isJobCompare
    ? "Your resume vs job roast is ready"
    : "Your resume roast is ready";

  const html = `
    <p>Your roast is ready.</p>
    <p><a href="${link}" target="_blank" rel="noopener noreferrer">View your roast</a></p>
  `;

  try {
    await resend.emails.send({
      from: "Would I Hire You <noreply@wouldihireyou.app>",
      to: opts.to,
      subject,
      html,
    });
  } catch (err) {
    console.error("Failed to send roast email", err);
  }
}

