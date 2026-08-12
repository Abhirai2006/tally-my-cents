export type Goal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline: string | null;
  accent: string;
  created_at: string;
  updated_at: string;
};

export const GOAL_ACCENTS: Record<string, string> = {
  moss: "var(--chart-1)",
  ochre: "var(--chart-2)",
  amber: "var(--chart-3)",
  olive: "var(--chart-4)",
  forest: "var(--chart-5)",
};

export function goalAccent(key: string) {
  return GOAL_ACCENTS[key] ?? "var(--chart-1)";
}

export function goalProgress(g: Goal) {
  const target = Number(g.target_amount) || 1;
  return Math.max(0, Math.min(1, Number(g.saved_amount) / target));
}

export function daysLeft(deadline: string | null) {
  if (!deadline) return null;
  const end = new Date(`${deadline}T00:00:00`).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((end - today) / 86_400_000);
}
