import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type EntryType } from "@/lib/categories";

export type ParsedEntry = {
  type: EntryType;
  amount: number;
  category: string;
  note: string;
};

const KEYWORDS: Array<[string, EntryType, string]> = [
  // expense
  ["chai", "expense", "Food & Dining"],
  ["coffee", "expense", "Food & Dining"],
  ["tea", "expense", "Food & Dining"],
  ["lunch", "expense", "Food & Dining"],
  ["dinner", "expense", "Food & Dining"],
  ["breakfast", "expense", "Food & Dining"],
  ["snack", "expense", "Food & Dining"],
  ["food", "expense", "Food & Dining"],
  ["swiggy", "expense", "Food & Dining"],
  ["zomato", "expense", "Food & Dining"],
  ["restaurant", "expense", "Food & Dining"],
  ["grocer", "expense", "Groceries"],
  ["vegetable", "expense", "Groceries"],
  ["milk", "expense", "Groceries"],
  ["bigbasket", "expense", "Groceries"],
  ["blinkit", "expense", "Groceries"],
  ["auto", "expense", "Transport"],
  ["cab", "expense", "Transport"],
  ["uber", "expense", "Transport"],
  ["ola", "expense", "Transport"],
  ["metro", "expense", "Transport"],
  ["bus", "expense", "Transport"],
  ["train", "expense", "Transport"],
  ["petrol", "expense", "Transport"],
  ["fuel", "expense", "Transport"],
  ["shopping", "expense", "Shopping"],
  ["clothes", "expense", "Shopping"],
  ["amazon", "expense", "Shopping"],
  ["flipkart", "expense", "Shopping"],
  ["shoes", "expense", "Shopping"],
  ["bill", "expense", "Bills & Utilities"],
  ["electric", "expense", "Bills & Utilities"],
  ["water", "expense", "Bills & Utilities"],
  ["recharge", "expense", "Bills & Utilities"],
  ["wifi", "expense", "Bills & Utilities"],
  ["internet", "expense", "Bills & Utilities"],
  ["movie", "expense", "Entertainment"],
  ["concert", "expense", "Entertainment"],
  ["game", "expense", "Entertainment"],
  ["gym", "expense", "Health & Fitness"],
  ["medicine", "expense", "Health & Fitness"],
  ["doctor", "expense", "Health & Fitness"],
  ["pharmacy", "expense", "Health & Fitness"],
  ["rent", "expense", "Housing & Rent"],
  ["maintenance", "expense", "Housing & Rent"],
  ["course", "expense", "Education"],
  ["book", "expense", "Education"],
  ["fees", "expense", "Education"],
  ["tuition", "expense", "Education"],
  ["trip", "expense", "Travel"],
  ["flight", "expense", "Travel"],
  ["hotel", "expense", "Travel"],
  ["travel", "expense", "Travel"],
  ["netflix", "expense", "Subscriptions"],
  ["spotify", "expense", "Subscriptions"],
  ["subscription", "expense", "Subscriptions"],
  ["prime", "expense", "Subscriptions"],
  ["salon", "expense", "Personal Care"],
  ["haircut", "expense", "Personal Care"],
  ["gift", "expense", "Gifts & Donations"],
  ["donation", "expense", "Gifts & Donations"],
  ["insurance", "expense", "Insurance"],
  ["premium", "expense", "Insurance"],
  // income
  ["salary", "income", "Salary"],
  ["stipend", "income", "Salary"],
  ["freelance", "income", "Freelance"],
  ["gig", "income", "Freelance"],
  ["client", "income", "Freelance"],
  ["business", "income", "Business"],
  ["dividend", "income", "Investment"],
  ["investment", "income", "Investment"],
  ["rental", "income", "Rental"],
  ["interest", "income", "Interest"],
  ["refund", "income", "Refund"],
  ["cashback", "income", "Refund"],
  ["bonus", "income", "Bonus"],
];

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Parses shorthand like "chai 40", "40 groceries", "+salary 68000",
 * "netflix 199 family plan". Returns null when no amount is present.
 */
export function parseQuickEntry(raw: string): ParsedEntry | null {
  const input = raw.trim();
  if (!input) return null;

  let forced: EntryType | null = null;
  let body = input;
  if (body.startsWith("+")) {
    forced = "income";
    body = body.slice(1);
  } else if (body.startsWith("-")) {
    forced = "expense";
    body = body.slice(1);
  }

  const match = body.match(/(?:^|\s|₹|rs\.?)(\d+(?:[.,]\d+)?)(?=\s|$|\/-)/i);
  if (!match?.[1]) return null;
  const amount = Number(match[1].replace(",", ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const label = (body.slice(0, match.index) + " " + body.slice((match.index ?? 0) + match[0].length))
    .replace(/[₹]|rs\.?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const lower = label.toLowerCase();
  const hit = KEYWORDS.find(([word]) => lower.includes(word));

  let type: EntryType = forced ?? hit?.[1] ?? "expense";
  if (forced && hit && hit[1] !== forced) type = forced;

  let category = hit && hit[1] === type ? hit[2] : "Other";
  const pool: readonly string[] = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const exact = pool.find((c) => c.toLowerCase() === lower);
  if (exact) category = exact;

  return { type, amount, category, note: label ? titleCase(label) : "" };
}
