import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, NotebookPen, PieChart, RefreshCw } from "lucide-react";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tally — A calm ledger for what you spend and earn" },
      {
        name: "description",
        content:
          "Log expenses and income in seconds, see where your month went with clear charts, and pick up right where you left off on any device.",
      },
      { property: "og:title", content: "Tally — A calm ledger for what you spend and earn" },
      {
        property: "og:description",
        content:
          "A paper-styled personal expense and income tracker with monthly charts, categories and CSV export.",
      },
    ],
  }),
  component: Landing,
});

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function Landing() {
  return (
    <div className="relative z-10">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <span className="font-display text-2xl font-semibold tracking-tight">Tally</span>
        <Link
          to="/auth"
          className="rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:bg-accent"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-2xl"
        >
          <span className="stamp inline-block px-3 py-1 text-[10px] font-semibold">
            Personal ledger
          </span>
          <h1 className="mt-6 font-display text-4xl leading-[1.05] font-semibold sm:text-6xl">
            Every rupee, written down.
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
            Tally is a quiet, paper-feeling ledger for daily spending and income. No bank
            linking, no clutter — just your own entries, neatly totalled and always in sync.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              to="/auth"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Start your ledger
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <span className="money text-sm text-muted-foreground">₹ INR</span>
          </div>
        </motion.div>

        <motion.div
          {...reveal}
          className="glass mt-16 rounded-xl p-5 sm:p-7"
          whileHover={{ rotateX: -2, rotateY: 2 }}
          style={{ transformPerspective: 900 }}
        >
          <div className="perforated flex items-baseline justify-between pb-3">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              This month
            </span>
            <span className="money text-sm text-gold">Net +₹18,240.00</span>
          </div>
          <ul className="mt-3 space-y-3">
            {[
              ["Groceries", "12 Aug", "−₹2,140.00", "var(--expense)"],
              ["Salary", "01 Aug", "+₹68,000.00", "var(--income)"],
              ["Transport", "09 Aug", "−₹340.00", "var(--expense)"],
            ].map(([label, date, amt, color]) => (
              <li key={label} className="flex items-center justify-between text-sm">
                <span>
                  {label}
                  <span className="ml-2 text-xs text-muted-foreground">{date}</span>
                </span>
                <span className="money font-semibold" style={{ color }}>
                  {amt}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: NotebookPen,
              title: "Log in seconds",
              body: "Amount, category, date, a short note. That's the whole ritual.",
            },
            {
              icon: PieChart,
              title: "See the month",
              body: "Category donut, six-month trend and honest totals for spent, earned and net.",
            },
            {
              icon: RefreshCw,
              title: "Follows you",
              body: "Sign in anywhere and your entries are already there, updating live.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.1 }}
              className="rounded-lg border border-dashed border-border p-5"
            >
              <f.icon className="h-5 w-5 text-gold" />
              <h2 className="mt-4 font-display text-xl">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
