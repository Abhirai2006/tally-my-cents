import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, RefreshCw } from "lucide-react";
import { getInsights } from "@/lib/insights.functions";
import { Button } from "@/components/ui/button";

export function InsightsCard({
  month,
  spent,
  earned,
  categories,
  previousMonths,
}: {
  month: string;
  spent: number;
  earned: number;
  categories: { name: string; amount: number }[];
  previousMonths: { month: string; spent: number; earned: number }[];
}) {
  const run = useServerFn(getInsights);
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ask = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await run({
        data: { month, spent, earned, categories: categories.slice(0, 12), previousMonths },
      });
      if (!res.insights.length) setError("No read on this month yet — log a few more entries.");
      setLines(res.insights);
    } catch {
      setError("Couldn't reach the coach right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="rounded-lg border border-border bg-card p-5"
    >
      <div className="perforated flex items-baseline justify-between pb-3">
        <h2 className="flex items-center gap-2 font-display text-lg">
          <Sparkles className="h-4 w-4 text-primary" />
          Smart insights
        </h2>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => void ask()} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {lines.length ? "Again" : "Read my month"}
        </Button>
      </div>

      <div className="pt-4">
        {loading && lines.length === 0 && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-4 rounded bg-muted"
                animate={{ opacity: [0.45, 0.9, 0.45] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
                style={{ width: `${88 - i * 12}%` }}
              />
            ))}
          </div>
        )}

        {!loading && lines.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {error || "Ask for a quick read on where this month is heading."}
          </p>
        )}

        <ul className="space-y-2.5">
          <AnimatePresence initial={false}>
            {lines.map((l, i) => (
              <motion.li
                key={l}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="flex gap-2.5 text-sm"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: `var(--chart-${i + 1})` }}
                />
                {l}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </motion.section>
  );
}
