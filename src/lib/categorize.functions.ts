import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  text: z.string().min(1).max(200),
  categories: z.array(z.string().min(1)).min(1).max(64),
});

/**
 * Asks the model to pick the single best-matching category from the list the
 * app already uses. Never invents categories; callers fall back to keyword
 * matching whenever this returns null.
 */
export const categorizeEntry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }): Promise<{ category: string | null }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { category: null };

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": apiKey,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify({
          model: "openai/gpt-5.6-sol",
          stream: true,
          instructions:
            "You classify short personal-finance notes into exactly one category. " +
            "Reply with the category string only — copied verbatim from the provided list. " +
            "No punctuation, no explanation.",
          input: `Categories: ${data.categories.join(" | ")}\nEntry: ${data.text}`,
        }),
      });

      if (!res.ok || !res.body) return { category: null };

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const event = JSON.parse(payload) as {
              type?: string;
              delta?: string;
              response?: { output_text?: string };
            };
            if (event.type === "response.output_text.delta" && event.delta) text += event.delta;
            if (event.type === "response.completed" && event.response?.output_text) {
              text = event.response.output_text;
            }
          } catch {
            /* ignore malformed keepalive chunks */
          }
        }
      }

      const answer = text.trim().replace(/^["'`]+|["'`.]+$/g, "");
      const match = data.categories.find((c) => c.toLowerCase() === answer.toLowerCase());
      return { category: match ?? null };
    } catch {
      return { category: null };
    }
  });
