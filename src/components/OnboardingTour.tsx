import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = { target: string; title: string; body: string };

const STEPS: Step[] = [
  {
    target: '[data-tour="quickadd"]',
    title: "Quick add",
    body: "Type shorthand like “chai 40” or “+salary 68000” and press Add. That's the whole ritual.",
  },
  {
    target: '[data-tour="category-chip"]',
    title: "The category chip",
    body: "Tally guesses the category for you — tap the chip to pick a different one before you save.",
  },
  {
    target: '[data-tour="summary"]',
    title: "Your month at a glance",
    body: "Spent, earned and net balance for the month you're browsing.",
  },
  {
    target: '[data-tour="charts"]',
    title: "Charts",
    body: "Where the money went this month, and how the last six months compare.",
  },
  {
    target: '[data-tour="ledgers"]',
    title: "Shared ledgers",
    body: "Invite a partner or flatmate with a private link, rename your ledger, and switch between ledgers from the header.",
  },
  {
    target: '[data-tour="reminders"]',
    title: "Reminders",
    body: "Recurring bills and EMIs show up here a few days before they're due. Mark them paid in one tap.",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

function rectOf(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function OnboardingTour({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const step = STEPS[index]!;

  const measure = useCallback(() => {
    setRect(rectOf(step.target));
  }, [step.target]);

  useLayoutEffect(() => {
    const el = document.querySelector(step.target);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = setTimeout(measure, 380);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step.target, measure]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDone]);

  if (!mounted) return null;

  const pad = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardWidth = Math.min(320, vw - 24);
  const below = rect ? rect.top + rect.height + 14 : vh / 2;
  const placeAbove = rect ? below + 190 > vh : false;
  const top = rect
    ? placeAbove
      ? Math.max(12, rect.top - 14 - 190)
      : below
    : vh / 2 - 90;
  const left = rect
    ? Math.min(Math.max(12, rect.left + rect.width / 2 - cardWidth / 2), vw - cardWidth - 12)
    : vw / 2 - cardWidth / 2;

  return createPortal(
    <AnimatePresence>
      <div key="tour" className="pointer-events-none fixed inset-0 z-[80]">
        {/* Spotlight ring — the page underneath stays interactive. */}
        {rect ? (
          <motion.div
            initial={false}
            animate={{
              top: rect.top - pad,
              left: rect.left - pad,
              width: rect.width + pad * 2,
              height: rect.height + pad * 2,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="absolute rounded-xl border-2 border-dashed"
            style={{
              borderColor: "var(--primary)",
              boxShadow: "0 0 0 9999px color-mix(in oklab, var(--background) 72%, transparent)",
            }}
          />
        ) : null}

        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, top, left }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          style={{ width: cardWidth, position: "absolute" }}
          className="glass pointer-events-auto rounded-xl border border-border p-4 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Step {index + 1} of {STEPS.length}
              </p>
              <h3 className="mt-1 font-display text-lg">{step.title}</h3>
            </div>
            <button
              type="button"
              onClick={onDone}
              aria-label="Skip tour"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>

          <div className="perforated mt-4 pt-3" />
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={onDone}>
              Skip
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={index === 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={() => (index === STEPS.length - 1 ? onDone() : setIndex((i) => i + 1))}
              >
                {index === STEPS.length - 1 ? "Done" : "Next"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
