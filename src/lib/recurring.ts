import { supabase } from "@/integrations/supabase/client";
import type { EntryType } from "@/lib/categories";

export type Recurring = {
  id: string;
  user_id: string;
  type: EntryType;
  amount: number;
  category: string;
  note: string | null;
  day_of_month: number;
  due_day: number;
  remind_days_before: number;
  dismissed_month: string | null;
  active: boolean;
  last_posted_month: string | null;
  created_at: string;
  updated_at: string;
};

export const monthKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export type Reminder = {
  row: Recurring;
  dueOn: string;
  /** Negative = overdue by that many days. */
  daysUntil: number;
  overdue: boolean;
};

/**
 * Recurring entries whose due date falls inside their reminder window (or is
 * already past) and which haven't been logged or dismissed this month.
 */
export function dueReminders(rows: Recurring[], now = new Date()): Reminder[] {
  const key = monthKeyOf(now);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return rows
    .filter((r) => r.active && r.last_posted_month !== key && r.dismissed_month !== key)
    .map((r) => {
      const day = r.due_day || r.day_of_month;
      const due = new Date(now.getFullYear(), now.getMonth(), day);
      const daysUntil = Math.round((due.getTime() - today.getTime()) / 86_400_000);
      return {
        row: r,
        dueOn: `${key}-${String(day).padStart(2, "0")}`,
        daysUntil,
        overdue: daysUntil < 0,
      };
    })
    .filter((r) => r.daysUntil <= (r.row.remind_days_before ?? 3))
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function reminderLabel(r: Reminder): string {
  if (r.daysUntil > 1) return `due in ${r.daysUntil} days`;
  if (r.daysUntil === 1) return "due tomorrow";
  if (r.daysUntil === 0) return "due today";
  if (r.daysUntil === -1) return "1 day overdue";
  return `${Math.abs(r.daysUntil)} days overdue`;
}

/** Logs the recurring entry as a real transaction and marks it posted. */
export async function markRecurringPaid(
  r: Reminder,
  userId: string,
  ledgerId: string | null,
): Promise<void> {
  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    ledger_id: ledgerId,
    amount: r.row.amount,
    type: r.row.type,
    category: r.row.category,
    occurred_on: r.dueOn,
    note: r.row.note ?? "Recurring",
    currency: "INR",
  });
  if (error) throw error;

  const { error: updateError } = await supabase
    .from("recurring_entries")
    .update({ last_posted_month: r.dueOn.slice(0, 7) })
    .eq("id", r.row.id);
  if (updateError) throw updateError;
}

/** Hides the reminder for the rest of this month without logging anything. */
export async function dismissReminder(r: Reminder): Promise<void> {
  const { error } = await supabase
    .from("recurring_entries")
    .update({ dismissed_month: r.dueOn.slice(0, 7) })
    .eq("id", r.row.id);
  if (error) throw error;
}
