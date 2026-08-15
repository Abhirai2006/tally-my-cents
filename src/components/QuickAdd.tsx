import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Sparkles, CornerDownLeft, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { parseQuickEntry } from "@/lib/quickadd";
import { categoriesFor, iconFor } from "@/lib/categories";
import { categorizeEntry } from "@/lib/categorize.functions";
import { formatMoney } from "@/lib/tally";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [classifying, setClassifying] = useState(false);
  /** User's manual pick — wins over both the AI suggestion and the keyword guess. */
  const [override, setOverride] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<string | null>(null);
  const parsed = parseQuickEntry(value);
  const classify = useServerFn(categorizeEntry);

  const pool = useMemo(() => categoriesFor(parsed?.type ?? "expense"), [parsed?.type]);
  const category = override ?? suggested ?? parsed?.category ?? "Other";
  const Icon = iconFor(category);

  // A fresh phrase invalidates any earlier pick or suggestion.
  const noteKey = parsed ? `${parsed.type}|${parsed.note.toLowerCase()}` : "";
  const lastKey = useRef("");
  useEffect(() => {
    if (noteKey === lastKey.current) return;
    lastKey.current = noteKey;
    setOverride(null);
    setSuggested(null);
  }, [noteKey]);

  // Debounced AI categorisation — silently falls back to the keyword guess.
  useEffect(() => {
    if (!parsed || !parsed.note.trim()) return;
    const text = parsed.note;
    const categories = [...categoriesFor(parsed.type)];
    let cancelled = false;
    setClassifying(true);
    const timer = setTimeout(() => {
      void classify({ data: { text, categories } })
        .then((res) => {
          if (cancelled) return;
          if (res?.category) setSuggested(res.category);
        })
        .catch(() => {
          /* keyword fallback already in place */
        })
        .finally(() => {
          if (!cancelled) setClassifying(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      setClassifying(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteKey]);

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
      category,
      occurred_on: new Date().toISOString().slice(0, 10),
      note: parsed.note || null,
      currency: "INR",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${category} · ${formatMoney(parsed.amount, parsed.type)}`);
    setValue("");
    setOverride(null);
    setSuggested(null);
    onSaved();
  };

  return (
    <form
      onSubmit={submit}
      data-tour="quickadd"
      className="rounded-lg border border-dashed border-border bg-card/60 p-3 backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="ml-1 hidden h-4 w-4 shrink-0 text-gold sm:block" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Quick add — type “chai 40”"
          className="money min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
          aria-label="Quick add entry"
        />
        <Button type="submit" size="sm" disabled={busy} className="shrink-0 gap-1.5">
          <CornerDownLeft className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {parsed ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex flex-wrap items-center gap-2 sm:pl-7"
          >
            <span
              className="money text-xs font-semibold"
              style={{ color: parsed.type === "expense" ? "var(--expense)" : "var(--income)" }}
            >
              {formatMoney(parsed.amount, parsed.type)}
            </span>
            <span className="text-xs text-muted-foreground">→</span>

            <div data-tour="category-chip">
              <Select value={category} onValueChange={setOverride}>
                <SelectTrigger
                  className="h-7 gap-1.5 rounded-full border-border bg-background/60 px-3 text-xs"
                  aria-label="Category — tap to change"
                >
                  {classifying ? (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  ) : (
                    <Icon className="h-3 w-3 text-muted-foreground" />
                  )}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pool.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span className="text-xs text-muted-foreground">
              {parsed.note ? `${parsed.note} · ` : ""}today
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="hints"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex flex-wrap gap-1.5 sm:pl-7"
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
