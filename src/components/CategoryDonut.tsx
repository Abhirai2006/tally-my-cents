import { useMemo } from "react";
import { motion } from "motion/react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { colorForCategory } from "@/lib/categories";
import { formatMoney, type Txn } from "@/lib/tally";

export function CategoryDonut({ transactions }: { transactions: Txn[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      map.set(t.category, (map.get(t.category) ?? 0) + Number(t.amount));
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (!data.length) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No expenses recorded this month.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:items-center">
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="none"
              animationDuration={900}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={colorForCategory(d.name)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number, n: string) => [formatMoney(v), n]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Spent
          </span>
          <span className="money text-lg font-semibold text-expense">
            {formatMoney(total)}
          </span>
        </div>
      </div>

      <ul className="space-y-1.5">
        {data.map((d, i) => (
          <motion.li
            key={d.name}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 text-sm"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ background: colorForCategory(d.name) }}
            />
            <span className="min-w-0 flex-1 truncate">{d.name}</span>
            <span className="money shrink-0 tabular-nums">{formatMoney(d.value)}</span>
            <span className="money w-12 shrink-0 text-right text-xs text-muted-foreground">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
