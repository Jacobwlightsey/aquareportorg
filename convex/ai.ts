import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { requireEnv } from "./security";

const ROUTINE_MODEL = "gpt-5.4-mini";
const PREMIUM_MODEL = "gpt-5.5";
const PROMPT_VERSION = "aquareport-ai-v1";

function hashInput(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

async function callOpenAI(prompt: string, model: string) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: prompt,
      max_output_tokens: 900,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI request failed");
  }
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const textParts: string[] = [];
  for (const item of data.output ?? []) {
    for (const content of item.content ?? []) {
      if (
        (content.type === "output_text" || content.type === "text") &&
        typeof content.text === "string"
      ) {
        textParts.push(content.text);
      }
    }
  }

  const extracted = textParts.join("\n\n").trim();
  if (extracted) return extracted;
  throw new Error("OpenAI returned no usable text");
}

export const saveGeneration = mutation({
  args: {
    companyId: v.id("companies"),
    reportId: v.optional(v.id("reports")),
    userId: v.optional(v.id("users")),
    purpose: v.string(),
    model: v.string(),
    inputHash: v.string(),
    output: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiGenerations", {
      ...args,
      promptVersion: PROMPT_VERSION,
    });
  },
});

export const attachReportGeneration = mutation({
  args: {
    reportId: v.id("reports"),
    aiSummary: v.optional(v.string()),
    aiSalesNotes: v.optional(v.string()),
    presentationScript: v.optional(v.string()),
    aiEmailDraft: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { reportId, ...update } = args;
    await ctx.db.patch(reportId, update);
  },
});

export const getReportGenerations = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("aiGenerations")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();
  },
});

export const generateReportIntelligence = action({
  args: {
    companyId: v.id("companies"),
    reportId: v.id("reports"),
    reportJson: v.string(),
    purpose: v.union(
      v.literal("homeowner_summary"),
      v.literal("sales_assistant"),
      v.literal("presentation_script"),
      v.literal("email_generator"),
      v.literal("full_report_package")
    ),
  },
  handler: async (ctx, args): Promise<{ output: string }> => {
    const premium = args.purpose !== "homeowner_summary";
    const model = premium ? PREMIUM_MODEL : ROUTINE_MODEL;
    const purposeInstructions: Record<string, string> = {
      homeowner_summary: [
        "Write for a homeowner, not a scientist.",
        "Goal: help the homeowner understand that the water serving their home has warning signs and that a whole-home filtration consultation is a reasonable next step.",
        "Use exactly these labels: Quick read, What this means for your home, Why a whole-home filter makes sense, Next step.",
        "Keep it under 180 words.",
        "Use plain text only. No markdown. No asterisks. No hashtags. No bullet symbols.",
        "Do not say where the data came from.",
        "Do not say this is a lab test from inside the home.",
        "Use phrases like 'your water report' and 'the water coming into your home.'",
        "Do not over-explain stale data or data freshness.",
      ].join("\n"),
      sales_assistant: [
        "Return a sales-rep cheat sheet for a water filtration company.",
        "Goal: help the rep explain why the water coming into the home deserves a whole-home filtration conversation.",
        "Use exactly these labels: Opener, Main angle, Simple talking points, Questions to ask, Objections.",
        "Keep it under 420 words.",
        "Use plain text only. No markdown. No asterisks. No hashtags. No email draft.",
        "Make it conversational and confident. Do not sound like a compliance report.",
        "Do not mention where the data came from.",
        "Position full-home filtration naturally: drinking, cooking, bathing, appliances, and peace of mind.",
      ].join("\n"),
      presentation_script: [
        "Return a 60-90 second script a water treatment rep can say out loud.",
        "Use exactly these labels: Start, Show the problem, Connect it to the home, Close.",
        "Keep it under 330 words.",
        "Use plain text only. No markdown. No asterisks. No hashtags.",
        "Make the homeowner feel this is about the water entering their home.",
        "Do not mention where the data came from and do not claim it is an in-home lab test.",
        "End by inviting a free consultation for a whole-home filtration system.",
      ].join("\n"),
      email_generator: [
        "Write one follow-up email to the homeowner.",
        "Goal: get them to open their report link and book a free whole-home water filtration consultation.",
        "Use exactly this format: Subject, Preview, Email.",
        "Keep the email under 180 words.",
        "Use plain text only. No markdown. No asterisks. No hashtags.",
        "Include the report link exactly as provided in the report JSON.",
        "Do not mention where the data came from.",
        "Do not mention the utility unless it is necessary for clarity.",
        "Do not claim it is a private in-home lab test.",
      ].join("\n"),
      full_report_package: [
        "Return a concise report support package with homeowner summary, talking points, objection responses, email draft, SMS draft, and short presentation script.",
        "Keep it under 800 words.",
      ].join("\n"),
    };

    const prompt = [
      "You are AquaReport's water quality intelligence assistant.",
      "Use only the report data provided. Do not invent health claims, certifications, pricing, or treatment guarantees.",
      "Write in simple homeowner-friendly sales language.",
      "Never return JSON, markdown, API metadata, IDs, tool traces, asterisks, or hashtags.",
      "Do not mention where the data came from.",
      "Do not say the home itself was lab-tested. Say 'your water report,' 'water coming into your home,' or 'your home water profile' instead.",
      "Naturally introduce whole-home filtration as the solution path when the data has health-guideline or legal-limit concerns.",
      purposeInstructions[args.purpose],
      `Purpose: ${args.purpose}`,
      `Report JSON: ${args.reportJson}`,
    ].join("\n\n");

    const output = await callOpenAI(prompt, model);
    await ctx.runMutation(api.ai.saveGeneration, {
      companyId: args.companyId,
      reportId: args.reportId,
      purpose: args.purpose,
      model,
      inputHash: hashInput(args.reportJson + args.purpose),
      output,
      status: "complete",
    });

    if (args.purpose === "homeowner_summary") {
      await ctx.runMutation(api.ai.attachReportGeneration, {
        reportId: args.reportId,
        aiSummary: output,
      });
    }
    if (args.purpose === "sales_assistant") {
      await ctx.runMutation(api.ai.attachReportGeneration, {
        reportId: args.reportId,
        aiSalesNotes: output,
      });
    }
    if (args.purpose === "presentation_script") {
      await ctx.runMutation(api.ai.attachReportGeneration, {
        reportId: args.reportId,
        presentationScript: output,
      });
    }
    if (args.purpose === "email_generator") {
      await ctx.runMutation(api.ai.attachReportGeneration, {
        reportId: args.reportId,
        aiEmailDraft: output,
      });
    }

    return { output };
  },
});
