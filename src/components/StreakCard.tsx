import { useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { Flame, Trophy, Check } from "lucide-react";
import type { Txn } from "@/lib/tally";
import { currentStreak, longestStreak, milestonesFor } from "@/lib/streaks";
import { celebrate } from "@/lib/celebrate";

const KEY = "tally-celebrated-months";

export function StreakCard({
  transactions,
  monthTxns,
  monthKey,
  net,
}: {
  transactions: Txn[];
  monthTxns: Txn[];
  monthKey: string;
  net: number;
}) {
  const streak = useMemo(() => currentStreak(transactions), [transactions]);
  const best = useMemo(() => longestStreak(transactions), [transactions]);
  const surplus = net > 0 && monthTxns.length > 0;
  const milestones = useMemo(
    () => milestonesFor(streak, transactions.length, surplus),
    [streak, transactions.length, surplus],
  );
  const fired = useRef(false);

  useEffect(() => {
    if (!surplus || fired.current) return;
    try {
      const seen = JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
      if (seen.includes(monthKey)) return;
      localStorage.setItem(KEY, JSON.stringify([...seen, monthKey].slice(-24)));
    } catch {
      /* storage unavailable — celebrate anyway */
    }
    fired.current = true;
    celebrate();
  }, [surplus, monthKey]);

  // Last 21 days heat strip
  const strip = useMemo(() => {
    const days = new Set(transactions.map((t) => t.occurred_on));
    return Array.from({ length: 21 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (20 - i));
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return { iso, on: days.has(iso) };
    });
  }, [transactions]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="rounded-lg border border-border bg-card p-5"
    >
      <div className="perforated flex items-baseline justify-between pb-3">
        <h2 className="font-display text-lg">Streak</h2>
        <span className="money text-xs text-muted-foreground">best {best}d</span>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <motion.div
          animate={streak > 0 ? { scale: [1, 1.12, 1] } : {}}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent"
        >
          <Flame className="h-6 w-6 text-gold" />
        </motion.div>
        <div>
          <p className="money text-2xl font-semibold">{streak} days</p>
          <p className="text-xs text-muted-foreground">
            {streak === 0
              ? "Log something today to start a streak."
              : streak < 3
                ? "Nice start — keep it going."
                : "On a roll. Don't break the chain."}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-1">
        {strip.map((d, i) => (
          <motion.span
            key={d.iso}
            initial={{ scaleY: 0.3, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ delay: i * 0.02 }}
            title={d.iso}
            className="h-6 flex-1 rounded-sm"
            style={{
              background: d.on
                ? "color-mix(in oklab, var(--gold) 75%, transparent)"
                : "color-mix(in oklab, var(--ink) 8%, transparent)",
            }}
          />
        ))}
      </div>

      <ul className="mt-5 flex flex-wrap gap-2">
        {milestones.map((m) => (
          <li
            key={m.id}
            title={m.hint}
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]"
            style={{
              borderColor: m.hit ? "color-mix(in oklab, var(--gold) 55%, transparent)" : "var(--border)",
              color: m.hit ? "var(--gold)" : "var(--muted-foreground)",
            }}
          >
            {m.hit ? <Check className="h-3 w-3" /> : <Trophy className="h-3 w-3" />}
            {m.label}
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
