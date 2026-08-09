import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Download, LogOut, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CountUp } from "@/components/CountUp";
import { CategoryDonut } from "@/components/CategoryDonut";
import { TrendChart } from "@/components/TrendChart";
import { LedgerList } from "@/components/LedgerList";
import { EntryDialog } from "@/components/EntryDialog";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { QuickAdd } from "@/components/QuickAdd";
import { BudgetSection } from "@/components/BudgetSection";
import { StreakCard } from "@/components/StreakCard";
import { RecurringSection } from "@/components/RecurringSection";
import { postDueRecurring, type Recurring } from "@/lib/recurring";
import { monthKey, monthLabel, monthRange, toCsv, type Txn } from "@/lib/tally";


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your ledger — Tally" },
      {
        name: "description",
        content:
          "Monthly totals, category breakdown and every entry you've logged, in one calm ledger.",
      },
      { property: "og:title", content: "Your ledger — Tally" },
      { property: "og:description", content: "Monthly totals and category breakdown in Tally." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [anchor, setAnchor] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Txn | null>(null);

  const label = monthLabel(anchor);
  const { start, end } = monthRange(anchor);
  const windowStart = useMemo(() => {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - 5, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  }, [anchor]);

  const { data = [], refetch } = useQuery({
    queryKey: ["transactions", user.id, windowStart, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("occurred_on", windowStart)
        .lte("occurred_on", end)
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Txn[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("transactions-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const monthTxns = useMemo(
    () => data.filter((t) => t.occurred_on >= start && t.occurred_on <= end),
    [data, start, end],
  );

  const totals = useMemo(() => {
    let spent = 0;
    let earned = 0;
    for (const t of monthTxns) {
      if (t.type === "expense") spent += Number(t.amount);
      else earned += Number(t.amount);
    }
    return { spent, earned, net: earned - spent };
  }, [monthTxns]);

  const shift = useCallback((delta: number) => {
    setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }, []);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className="relative z-10 min-h-screen">
      <header className="glass sticky top-0 z-30">
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="font-display text-xl font-semibold">Tally</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-1.5">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <motion.h1
              key={label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-2xl sm:text-3xl"
            >
              {label}
            </motion.h1>
            <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => toCsv(monthTxns, label)}
            disabled={!monthTxns.length}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Spent", value: totals.spent, color: "var(--expense)", sign: "expense" as const },
            { label: "Earned", value: totals.earned, color: "var(--income)", sign: "income" as const },
            {
              label: "Net balance",
              value: totals.net,
              color: totals.net >= 0 ? "var(--income)" : "var(--expense)",
              sign: undefined,
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
              whileHover={{ y: -3, rotateX: -3 }}
              style={{ transformPerspective: 800 }}
              className="rounded-lg border border-border bg-card p-4"
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {card.label}
              </p>
              <CountUp
                value={card.value}
                {...(card.sign ? { sign: card.sign } : {})}
                className="money mt-2 block text-2xl font-semibold"
              />
              <span
                className="mt-3 block h-0.5 w-10 rounded-full"
                style={{ background: card.color }}
              />
            </motion.div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            className="rounded-lg border border-border bg-card p-5"
          >
            <h2 className="perforated pb-3 font-display text-lg">Where it went</h2>
            <div className="pt-4">
              <CategoryDonut transactions={monthTxns} />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            className="rounded-lg border border-border bg-card p-5"
          >
            <h2 className="perforated pb-3 font-display text-lg">Last six months</h2>
            <div className="pt-4">
              <TrendChart transactions={data} anchor={anchor} />
            </div>
          </motion.section>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          className="mt-4 rounded-lg border border-border bg-card p-5"
        >
          <div className="perforated flex items-baseline justify-between pb-3">
            <h2 className="font-display text-lg">Entries</h2>
            <span className="money text-xs text-muted-foreground">
              {monthTxns.length} {monthTxns.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <LedgerList
            transactions={monthTxns}
            onSelect={(t) => {
              setEditing(t);
              setDialogOpen(true);
            }}
          />
        </motion.section>
      </main>

      <motion.button
        type="button"
        onClick={openNew}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground shadow-lg"
      >
        <Plus className="h-4 w-4" />
        Add entry
      </motion.button>

      <EntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        userId={user.id}
        defaultDate={start}
        onSaved={() => void refetch()}
      />

      <Footer />
    </div>
  );
}
