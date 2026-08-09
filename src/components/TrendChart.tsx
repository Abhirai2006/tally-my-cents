import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatMoney, type Txn } from "@/lib/tally";

export function TrendChart({ transactions, anchor }: { transactions: Txn[]; anchor: Date }) {
  const data = useMemo(() => {
    const months: { key: string; label: string; expense: number; income: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("en-IN", { month: "short" }),
        expense: 0,
        income: 0,
      });
    }
    for (const t of transactions) {
      const key = t.occurred_on.slice(0, 7);
      const bucket = months.find((m) => m.key === key);
      if (!bucket) continue;
      bucket[t.type] += Number(t.amount);
    }
    return months;
  }, [transactions, anchor]);

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 4" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <Tooltip
            cursor={{ fill: "color-mix(in oklab, var(--ink) 6%, transparent)" }}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number, n: string) => [formatMoney(v), n === "expense" ? "Spent" : "Earned"]}
          />
          <Legend
            iconType="square"
            wrapperStyle={{ fontSize: 11 }}
            formatter={(n) => (n === "expense" ? "Spent" : "Earned")}
          />
          <Bar dataKey="income" fill="var(--income)" radius={[3, 3, 0, 0]} animationDuration={800} />
          <Bar dataKey="expense" fill="var(--expense)" radius={[3, 3, 0, 0]} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
