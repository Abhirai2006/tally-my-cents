import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, CornerDownLeft } from "lucide-react";

import { parseQuickEntry } from "@/lib/quickadd";
import { formatMoney } from "@/lib/tally";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EXAMPLES = ["chai 40", "groceries 1250", "+salary 68000", "auto 120"];

type MockEntry = {
  id: number;
  amount: number;
  type: "expense" | "income";
  category: string;
  note: string;
  date: string;
};

const today = () =>
  new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

/**
 * A no-signup taste of quick add. Everything here is client-side and thrown
 * away on reload — nothing touches the database.
 */
export function TryQuickAdd() {
  const [value, setValue] = useState("");
  const [entries, setEntries] = useState<MockEntry[]>([]);
  const [shake, setShake] = useState(false);
  const parsed = parseQuickEntry(value);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed) {
      setShake(true);
      window.setTimeout(() => setShake(false), 400);
      return;
    }
    setEntries((prev) =>
      [
        {
          id: Date.now(),
          amount: parsed.amount,
          type: parsed.type,
          category: parsed.category,
          note: parsed.note ?? "",
          date: today(),
        },
        ...prev,
      ].slice(0, 4),
    );
    setValue("");
  };

  return (
    <div className="glass rounded-2xl p-5 sm:p-7">
      <div className="perforated flex items-baseline justify-between pb-3">
        <h3 className="font-display text-lg">Try it — no account needed</h3>
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          nothing is saved
        </span>
      </div>

      <motion.form
        onSubmit={submit}
        animate={shake ? { x: [0, -6, 6, -4, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-4 flex items-center gap-2"
      >
        <Sparkles className="ml-1 h-4 w-4 shrink-0 text-gold" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type “chai 40” and press enter"
          aria-label="Try quick add"
          className="money border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <Button type="submit" size="sm" className="gap-1.5">
          <CornerDownLeft className="h-3.5 w-3.5" />
          File it
        </Button>
      </motion.form>

      <div className="mt-2 flex flex-wrap gap-1.5 pl-7">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setValue(ex)}
            className="money rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent"
          >
            {ex}
          </button>
        ))}
      </div>

      <ul className="mt-5 space-y-3">
        <AnimatePresence initial={false}>
          {entries.map((e) => (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="flex items-center justify-between border-b border-dashed border-border pb-2 text-sm"
            >
              <span className="min-w-0 truncate">
                {e.category}
                {e.note ? <span className="ml-2 text-xs text-muted-foreground">{e.note}</span> : null}
                <span className="ml-2 text-xs text-muted-foreground">{e.date}</span>
              </span>
              <span
                className="money font-semibold"
                style={{ color: e.type === "expense" ? "var(--expense)" : "var(--income)" }}
              >
                {formatMoney(e.amount, e.type)}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
        {entries.length === 0 ? (
          <li className="pt-1 text-sm text-muted-foreground">
            Tally reads the words and the number, picks a category and dates it today.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
