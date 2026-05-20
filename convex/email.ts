import { v } from "convex/values";
import { action } from "./_generated/server";

declare const process: { env: Record<string, string | undefined> };

type Template = {
  subject: string;
  preview: string;
  eyebrow: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
  secondary?: string;
};

function siteUrl() {
  return process.env.SITE_URL || "https://aquareport.org";
}

function fromAddress() {
  return process.env.AUTH_EMAIL_FROM || "AquaReport <hello@aquareport.org>";
}

function replyToAddress() {
  return process.env.AUTH_EMAIL_REPLY_TO || "support@aquareport.org";
}

function consumerUrl() {
  return process.env.MYAQUAREPORT_URL || "https://myaquareport.com";
}

function layout(template: Template) {
  const cta = template.cta
    ? `<a href="${template.cta.href}" style="display:inline-block; background:linear-gradient(135deg,#2563eb,#06b6d4); color:white; text-decoration:none; font-weight:800; padding:13px 18px; border-radius:12px; margin-top:18px;">${template.cta.label}</a>`
    : "";
  const secondary = template.secondary
    ? `<p style="color:#94a3b8; font-size:13px; line-height:1.6; margin:18px 0 0;">${template.secondary}</p>`
    : "";

  return `
    <div style="margin:0; padding:0; background:#020617;">
      <div style="display:none; overflow:hidden; line-height:1px; opacity:0; max-height:0; max-width:0;">${template.preview}</div>
      <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #082f49 100%); border: 1px solid rgba(255,255,255,0.12); border-radius: 20px; overflow: hidden;">
          <div style="padding: 30px;">
            <div style="color:#e0f2fe; font-weight:900; font-size:18px;">AquaReport</div>
            <div style="color:#38bdf8; font-size:11px; font-weight:900; letter-spacing:0.2em; text-transform:uppercase; margin:30px 0 10px;">${template.eyebrow}</div>
            <h1 style="color:#f8fafc; margin:0 0 12px; font-size:30px; line-height:1.12;">${template.title}</h1>
            <p style="color:#cbd5e1; margin:0; font-size:15px; line-height:1.7;">${template.body}</p>
            ${cta}
            ${secondary}
          </div>
        </div>
        <p style="color:#64748b; font-size:12px; text-align:center; margin:18px 0 0;">AquaReport · Water intelligence for modern dealers</p>
        <p style="color:#475569; font-size:11px; text-align:center; margin:8px 0 0;">Manage notification preferences: <a href="${consumerUrl()}/unsubscribe" style="color:#38bdf8;">unsubscribe</a></p>
      </div>
    </div>
  `;
}

async function sendEmail(to: string | string[], template: Template) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to,
      reply_to: replyToAddress(),
      subject: template.subject,
      html: layout(template),
      text: `${template.title}\n\n${template.body}\n\n${template.cta ? `${template.cta.label}: ${template.cta.href}` : ""}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend failed: ${await response.text()}`);
  }

  return await response.json();
}

export const sendWelcomeEmail = action({
  args: {
    to: v.string(),
    name: v.optional(v.string()),
    companyName: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    return await sendEmail(args.to, {
      subject: "Welcome to AquaReport",
      preview: "Your AquaReport workspace is ready.",
      eyebrow: "Welcome",
      title: `Welcome${args.name ? `, ${args.name}` : ""}.`,
      body: `${args.companyName || "Your team"} now has a production-ready workspace for branded water quality reports, customer-facing share links, lead capture, and sales intelligence.`,
      cta: { label: "Open dashboard", href: `${siteUrl()}/dashboard` },
      secondary: "Start by setting your company branding, then generate your first customer report from a ZIP code.",
    });
  },
});

export const sendPurchaseConfirmation = action({
  args: {
    to: v.string(),
    plan: v.string(),
  },
  handler: async (_ctx, args) => {
    return await sendEmail(args.to, {
      subject: `You're subscribed to AquaReport ${args.plan}`,
      preview: "Your AquaReport subscription is active.",
      eyebrow: "Subscription active",
      title: "Thanks for your purchase.",
      body: `Your AquaReport ${args.plan} subscription is now active. Your team can generate branded reports, capture leads, and use the platform tools included with your plan.`,
      cta: { label: "Go to AquaReport", href: `${siteUrl()}/dashboard` },
      secondary: "Need help onboarding your sales team? Reply to this email and we will help you get set up.",
    });
  },
});

export const sendLeadNotification = action({
  args: {
    to: v.array(v.string()),
    leadName: v.string(),
    leadEmail: v.optional(v.string()),
    leadPhone: v.optional(v.string()),
    utility: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    if (args.to.length === 0) return { skipped: true };
    const contact = [args.leadEmail, args.leadPhone].filter(Boolean).join(" · ");
    return await sendEmail(args.to, {
      subject: `New AquaReport lead: ${args.leadName}`,
      preview: "A homeowner requested a quote from a water report.",
      eyebrow: "New lead",
      title: `${args.leadName} requested a quote.`,
      body: `A new lead came in from a customer-facing water report${args.utility ? ` for ${args.utility}` : ""}.${contact ? ` Contact: ${contact}.` : ""}`,
      cta: { label: "Open leads", href: `${siteUrl()}/leads` },
      secondary: "Respond quickly while the report is fresh. The lead is saved in your AquaReport dashboard.",
    });
  },
});

export const sendSubscriptionReminder = action({
  args: {
    to: v.string(),
    name: v.optional(v.string()),
    reportCount: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    return await sendEmail(args.to, {
      subject: "Unlock AquaReport for your sales team",
      preview: "Turn water reports into a repeatable sales workflow.",
      eyebrow: "Upgrade reminder",
      title: "Your reports can do more.",
      body: `${args.name ? `${args.name}, y` : "Y"}ou can use AquaReport to generate branded customer reports, capture quote requests, and help reps explain water data with confidence.${args.reportCount ? ` You have already created ${args.reportCount} report${args.reportCount === 1 ? "" : "s"}.` : ""}`,
      cta: { label: "Choose a plan", href: `${siteUrl()}/company` },
      secondary: "Starter, Growth, and Pro plans are available monthly with no custom contract required.",
    });
  },
});

export const sendTeamInviteEmail = action({
  args: {
    to: v.string(),
    inviterName: v.optional(v.string()),
    companyName: v.string(),
    role: v.string(),
    inviteUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    return await sendEmail(args.to, {
      subject: `You're invited to ${args.companyName} on AquaReport`,
      preview: `${args.companyName} invited you to join their AquaReport workspace.`,
      eyebrow: "Team invite",
      title: `Join ${args.companyName}.`,
      body: `${args.inviterName || "Your team"} invited you to AquaReport as ${args.role.replace("_", " ")}. Accept the invite to access company reports, leads, and sales tools.`,
      cta: { label: "Accept invite", href: args.inviteUrl },
      secondary: "This invite expires in 7 days. Use the same email address this invite was sent to.",
    });
  },
});

export const sendHomeTestReadyEmail = action({
  args: {
    to: v.string(),
    referralUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    return await sendEmail(args.to, {
      subject: "Your Home Water Test Results Are Ready",
      preview: "Your in-home water test results are ready to view.",
      eyebrow: "Home test ready",
      title: "Your home water test results are ready.",
      body: "A water quality professional has tested your home's water. View your results and AquaScore using your secure claim link.",
      cta: { label: "View my results", href: args.referralUrl },
      secondary: "This notification was sent because a dealer entered results for your home water test.",
    });
  },
});

export const sendFiltrationVerifiedEmail = action({
  args: {
    to: v.string(),
    systemName: v.string(),
  },
  handler: async (_ctx, args) => {
    return await sendEmail(args.to, {
      subject: "Your Filtration System Has Been Verified",
      preview: "Your filtration install has been verified.",
      eyebrow: "Install verified",
      title: "Your filtration system has been verified.",
      body: `Great news. Your ${args.systemName} installation has been verified by a certified dealer. Your AquaScore may have improved.`,
      cta: { label: "Open MyAquaReport", href: consumerUrl() },
      secondary: "Log in to review your updated home water profile and score details.",
    });
  },
});

export const sendConsumerLeadClaimedEmail = action({
  args: {
    to: v.string(),
  },
  handler: async (_ctx, args) => {
    return await sendEmail(args.to, {
      subject: "A Water Professional Is On the Way",
      preview: "A local water quality professional accepted your free test request.",
      eyebrow: "Request accepted",
      title: "A water professional is on the way.",
      body: "A local water quality professional has accepted your free test request and will be reaching out to schedule your in-home test.",
      cta: { label: "Open MyAquaReport", href: consumerUrl() },
      secondary: "You requested a free in-home test through MyAquaReport.",
    });
  },
});

export const sendScoreChangedEmail = action({
  args: {
    to: v.string(),
    oldScore: v.number(),
    newScore: v.number(),
  },
  handler: async (_ctx, args) => {
    const dropped = args.newScore < args.oldScore;
    return await sendEmail(args.to, {
      subject: "Your Water Quality Score Has Changed",
      preview: `Your AquaScore changed from ${args.oldScore} to ${args.newScore}.`,
      eyebrow: "Score updated",
      title: "Your Water Quality Score Has Changed",
      body: `Water data in your area has been updated. Your AquaScore changed from ${args.oldScore} to ${args.newScore}.`,
      cta: { label: "See details", href: consumerUrl() },
      secondary: dropped
        ? "Consider scheduling a re-test to verify your home's water quality."
        : "Your score history is available in MyAquaReport.",
    });
  },
});
