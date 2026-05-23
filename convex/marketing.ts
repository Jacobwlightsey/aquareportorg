import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { getMembership, canRole } from "./security";
import { api } from "./_generated/api";

export const getContent = query({
  args: { type: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    let content = await ctx.db
      .query("marketingContent")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .order("desc")
      .collect();
    if (args.type) content = content.filter((c) => c.type === args.type);
    return content;
  },
});

export const createContent = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    content: v.string(),
    platform: v.optional(v.string()),
    zip: v.optional(v.string()),
    waterData: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    return await ctx.db.insert("marketingContent", {
      companyId: result.membership.companyId,
      ...args,
      status: "draft",
      createdBy: result.membership.userId,
    });
  },
});

export const updateContent = mutation({
  args: {
    contentId: v.id("marketingContent"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(v.string()),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const { contentId, ...update } = args;
    const clean = Object.fromEntries(Object.entries(update).filter(([, v]) => v !== undefined));
    await ctx.db.patch(contentId, clean);
  },
});

export const deleteContent = mutation({
  args: { contentId: v.id("marketingContent") },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    await ctx.db.delete(args.contentId);
  },
});

// ─── AI Content Generation ───────────────────────────────────────

export const generateSocialPost = action({
  args: {
    reportId: v.optional(v.id("reports")),
    platform: v.string(),
    topic: v.optional(v.string()),
    zip: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    let waterContext = "";
    if (args.reportId) {
      const report = await ctx.runQuery(api.reports.getReport, { reportId: args.reportId });
      if (report) {
        waterContext = `Based on water quality data from ${report.city}, ${report.state} (${report.utilityName}): ${report.totalContaminants} contaminants detected, ${report.overLegalLimits} above legal limits, water score ${report.waterScore}/100.`;
      }
    }

    const platformGuide: Record<string, string> = {
      facebook: "Write for Facebook: conversational tone, 2-3 short paragraphs, include a call to action. 150-300 words.",
      instagram: "Write for Instagram: engaging, visual language, use emojis sparingly, include relevant hashtags. 100-200 words + 10-15 hashtags.",
      twitter: "Write for X/Twitter: punchy, under 280 characters, include 1-2 hashtags.",
      linkedin: "Write for LinkedIn: professional tone, industry insights, 200-400 words.",
    };

    const prompt = `You are a social media content creator for a water treatment company. Create a ${args.platform} post.
${platformGuide[args.platform] || "Write an engaging social media post, 100-250 words."}

${args.topic ? `Topic: ${args.topic}` : "Topic: Why homeowners should test their water quality"}
${waterContext ? `\nLocal water data context:\n${waterContext}` : ""}

IMPORTANT: Don't use specific company names. Write generically so any water treatment dealer can use this.
Focus on education, urgency, and the importance of knowing what's in your water.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Failed to generate content.";
  },
});

export const generateDoorHanger = action({
  args: {
    zip: v.string(),
    reportId: v.optional(v.id("reports")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    let waterContext = "";
    if (args.reportId) {
      const report = await ctx.runQuery(api.reports.getReport, { reportId: args.reportId });
      if (report) {
        const contaminants = JSON.parse(report.contaminants || "[]");
        const topIssues = contaminants
          .filter((c: any) => c.exceedsLimit || c.exceedsGuideline)
          .slice(0, 3)
          .map((c: any) => c.name);
        waterContext = `ZIP ${args.zip} - ${report.utilityName}: ${report.totalContaminants} contaminants, top issues: ${topIssues.join(", ")}. Water score: ${report.waterScore}/100.`;
      }
    }

    const prompt = `Create a door hanger / mailer text for a water treatment company targeting homeowners in ZIP code ${args.zip}.

${waterContext ? `Local water data:\n${waterContext}\n` : ""}

Format:
HEADLINE (attention-grabbing, 5-8 words)
SUBHEADLINE (urgency/concern, 10-15 words)
BODY (3 bullet points about local water concerns, 1-2 sentences each)
CALL TO ACTION (what to do next - free water test offer)
FOOTER (company placeholder: [Your Company Name] | [Phone] | [Website])

Keep it factual but compelling. Focus on local relevance.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Failed to generate content.";
  },
});

// ─── Competitor Templates ────────────────────────────────────────

export const getCompetitorTemplates = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    return await ctx.db
      .query("competitorTemplates")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .collect();
  },
});

export const createCompetitorTemplate = mutation({
  args: {
    competitorName: v.string(),
    competitorType: v.string(),
    removesContaminants: v.optional(v.string()),
    doesNotRemove: v.optional(v.string()),
    priceRange: v.optional(v.string()),
    limitations: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    return await ctx.db.insert("competitorTemplates", {
      companyId: result.membership.companyId,
      ...args,
      createdBy: result.membership.userId,
    });
  },
});
