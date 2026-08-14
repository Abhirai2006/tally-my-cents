import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Tally" },
      {
        name: "description",
        content: "The short terms of use for Tally, a free personal expense and income ledger.",
      },
      { property: "og:title", content: "Terms — Tally" },
      { property: "og:description", content: "Terms of use for Tally." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://tally-abhirai2006.lovable.app/terms" },
    ],
    links: [{ rel: "canonical", href: "https://tally-abhirai2006.lovable.app/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="relative z-10">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
          Tally
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <h1 className="font-display text-4xl sm:text-5xl">Terms</h1>
        <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-muted-foreground">
          <h2 className="font-display text-2xl text-foreground">Free, as-is</h2>
          <p>
            Tally is provided free of charge and without warranty of any kind. It is a personal
            record-keeping tool, not financial, tax or investment advice.
          </p>
          <h2 className="font-display text-2xl text-foreground">Your data, your accuracy</h2>
          <p>
            Entries are typed by you. You are responsible for the accuracy of what you record and
            for keeping your own copies of anything important — CSV export is available for every
            month.
          </p>
          <h2 className="font-display text-2xl text-foreground">Shared ledgers</h2>
          <p>
            Anyone holding a valid invite link can join a ledger and add, edit or delete its
            entries. Share links only with people you trust, and revoke them when you're done.
          </p>
          <h2 className="font-display text-2xl text-foreground">Acceptable use</h2>
          <p>
            Don't use Tally for anything unlawful, and don't attempt to access ledgers that aren't
            yours. Accounts doing so may be removed.
          </p>
          <h2 className="font-display text-2xl text-foreground">Availability and changes</h2>
          <p>
            The service may change or be interrupted at any time. These terms may be updated; the
            current version always lives on this page.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
