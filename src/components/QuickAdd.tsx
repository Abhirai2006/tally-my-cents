import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Sparkles, CornerDownLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { parseQuickEntry } from "@/lib/quickadd";
import { formatMoney } from "@/lib/tally";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EXAMPLES = ["chai 40", "groceries 1250", "+salary 68000", "netflix 199"];

export function QuickAdd({
  userId,
  ledgerId,
  onSaved,
}: {
  userId: string;
  ledgerId: string | null;
  onSaved: () => void;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const parsed = parseQuickEntry(value);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed) {
      toast.error("Try something like “chai 40” — a word and an amount.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      ledger_id: ledgerId,
      amount: parsed.amount,
      type: parsed.type,
      category: parsed.category,
      occurred_on: new Date().toISOString().slice(0, 10),
      note: parsed.note || null,
      currency: "INR",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${parsed.category} · ${formatMoney(parsed.amount, parsed.type)}`);
    setValue("");
    onSaved();
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-dashed border-border bg-card/60 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="ml-1 h-4 w-4 shrink-0 text-gold" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Quick add — type “chai 40”"
          className="money border-0 bg-transparent shadow-none focus-visible:ring-0"
          aria-label="Quick add entry"
        />
        <Button type="submit" size="sm" disabled={busy} className="gap-1.5">
          <CornerDownLeft className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {parsed ? (
          <motion.p
            key="preview"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 pl-7 text-xs text-muted-foreground"
          >
            <span
              className="money font-semibold"
              style={{ color: parsed.type === "expense" ? "var(--expense)" : "var(--income)" }}
            >
              {formatMoney(parsed.amount, parsed.type)}
            </span>{" "}
            → {parsed.category}
            {parsed.note ? ` · ${parsed.note}` : ""} · today
          </motion.p>
        ) : (
          <motion.div
            key="hints"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex flex-wrap gap-1.5 pl-7"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
