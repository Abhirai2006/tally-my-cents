import type { Txn } from "@/lib/tally";

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Consecutive days (ending today or yesterday) with at least one entry. */
export function currentStreak(transactions: Txn[]): number {
  const days = new Set(transactions.map((t) => t.occurred_on));
  if (!days.size) return 0;

  const cursor = new Date();
  if (!days.has(iso(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(iso(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(iso(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function longestStreak(transactions: Txn[]): number {
  const days = [...new Set(transactions.map((t) => t.occurred_on))].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const day of days) {
    const parts = day.split("-").map(Number);
    const d = new Date(parts[0]!, (parts[1] ?? 1) - 1, parts[2] ?? 1);
    if (prev && (d.getTime() - prev.getTime()) / 86_400_000 === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export type Milestone = { id: string; label: string; hit: boolean; hint: string };

export function milestonesFor(streak: number, entryCount: number, surplus: boolean): Milestone[] {
  return [
    { id: "first", label: "First entry", hit: entryCount >= 1, hint: "Log anything" },
    { id: "ten", label: "10 entries", hit: entryCount >= 10, hint: "Keep logging" },
    { id: "week", label: "7-day streak", hit: streak >= 7, hint: "A week in a row" },
    { id: "fortnight", label: "14-day streak", hit: streak >= 14, hint: "Two weeks strong" },
    { id: "surplus", label: "Surplus month", hit: surplus, hint: "Earn more than you spend" },
  ];
}
