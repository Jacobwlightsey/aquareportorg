/* ──── AI Sales Coach ────
   Transcribes demo audio via Deepgram Nova-2,
   then grades the demo using GPT-4.1-mini combining
   transcript + step timings + customer data + readings.
   ──── */

import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

declare const process: { env: Record<string, string | undefined> };

/* ── Helpers ──────────────────────────────────────────── */

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`${name} is not configured`);
  return val;
}

async function isPlatformAdmin(ctx: any, userId: string): Promise<boolean> {
  const user = await ctx.db.get(userId);
  if (!user?.email) return false;
  const envAdmins = (process.env.PLATFORM_ADMIN_EMAILS ?? "jacobwlightsey@gmail.com,clearflowwaterco@gmail.com")
    .split(",")
    .map((e: string) => e.trim().toLowerCase());
  if (envAdmins.includes(user.email.toLowerCase())) return true;
  const dbAdmins = await ctx.db.query("platformAdmins").collect();
  return dbAdmins.some((a: any) => a.email?.toLowerCase() === user.email.toLowerCase());
}

/* ── Generate upload URL ──────────────────────────────── */

export const generateAudioUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

/* ── Attach audio to a demo session ────────────────────── */

export const attachAudio = mutation({
  args: {
    sessionId: v.id("demoSessions"),
    storageId: v.id("_storage"),
    mimeType: v.string(),
    durationSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    // Verify user belongs to the same company
    const member = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!member || member.companyId !== session.companyId) {
      throw new Error("Access denied");
    }

    // Gate: enterprise plan or platform admin only
    const isAdmin = await isPlatformAdmin(ctx, userId);
    if (!isAdmin) {
      const company = await ctx.db.get(session.companyId);
      const plan = company?.stripeStatus === "active" ? company?.stripePlan : "free";
      if (plan !== "enterprise") {
        throw new Error("AI Sales Coach requires an Enterprise plan. Contact us to upgrade.");
      }
    }

    await ctx.db.patch(args.sessionId, {
      audioStorageId: args.storageId,
      audioMimeType: args.mimeType,
      audioDurationSeconds: args.durationSeconds,
      aiCoachStatus: "transcribing",
    });

    // Kick off transcription → analysis pipeline
    await ctx.scheduler.runAfter(0, internal.demoCoach.transcribeAndAnalyze, {
      sessionId: args.sessionId,
    });
  },
});

/* ── Internal: update session fields ────────────────────── */

export const _updateSession = internalMutation({
  args: {
    sessionId: v.id("demoSessions"),
    fields: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, args.fields);
  },
});

/* ── Internal: Transcribe + Analyze pipeline ──────────── */

export const transcribeAndAnalyze = internalAction({
  args: { sessionId: v.id("demoSessions") },
  handler: async (ctx, args) => {
    try {
      // 1. Get the session
      const session: any = await ctx.runQuery(internal.demoCoach._getSession, {
        sessionId: args.sessionId,
      });
      if (!session?.audioStorageId) {
        throw new Error("No audio attached");
      }

      // 2. Get audio blob from storage
      const audioUrl = await ctx.storage.getUrl(session.audioStorageId);
      if (!audioUrl) throw new Error("Audio file not found in storage");

      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) throw new Error("Failed to fetch audio from storage");
      const audioBuffer = await audioResponse.arrayBuffer();

      // 3. Transcribe with Deepgram Nova-2
      await ctx.runMutation(internal.demoCoach._updateSession, {
        sessionId: args.sessionId,
        fields: { aiCoachStatus: "transcribing" },
      });

      const deepgramKey = requireEnv("DEEPGRAM_API_KEY");
      const dgResponse = await fetch(
        "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true&paragraphs=true&utterances=true&language=en",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${deepgramKey}`,
            "Content-Type": session.audioMimeType || "audio/webm",
          },
          body: audioBuffer,
        },
      );

      if (!dgResponse.ok) {
        const err = await dgResponse.text();
        throw new Error(`Deepgram error: ${err}`);
      }

      const dgResult = await dgResponse.json();
      const transcript =
        dgResult.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.transcript ??
        dgResult.results?.channels?.[0]?.alternatives?.[0]?.transcript ??
        "";

      if (!transcript || transcript.trim().length < 10) {
        throw new Error("Transcript too short — audio may be empty or inaudible");
      }

      // Save transcript
      await ctx.runMutation(internal.demoCoach._updateSession, {
        sessionId: args.sessionId,
        fields: { transcript, aiCoachStatus: "analyzing" },
      });

      // 4. Build AI coaching prompt
      const stepTimings = session.stepTimings ? JSON.parse(session.stepTimings) : [];
      const readings = session.liveReadings ? JSON.parse(session.liveReadings) : {};
      const concerns = session.selectedConcerns ? JSON.parse(session.selectedConcerns) : [];
      const pricing = session.pricingSnapshot ? JSON.parse(session.pricingSnapshot) : null;

      const demoDataSummary = [
        `Outcome: ${session.outcome}`,
        `Duration: ${session.durationSeconds ?? "unknown"} seconds`,
        `AquaScore: ${session.verifiedScore ?? session.waterScore ?? "unknown"}`,
        concerns.length > 0 ? `Customer Concerns: ${concerns.join(", ")}` : null,
        Object.keys(readings).length > 0 ? `Live Readings: ${JSON.stringify(readings)}` : null,
        session.monthlyExpenses ? `Monthly Water Expenses: $${session.monthlyExpenses}` : null,
        session.boostApplied ? "Filtration boost was demonstrated" : null,
        pricing ? `Pricing shown — Final: $${pricing.currentPrice}, Monthly: $${pricing.monthlyPayment}/mo` : null,
        stepTimings.length > 0
          ? `Step Timings:\n${stepTimings.map((s: any) => `  ${s.stepKey}: ${s.duration}s`).join("\n")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n");

      const prompt = `You are an expert water treatment sales coach for AquaReport. You are grading a sales rep's in-home water demo.

You have two sources of data:
1. TRANSCRIPT of what was said during the demo (may include both the rep and customer)
2. DEMO DATA from the app showing what the rep did, timing, readings, etc.

## TRANSCRIPT
${transcript}

## DEMO DATA
${demoDataSummary}

## YOUR TASK
Grade this demo and provide coaching feedback. Return a valid JSON object with this exact structure:

{
  "overallGrade": "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D" | "F",
  "overallScore": 0-100,
  "summary": "2-3 sentence overall assessment",
  "categories": [
    {
      "name": "Rapport & Introduction",
      "grade": "A-F",
      "score": 0-100,
      "feedback": "What they did well and what to improve",
      "tip": "One specific actionable tip"
    },
    {
      "name": "Discovery & Listening",
      "grade": "A-F",
      "score": 0-100,
      "feedback": "...",
      "tip": "..."
    },
    {
      "name": "Education & Data Presentation",
      "grade": "A-F",
      "score": 0-100,
      "feedback": "...",
      "tip": "..."
    },
    {
      "name": "Urgency & Health Framing",
      "grade": "A-F",
      "score": 0-100,
      "feedback": "...",
      "tip": "..."
    },
    {
      "name": "Close & Next Steps",
      "grade": "A-F",
      "score": 0-100,
      "feedback": "...",
      "tip": "..."
    },
    {
      "name": "Pacing & Flow",
      "grade": "A-F",
      "score": 0-100,
      "feedback": "...",
      "tip": "..."
    }
  ],
  "highlights": ["Best moment or phrase from the demo", "Another highlight"],
  "improvements": ["Specific thing to change next time", "Another improvement"],
  "scriptSuggestion": "A brief 2-3 sentence script snippet they could have used at a weak point"
}

IMPORTANT:
- Be encouraging but honest. Sales reps want to improve.
- Reference specific things from the transcript when possible ("When you said X, that was effective because...")
- Consider the step timings — did they rush or linger too long on any section?
- If they showed pricing, evaluate how they framed the investment.
- Grade relative to a professional water treatment sales demo.
- Return ONLY the JSON object, no markdown fences, no extra text.`;

      const openaiKey = requireEnv("OPENAI_API_KEY");
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000,
          temperature: 0.4,
        }),
      });

      if (!aiResponse.ok) {
        const err = await aiResponse.text();
        throw new Error(`OpenAI error: ${err}`);
      }

      const aiResult = await aiResponse.json();
      const coachText = aiResult.choices?.[0]?.message?.content?.trim() ?? "";

      // Validate it's parseable JSON
      JSON.parse(coachText);

      // Save final result
      await ctx.runMutation(internal.demoCoach._updateSession, {
        sessionId: args.sessionId,
        fields: {
          aiCoachReport: coachText,
          aiCoachStatus: "complete",
        },
      });
    } catch (err: any) {
      await ctx.runMutation(internal.demoCoach._updateSession, {
        sessionId: args.sessionId,
        fields: {
          aiCoachStatus: "error",
          aiCoachError: err.message || "Unknown error",
        },
      });
    }
  },
});

/* ── Internal query to get session ─────────────────────── */

export const _getSession = internalQuery({
  args: { sessionId: v.id("demoSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

/* ── Query: get coach report for a session ─────────────── */

export const getCoachReport = query({
  args: { sessionId: v.id("demoSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    // Check access — same company or platform admin
    const member = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const isAdmin = await isPlatformAdmin(ctx, userId);
    if (!isAdmin && (!member || member.companyId !== session.companyId)) {
      return null;
    }

    return {
      status: session.aiCoachStatus ?? null,
      error: session.aiCoachError ?? null,
      transcript: session.transcript ?? null,
      report: session.aiCoachReport ? JSON.parse(session.aiCoachReport) : null,
    };
  },
});
