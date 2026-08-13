import { useState } from "react";
import { motion } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Repeat, Plus, Trash2, Pause, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { categoriesFor, type EntryType } from "@/lib/categories";
import { formatMoney } from "@/lib/tally";
import type { Recurring } from "@/lib/recurring";
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

export function RecurringSection({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<EntryType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Housing & Rent");
  const [note, setNote] = useState("");
  const [day, setDay] = useState("1");
  const [remind, setRemind] = useState("3");
  const [busy, setBusy] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["recurring", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_entries")
        .select("*")
        .order("due_day");
      if (error) throw error;
      return (data ?? []) as Recurring[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["recurring", userId] });

  const switchType = (next: EntryType) => {
    setType(next);
    setCategory(categoriesFor(next)[0]!);
  };

  const save = async () => {
    const value = Number(amount);
    const dayNum = Number(day);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > 28) {
      toast.error("Pick a day between 1 and 28.");
      return;
    }
    const remindNum = Number(remind);
    if (!Number.isInteger(remindNum) || remindNum < 0 || remindNum > 14) {
      toast.error("Remind between 0 and 14 days before.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("recurring_entries").insert({
      user_id: userId,
      type,
      amount: value,
      category,
      note: note.trim() || null,
      day_of_month: dayNum,
      due_day: dayNum,
      remind_days_before: remindNum,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Recurring entry saved — it will log itself each month.");
    setAmount("");
    setNote("");
    setOpen(false);
    refresh();
  };

  const toggle = async (r: Recurring) => {
    const { error } = await supabase
      .from("recurring_entries")
      .update({ active: !r.active })
      .eq("id", r.id);
    if (error) toast.error(error.message);
    else refresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("recurring_entries").delete().eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="rounded-lg border border-border bg-card p-5"
    >
      <div className="perforated flex items-center justify-between pb-3">
        <h2 className="font-display text-lg">Recurring</h2>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add repeat
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center gap-3 pt-5 text-sm text-muted-foreground">
          <Repeat className="h-5 w-5 text-gold" />
          Rent, salary and subscriptions can log themselves every month.
        </div>
      ) : (
        <ul className="divide-y divide-dashed divide-border pt-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <span className="money grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-xs">
                {r.due_day || r.day_of_month}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {r.category}
                  {r.note ? <span className="ml-2 text-xs text-muted-foreground">{r.note}</span> : null}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {r.active
                    ? `Every month on day ${r.due_day || r.day_of_month} · reminds ${r.remind_days_before}d before`
                    : "Paused"}
                </p>
              </div>
              <span
                className="money text-sm font-semibold"
                style={{ color: r.type === "expense" ? "var(--expense)" : "var(--income)" }}
              >
                {formatMoney(Number(r.amount), r.type)}
              </span>
              <button type="button" onClick={() => void toggle(r)} aria-label={r.active ? "Pause" : "Resume"}>
                {r.active ? (
                  <Pause className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Play className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <button type="button" onClick={() => void remove(r.id)} aria-label="Delete recurring entry">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Repeats every month</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchType(t)}
                  className="rounded-md border px-3 py-2 text-sm capitalize transition-colors"
                  style={{
                    borderColor: type === t ? "var(--gold)" : "var(--border)",
                    background: type === t ? "var(--accent)" : "transparent",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rec-amount">Amount (₹)</Label>
                <Input
                  id="rec-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="money"
                  placeholder="18000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rec-day">Due day</Label>
                <Input
                  id="rec-day"
                  inputMode="numeric"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="money"
                  placeholder="1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rec-remind">Remind me (days before)</Label>
              <Input
                id="rec-remind"
                inputMode="numeric"
                value={remind}
                onChange={(e) => setRemind(e.target.value)}
                className="money"
                placeholder="3"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoriesFor(type).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rec-note">Note</Label>
              <Input
                id="rec-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Flat rent"
              />
            </div>
            <Button onClick={() => void save()} disabled={busy} className="w-full">
              Save recurring entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
}
