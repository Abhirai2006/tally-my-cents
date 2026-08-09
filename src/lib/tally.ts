export type Txn = {
  id: string;
  user_id: string;
  amount: number;
  type: "expense" | "income";
  category: string;
  occurred_on: string;
  note: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
};

export function formatMoney(amount: number, withSign?: "expense" | "income") {
  const body = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  const sign = withSign === "expense" ? "−" : withSign === "income" ? "+" : "";
  return `${sign}₹${body}`;
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const iso = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return { start: iso(start), end: iso(end) };
}

export function monthLabel(d: Date) {
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function toCsv(rows: Txn[], label: string) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ["Date", "Type", "Category", "Note", "Amount (INR)"];
  const body = rows.map((r) =>
    [
      r.occurred_on,
      r.type,
      r.category,
      r.note ?? "",
      (r.type === "expense" ? -r.amount : r.amount).toFixed(2),
    ]
      .map((c) => esc(String(c)))
      .join(","),
  );
  const csv = [header.join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tally-${label.toLowerCase().replace(/\s+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
