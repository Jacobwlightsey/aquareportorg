/* ──── Sprint 3C: Real AI Assistant backend ──── */

import { action } from "./_generated/server";
import { v } from "convex/values";

export const askDemoAssistant = action({
  args: {
    question: v.string(),
    context: v.object({
      currentStep: v.string(),
      aquaScore: v.optional(v.number()),
      customerName: v.optional(v.string()),
      companyName: v.optional(v.string()),
      contaminantCount: v.optional(v.number()),
      overLegal: v.optional(v.number()),
      overHealth: v.optional(v.number()),
      topContaminants: v.optional(v.array(v.string())),
      concerns: v.optional(v.array(v.string())),
      currentSolution: v.optional(v.string()),
      householdSize: v.optional(v.number()),
      hasKids: v.optional(v.boolean()),
    }),
  },
  handler: async (_ctx, { question, context }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { answer: null, error: "OPENAI_API_KEY not configured" };
    }

    const systemPrompt = `You are a water quality sales assistant helping a dealer during a live in-home demo presentation${context.companyName ? ` for ${context.companyName}` : ""}.

Your role:
- Give concise, actionable advice (max 150 words)
- Reference the customer's ACTUAL contaminant data and score
- Match your suggestions to the current demo step
- Be a sales coach, not a scientist — keep language simple and customer-friendly
- If asked about objections, give specific rebuttals using the customer's data
- Never make up contaminant data — only reference what's in the context

Current context:
- Demo step: ${context.currentStep}
- Customer: ${context.customerName ?? "Unknown"}
- AquaScore: ${context.aquaScore ?? "N/A"}
- Contaminants: ${context.contaminantCount ?? "N/A"} total, ${context.overLegal ?? 0} above legal limits, ${context.overHealth ?? 0} above health guidelines
${context.topContaminants?.length ? `- Top concerns: ${context.topContaminants.join(", ")}` : ""}
${context.concerns?.length ? `- Customer's stated concerns: ${context.concerns.join(", ")}` : ""}
${context.currentSolution ? `- Current solution: ${context.currentSolution}` : ""}
${context.householdSize ? `- Household: ${context.householdSize} people${context.hasKids ? " (has kids)" : ""}` : ""}`;

    try {
      // 8-second timeout (flag #5 from Jacob's review)
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("OpenAI API error:", response.status, errorBody);
        return { answer: null, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content?.trim();
      return { answer: answer ?? null, error: answer ? null : "No response" };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { answer: null, error: "timeout" };
      }
      console.error("AI assistant error:", err);
      return { answer: null, error: err.message ?? "Unknown error" };
    }
  },
});
