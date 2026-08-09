import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Target, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EXPENSE_CATEGORIES } from "@/lib/categories";
import { formatMoney, type Txn } from "@/lib/tally";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Budget = {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
};

function Ring({ pct, color }: { pct: number; color: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" stroke="color-mix(in oklab, var(--ink) 10%, transparent)" />
      <motion.circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        stroke={color}
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        whileInView={{ strokeDashoffset: c - c * Math.min(pct, 1) }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

export function BudgetSection({ userId, monthTxns }: { userId: string; monthTxns: Txn[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [limit, setLimit] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("budgets").select("*").order("category");
      if (error) throw error;
      return (data ?? []) as Budget[];
    },
  });

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTxns) {
      if (t.type !== "expense") continue;
      map.set(t.category, (map.get(t.category) ?? 0) + Number(t.amount));
    }
    return map;
  }, [monthTxns]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["budgets", userId] });

  const save = async () => {
    const value = Number(limit);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a limit greater than zero.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("budgets")
      .upsert({ user_id: userId, category, monthly_limit: value }, { onConflict: "user_id,category" });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Budget set for ${category}`);
    setLimit("");
    setOpen(false);
    refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="rounded-lg border border-border bg-card p-5"
    >
      <div className="perforated flex items-center justify-between pb-3">
        <h2 className="font-display text-lg">Budgets</h2>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Set budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <div className="flex items-center gap-3 pt-5 text-sm text-muted-foreground">
          <Target className="h-5 w-5 text-gold" />
          Set a monthly cap on a category and Tally will nudge you at 80%.
        </div>
      ) : (
        <ul className="grid gap-4 pt-5 sm:grid-cols-2">
          {budgets.map((b) => {
            const spent = spentByCategory.get(b.category) ?? 0;
            const pct = spent / Number(b.monthly_limit);
            const color =
              pct >= 1 ? "var(--expense)" : pct >= 0.8 ? "var(--gold)" : "var(--income)";
            return (
              <li key={b.id} className="group flex items-center gap-3">
                <div className="relative shrink-0">
                  <Ring pct={pct} color={color} />
                  <span className="money absolute inset-0 grid place-items-center text-[11px] font-semibold">
                    {Math.round(pct * 100)}%
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.category}</p>
                  <p className="money text-xs text-muted-foreground">
                    {formatMoney(spent)} of {formatMoney(Number(b.monthly_limit))}
                  </p>
                  {pct >= 0.8 && (
                    <p className="mt-0.5 text-[11px]" style={{ color }}>
                      {pct >= 1 ? "Over budget" : "80% used — ease up"}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void remove(b.id)}
                  aria-label={`Remove ${b.category} budget`}
                  className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Monthly budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-limit">Limit (₹ per month)</Label>
              <Input
                id="budget-limit"
                inputMode="decimal"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="5000"
                className="money"
              />
            </div>
            <Button onClick={() => void save()} disabled={busy} className="w-full">
              Save budget
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
}
