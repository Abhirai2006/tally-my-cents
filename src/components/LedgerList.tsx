import { motion, AnimatePresence } from "motion/react";
import { iconFor } from "@/lib/categories";
import { formatMoney, type Txn } from "@/lib/tally";

export function LedgerList({
  transactions,
  onSelect,
}: {
  transactions: Txn[];
  onSelect: (t: Txn) => void;
}) {
  if (!transactions.length) {
    return (
      <div className="py-14 text-center">
        <p className="font-display text-lg">This page of the ledger is blank.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first entry for this month to get started.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-dashed divide-border">
      <AnimatePresence initial={false}>
        {transactions.map((t, i) => {
          const Icon = iconFor(t.category);
          const isExpense = t.type === "expense";
          return (
            <motion.li
              key={t.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ delay: Math.min(i * 0.025, 0.3), type: "spring", stiffness: 260, damping: 26 }}
            >
              <button
                type="button"
                onClick={() => onSelect(t)}
                className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-accent/40"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md border"
                  style={{
                    borderColor: isExpense
                      ? "color-mix(in oklab, var(--expense) 35%, transparent)"
                      : "color-mix(in oklab, var(--income) 35%, transparent)",
                    color: isExpense ? "var(--expense)" : "var(--income)",
                  }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{t.category}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {new Date(`${t.occurred_on}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                    {t.note ? ` · ${t.note}` : ""}
                  </span>
                </span>
                <span
                  className="money shrink-0 text-sm font-semibold"
                  style={{ color: isExpense ? "var(--expense)" : "var(--income)" }}
                >
                  {formatMoney(Number(t.amount), t.type)}
                </span>
              </button>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
