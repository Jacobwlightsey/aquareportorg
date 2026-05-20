import type { EmailConfig } from "@convex-dev/auth/server";
import { APP_NAME } from "./constants";

declare const process: { env: Record<string, string | undefined> };

function generateOTP() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

function fromAddress() {
  return process.env.AUTH_EMAIL_FROM || "AquaReport <hello@aquareport.org>";
}

function replyToAddress() {
  return process.env.AUTH_EMAIL_REPLY_TO || "support@aquareport.org";
}

async function sendEmail({
  email,
  token,
  subject,
  heading,
  description,
}: {
  email: string;
  token: string;
  subject: string;
  heading: string;
  description: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: email,
      reply_to: replyToAddress(),
      subject: `${subject} - ${APP_NAME}`,
      html: `
        <div style="margin:0; padding:0; background:#020617;">
          <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 20px;">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #082f49 100%); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; overflow: hidden;">
              <div style="padding: 28px 28px 18px;">
                <div style="display:inline-flex; align-items:center; gap:10px; color:#e0f2fe; font-weight:800; letter-spacing:0.02em;">
                  <span style="display:inline-block; width:34px; height:34px; border-radius:10px; background:linear-gradient(135deg,#2563eb,#06b6d4); vertical-align:middle;"></span>
                  <span style="font-size:18px;">AquaReport</span>
                </div>
                <h1 style="color:#f8fafc; margin:28px 0 8px; font-size:28px; line-height:1.15;">${heading}</h1>
                <p style="color:#cbd5e1; margin:0; font-size:15px; line-height:1.6;">${description}</p>
              </div>
              <div style="padding: 0 28px 28px;">
                <div style="background: rgba(15,23,42,0.85); border: 1px solid rgba(125,211,252,0.28); padding: 24px; text-align: center; border-radius: 16px; box-shadow: 0 0 40px rgba(14,165,233,0.18);">
                  <div style="color:#38bdf8; font-size:11px; font-weight:800; letter-spacing:0.22em; text-transform:uppercase; margin-bottom:12px;">Verification Code</div>
                  <span style="font-size: 38px; font-weight: 900; letter-spacing: 9px; color: #f8fafc;">${token}</span>
                </div>
                <p style="color:#94a3b8; font-size:13px; line-height:1.6; margin:18px 0 0;">This code expires in 15 minutes. If you did not request this, you can ignore this email.</p>
              </div>
            </div>
            <p style="color:#64748b; font-size:12px; text-align:center; margin:18px 0 0;">Sent by AquaReport from aquareport.org</p>
          </div>
        </div>
      `,
      text: `${heading}\n\n${description}\n\nYour code is: ${token}\n\nThis code expires in 15 minutes.\n\n${APP_NAME}`,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }
}

async function authorizeEmail(params: Record<string, unknown>, account: unknown) {
  if (typeof params.email !== "string") {
    throw new Error("Token verification requires an email.");
  }
  const expectedEmail = String((account as { providerAccountId?: string }).providerAccountId || "")
    .trim()
    .toLowerCase();
  const providedEmail = params.email.trim().toLowerCase();
  if (expectedEmail !== providedEmail) {
    throw new Error("Verification code does not match this email.");
  }
}

function createEmailProvider({
  id,
  subject,
  heading,
  description,
}: {
  id: string;
  subject: string;
  heading: string;
  description: string;
}): EmailConfig {
  return {
    id,
    type: "email",
    name: "AquaReport Email",
    from: fromAddress(),
    maxAge: 60 * 15,
    authorize: authorizeEmail,
    generateVerificationToken: async () => generateOTP(),
    sendVerificationRequest: async (params: { identifier: string; token: string }) => {
      await sendEmail({
        email: params.identifier,
        token: params.token,
        subject,
        heading,
        description,
      });
    },
    options: {},
  } as unknown as EmailConfig;
}

export const AquaReportEmail = createEmailProvider({
  id: "aquareport-email",
  subject: "Verify your email",
  heading: "Verify your email",
  description: "Use this verification code to finish creating your AquaReport account.",
});

export const AquaReportPasswordReset = createEmailProvider({
  id: "aquareport-password-reset",
  subject: "Reset your password",
  heading: "Reset your password",
  description: "Use this code to reset your AquaReport password.",
});
