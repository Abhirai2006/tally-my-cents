import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Tally" },
      {
        name: "description",
        content:
          "What Tally stores, who can see it, and how to delete your account and data. Plain language, no surprises.",
      },
      { property: "og:title", content: "Privacy — Tally" },
      { property: "og:description", content: "What Tally stores and who can see it." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://tally-abhirai2006.lovable.app/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://tally-abhirai2006.lovable.app/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="relative z-10">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
          Tally
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16">
        <h1 className="font-display text-4xl sm:text-5xl">Privacy</h1>
        <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-muted-foreground">
          <h2 className="font-display text-2xl text-foreground">What we store</h2>
          <p>
            Your email address (so you can sign in), and the entries you write: amount, type,
            category, date and an optional note. Budgets, savings goals and recurring entries you
            create are stored the same way. Tally never connects to a bank and never sees a
            statement, card number or balance.
          </p>
          <h2 className="font-display text-2xl text-foreground">Who can see it</h2>
          <p>
            Only you — and anyone you deliberately invite. Every row is protected by database-level
            row security: a ledger is readable only by its owner and the people who opened an
            invite link and explicitly clicked Join. Revoking a link or removing a member cuts off
            access immediately.
          </p>
          <h2 className="font-display text-2xl text-foreground">What we don't do</h2>
          <p>
            Your data is never sold, rented, shared with advertisers or used to train anything. If
            you use quick add's AI categorisation, only the short text you typed is sent for
            classification — no amounts, no history, no identity.
          </p>
          <h2 className="font-display text-2xl text-foreground">Deleting your data</h2>
          <p>
            You can delete any entry from the ledger at any time. To delete your account and
            everything attached to it, email a request from your sign-in address via{" "}
            <a
              className="text-primary underline underline-offset-4"
              href="https://github.com/Abhirai2006"
              target="_blank"
              rel="noreferrer noopener"
            >
              github.com/Abhirai2006
            </a>{" "}
            and it will be removed permanently.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
