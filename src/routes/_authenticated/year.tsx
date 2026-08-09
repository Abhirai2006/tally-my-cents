import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowLeft, ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { colorForCategory, iconFor } from "@/lib/categories";
import { formatMoney, type Txn } from "@/lib/tally";
import { longestStreak } from "@/lib/streaks";
import { celebrate } from "@/lib/celebrate";

export const Route = createFileRoute("/_authenticated/year")({
  head: () => ({
    meta: [
      { title: "Year in review — Tally" },
      {
        name: "description",
        content: "A story-style recap of everything you spent, earned and saved this year.",
      },
      { property: "og:title", content: "Year in review — Tally" },
      { property: "og:description", content: "Your biggest categories, best month and streaks." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: YearInReview,
});

const ease = [0.22, 1, 0.36, 1] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function YearInReview() {
  const { user } = Route.useRouteContext();
  const [year, setYear] = useState(() => new Date().getFullYear());

  const { data = [] } = useQuery({
    queryKey: ["year", user.id, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("occurred_on", `${year}-01-01`)
        .lte("occurred_on", `${year}-12-31`)
        .order("occurred_on");
      if (error) throw error;
      return (data ?? []) as Txn[];
    },
  });

  const stats = useMemo(() => {
    let spent = 0;
    let earned = 0;
    const byCategory = new Map<string, number>();
    const byMonth = Array.from({ length: 12 }, () => ({ spent: 0, earned: 0 }));
    let biggest: Txn | null = null;

    for (const t of data) {
      const amt = Number(t.amount);
      const m = Number(t.occurred_on.slice(5, 7)) - 1;
      if (t.type === "expense") {
        spent += amt;
        byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + amt);
        byMonth[m]!.spent += amt;
        if (!biggest || amt > Number(biggest.amount)) biggest = t;
      } else {
        earned += amt;
        byMonth[m]!.earned += amt;
      }
    }

    const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    let bestMonth = -1;
    let bestNet = -Infinity;
    byMonth.forEach((m, i) => {
      const net = m.earned - m.spent;
      if ((m.earned || m.spent) && net > bestNet) {
        bestNet = net;
        bestMonth = i;
      }
    });

    return {
      spent,
      earned,
      net: earned - spent,
      top,
      byMonth,
      biggest,
      bestMonth,
      bestNet,
      count: data.length,
      streak: longestStreak(data),
      days: new Set(data.map((t) => t.occurred_on)).size,
    };
  }, [data]);

  const share = async () => {
    const lines = [
      `My ${year} on Tally`,
      `Earned ${formatMoney(stats.earned)} · Spent ${formatMoney(stats.spent)}`,
      `Net ${formatMoney(stats.net, stats.net >= 0 ? "income" : "expense")}`,
      stats.top[0] ? `Top category: ${stats.top[0][0]} (${formatMoney(stats.top[0][1])})` : "",
      `${stats.count} entries · ${stats.streak}-day best streak`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      if (navigator.share) await navigator.share({ text: lines, title: `My ${year} on Tally` });
      else {
        await navigator.clipboard.writeText(lines);
        toast.success("Recap copied to clipboard");
      }
      celebrate();
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const maxMonth = Math.max(1, ...stats.byMonth.map((m) => Math.max(m.spent, m.earned)));

  return (
    <div className="relative z-10 min-h-screen">
      <header className="glass sticky top-0 z-30">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Ledger
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <motion.h1 key={year} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl sm:text-5xl">
              {year} <span className="ink-gradient">in review</span>
            </motion.h1>
            <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)} aria-label="Next year">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void share()}>
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>

        {stats.count === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">
            Nothing logged in {year} yet. Add a few entries and your recap will build itself.
          </p>
        ) : (
          <div className="mt-8 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Earned", value: stats.earned, color: "var(--income)" },
                { label: "Spent", value: stats.spent, color: "var(--expense)" },
                { label: "Net", value: stats.net, color: stats.net >= 0 ? "var(--income)" : "var(--expense)" },
              ].map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease }}
                  className="glass rounded-xl p-5"
                >
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{c.label}</p>
                  <p className="money mt-2 text-2xl font-semibold" style={{ color: c.color }}>
                    {formatMoney(c.value)}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-5"
            >
              <h2 className="perforated pb-3 font-display text-lg">Your top five</h2>
              <ul className="space-y-3 pt-4">
                {stats.top.map(([cat, amt], i) => {
                  const Icon = iconFor(cat);
                  const pct = amt / (stats.top[0]?.[1] || 1);
                  return (
                    <li key={cat} className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent">
                        <Icon className="h-4 w-4 text-gold" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="truncate">
                            <span className="money mr-2 text-xs text-muted-foreground">#{i + 1}</span>
                            {cat}
                          </span>
                          <span className="money font-semibold">{formatMoney(amt)}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${pct * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, delay: i * 0.08, ease }}
                            className="h-full rounded-full"
                            style={{ background: colorForCategory(cat) }}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-5"
            >
              <h2 className="perforated pb-3 font-display text-lg">Month by month</h2>
              <div className="flex items-end gap-2 pt-6" style={{ height: 160 }}>
                {stats.byMonth.map((m, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-full w-full items-end justify-center gap-0.5">
                      <motion.span
                        initial={{ height: 0 }}
                        whileInView={{ height: `${(m.earned / maxMonth) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: i * 0.03, ease }}
                        className="w-1/2 rounded-t-sm"
                        style={{ background: "var(--income)" }}
                      />
                      <motion.span
                        initial={{ height: 0 }}
                        whileInView={{ height: `${(m.spent / maxMonth) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: i * 0.03 + 0.05, ease }}
                        className="w-1/2 rounded-t-sm"
                        style={{ background: "var(--expense)" }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{MONTHS[i]}</span>
                  </div>
                ))}
              </div>
            </motion.section>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Best month",
                  value: stats.bestMonth >= 0 ? MONTHS[stats.bestMonth]! : "—",
                  sub: stats.bestMonth >= 0 ? `Net ${formatMoney(stats.bestNet)}` : "",
                },
                {
                  label: "Biggest single spend",
                  value: stats.biggest ? formatMoney(Number(stats.biggest.amount)) : "—",
                  sub: stats.biggest ? `${stats.biggest.category} · ${stats.biggest.occurred_on}` : "",
                },
                { label: "Entries logged", value: String(stats.count), sub: `${stats.days} different days` },
                { label: "Longest streak", value: `${stats.streak} days`, sub: "in a row" },
              ].map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.5, ease }}
                  className="glass rounded-xl p-5"
                >
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{c.label}</p>
                  <p className="money mt-2 text-xl font-semibold">{c.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
