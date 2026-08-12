import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ScanInput = z.object({
  image: z.string().startsWith("data:image/").max(8_000_000),
});

export const scanReceipt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ScanInput.parse(data))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, error: "AI is not configured." };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              'Extract the payment from the receipt image. Reply with JSON only, no prose, no code fences: {"amount": number, "category": string, "occurred_on": "YYYY-MM-DD" or null, "note": string}. Category must be one of: Food & Dining, Groceries, Transport, Shopping, Bills & Utilities, Entertainment, Health & Fitness, Housing & Rent, Education, Travel, Subscriptions, Personal Care, Gifts & Donations, Insurance, Other. Note is the merchant name, max 40 chars. Amount is the grand total in rupees.',
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract this receipt." },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false as const, error: res.status === 429 ? "Too many scans, try again shortly." : "Could not read that receipt." };
    }

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = (json.choices?.[0]?.message?.content ?? "").replace(/```json|```/g, "").trim();

    try {
      const parsed = z
        .object({
          amount: z.number().positive(),
          category: z.string().max(60),
          occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
          note: z.string().max(80).optional(),
        })
        .parse(JSON.parse(raw));
      return { ok: true as const, entry: parsed };
    } catch {
      return { ok: false as const, error: "Could not read that receipt." };
    }
  });
