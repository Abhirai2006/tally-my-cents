import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Tally — a calm ledger, not a finance dashboard" },
      {
        name: "description",
        content:
          "Why Tally exists: a paper-feeling expense and income ledger with no bank linking, no ads and no clutter.",
      },
      { property: "og:title", content: "About Tally" },
      {
        property: "og:description",
        content: "A calm, no-bank-linking alternative to bloated personal finance apps.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://tally-abhirai2006.lovable.app/about" },
    ],
    links: [{ rel: "canonical", href: "https://tally-abhirai2006.lovable.app/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="relative z-10">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
          Tally
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <h1 className="font-display text-4xl sm:text-5xl">About Tally</h1>
        <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-muted-foreground">
          <p>
            Tally is a personal ledger for what you spend and what you earn. Amount, category,
            date, a short note — that's the whole ritual. It totals your month, draws a couple of
            honest charts, and otherwise stays out of the way.
          </p>
          <h2 className="font-display text-2xl text-foreground">Why it exists</h2>
          <p>
            Most money apps want your bank login, then repay you with dashboards, upsells and
            notifications. Tally asks for none of that. Nothing is linked, nothing is scraped, and
            nothing is sold. You write entries down yourself, which takes seconds and keeps you
            honest in a way an automatic feed never does.
          </p>
          <p>
            The design leans on paper rather than fintech: warm parchment, ink-brown text, a
            serif for headings and tabular monospace for every rupee. Numbers should feel written,
            not rendered.
          </p>
          <h2 className="font-display text-2xl text-foreground">What's inside</h2>
          <p>
            Monthly totals and charts, category budgets, savings goals, recurring entries with
            due-date reminders, streaks, quick add with AI-assisted categorisation, CSV export,
            and shared ledgers you can hand to a partner or flatmate through a private invite
            link.
          </p>
          <h2 className="font-display text-2xl text-foreground">Who built it</h2>
          <p>
            Tally is built and maintained by{" "}
            <a
              className="text-primary underline underline-offset-4"
              href="https://github.com/Abhirai2006"
              target="_blank"
              rel="noreferrer noopener"
            >
              Abhirai2006
            </a>
            . It's free, and it stays free.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
