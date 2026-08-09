import {
  UtensilsCrossed,
  ShoppingBasket,
  Bus,
  ShoppingBag,
  ReceiptText,
  Clapperboard,
  HeartPulse,
  Home,
  GraduationCap,
  Plane,
  Repeat,
  Sparkles,
  HandHeart,
  ShieldCheck,
  CircleDashed,
  Wallet,
  Laptop,
  Briefcase,
  TrendingUp,
  Building2,
  PiggyBank,
  Undo2,
  Award,
  Gift,
  type LucideIcon,
} from "lucide-react";

export type EntryType = "expense" | "income";

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Groceries",
  "Transport",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health & Fitness",
  "Housing & Rent",
  "Education",
  "Travel",
  "Subscriptions",
  "Personal Care",
  "Gifts & Donations",
  "Insurance",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Rental",
  "Interest",
  "Refund",
  "Bonus",
  "Gift",
  "Other",
] as const;

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Food & Dining": UtensilsCrossed,
  Groceries: ShoppingBasket,
  Transport: Bus,
  Shopping: ShoppingBag,
  "Bills & Utilities": ReceiptText,
  Entertainment: Clapperboard,
  "Health & Fitness": HeartPulse,
  "Housing & Rent": Home,
  Education: GraduationCap,
  Travel: Plane,
  Subscriptions: Repeat,
  "Personal Care": Sparkles,
  "Gifts & Donations": HandHeart,
  Insurance: ShieldCheck,
  Salary: Wallet,
  Freelance: Laptop,
  Business: Briefcase,
  Investment: TrendingUp,
  Rental: Building2,
  Interest: PiggyBank,
  Refund: Undo2,
  Bonus: Award,
  Gift: Gift,
  Other: CircleDashed,
};

export function categoriesFor(type: EntryType): readonly string[] {
  return type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
}

export function iconFor(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? CircleDashed;
}

const CHART_TOKENS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

export function colorForCategory(category: string): string {
  const index = EXPENSE_CATEGORIES.indexOf(
    category as (typeof EXPENSE_CATEGORIES)[number],
  );
  const safe = index >= 0 ? index : category.length;
  return CHART_TOKENS[safe % CHART_TOKENS.length]!;
}
