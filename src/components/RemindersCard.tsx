import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BellRing, Check, X } from "lucide-react";

import {
  dismissReminder,
  dueReminders,
  markRecurringPaid,
  reminderLabel,
  type Recurring,
} from "@/lib/recurring";
import { formatMoney } from "@/lib/tally";
import { Button } from "@/components/ui/button";

export function RemindersCard({
  rows,
  userId,
  ledgerId,
  onLogged,
}: {
  rows: Recurring[];
  userId: string;
  ledgerId: string | null;
  onLogged: () => void;
}) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const reminders = dueReminders(rows);

  if (!reminders.length) return null;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["recurring", userId] });
  };

  const pay = async (id: string) => {
    const r = reminders.find((x) => x.row.id === id);
    if (!r) return;
    setBusy(id);
    try {
      await markRecurringPaid(r, userId, ledgerId);
      toast.success(`${r.row.category} logged.`);
      refresh();
      onLogged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't log that entry.");
    }
    setBusy(null);
  };

  const dismiss = async (id: string) => {
    const r = reminders.find((x) => x.row.id === id);
    if (!r) return;
    setBusy(id);
    try {
      await dismissReminder(r);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't dismiss that reminder.");
    }
    setBusy(null);
  };

  const escalated = reminders.some((r) => r.daysUntil < -2);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border bg-card p-5"
      style={{
        borderColor: escalated
          ? "color-mix(in oklab, var(--expense) 45%, var(--border))"
          : "var(--border)",
      }}
    >
      <div className="perforated flex items-baseline justify-between pb-3">
        <h2 className="flex items-center gap-2 font-display text-lg">
          <BellRing className="h-4 w-4 text-gold" />
          Coming up
        </h2>
        <span className="money text-xs text-muted-foreground">
          {reminders.length} {reminders.length === 1 ? "reminder" : "reminders"}
        </span>
      </div>

      <ul className="divide-y divide-dashed divide-border pt-1">
        <AnimatePresence initial={false}>
          {reminders.map((r) => (
            <motion.li
              key={r.row.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap items-center gap-3 py-3"
            >
              <span
                className="money grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs"
                style={{
                  background: r.overdue
                    ? "color-mix(in oklab, var(--expense) 16%, transparent)"
                    : "var(--accent)",
                }}
              >
                {r.row.due_day || r.row.day_of_month}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {r.row.category}
                  {r.row.note ? (
                    <span className="ml-2 text-xs text-muted-foreground">{r.row.note}</span>
                  ) : null}
                </p>
                <p
                  className="text-[11px]"
                  style={{
                    color: r.daysUntil < -2 ? "var(--expense)" : "var(--muted-foreground)",
                  }}
                >
                  {reminderLabel(r)}
                </p>
              </div>
              <span
                className="money text-sm font-semibold"
                style={{ color: r.row.type === "expense" ? "var(--expense)" : "var(--income)" }}
              >
                {formatMoney(Number(r.row.amount), r.row.type)}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={busy === r.row.id}
                  onClick={() => void pay(r.row.id)}
                >
                  <Check className="h-3.5 w-3.5" />
                  Mark paid
                </Button>
                <button
                  type="button"
                  onClick={() => void dismiss(r.row.id)}
                  aria-label="Dismiss reminder"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </motion.section>
  );
}
