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
  active: boolean;
  last_posted_month: string | null;
  created_at: string;
  updated_at: string;
};

const monthKeyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/**
 * Posts every active recurring entry that is due this month and hasn't been
 * posted yet. Returns how many entries were created.
 */
export async function postDueRecurring(rows: Recurring[], userId: string): Promise<number> {
  const today = new Date();
  const key = monthKeyOf(today);

  const due = rows.filter(
    (r) => r.active && r.last_posted_month !== key && today.getDate() >= r.day_of_month,
  );
  if (!due.length) return 0;

  const inserts = due.map((r) => ({
    user_id: userId,
    amount: r.amount,
    type: r.type,
    category: r.category,
    occurred_on: `${key}-${String(r.day_of_month).padStart(2, "0")}`,
    note: r.note ?? "Recurring",
    currency: "INR",
  }));

  const { error } = await supabase.from("transactions").insert(inserts);
  if (error) throw error;

  await supabase
    .from("recurring_entries")
    .update({ last_posted_month: key })
    .in(
      "id",
      due.map((r) => r.id),
    );

  return due.length;
}
