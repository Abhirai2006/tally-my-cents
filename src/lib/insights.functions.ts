import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InsightInput = z.object({
  month: z.string().min(1).max(40),
  spent: z.number(),
  earned: z.number(),
  categories: z.array(z.object({ name: z.string().max(60), amount: z.number() })).max(20),
  previousMonths: z
    .array(z.object({ month: z.string().max(20), spent: z.number(), earned: z.number() }))
    .max(12),
});

export const getInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => InsightInput.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { insights: [] as string[] };

    const prompt = [
      `Month: ${data.month}`,
      `Spent: INR ${data.spent.toFixed(0)} | Earned: INR ${data.earned.toFixed(0)}`,
      `Categories: ${data.categories.map((c) => `${c.name} ${c.amount.toFixed(0)}`).join(", ") || "none"}`,
      `Previous months: ${
        data.previousMonths.map((m) => `${m.month} spent ${m.spent.toFixed(0)}`).join(", ") || "none"
      }`,
    ].join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a concise Indian personal-finance coach. Given monthly ledger numbers, reply with exactly three short observations, one per line, no numbering, no markdown, max 15 words each. Use ₹ and Indian number sense. Be specific with comparisons and percentages. Never invent data that is not derivable from the numbers.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) return { insights: [] as string[] };
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content ?? "";
    const insights = text
      .split("\n")
      .map((l) => l.replace(/^[-•\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 3);
    return { insights };
  });
