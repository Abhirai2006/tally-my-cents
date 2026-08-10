import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, useMotionValue, useSpring, useScroll, useTransform } from "motion/react";
import { ArrowRight, NotebookPen, PieChart, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserCount } from "@/components/UserCount";
import { RupeeNote3D } from "@/components/RupeeNote3D";

import heroVideo from "@/assets/hero-ledger.mp4.asset.json";
import heroPoster from "@/assets/hero-poster.jpg";



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

const ease = [0.22, 1, 0.36, 1] as const;

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease },
};

const TICKER = [
  "groceries",
  "chai runs",
  "rent",
  "salary",
  "metro card",
  "concert tickets",
  "freelance gig",
  "gym",
  "subscriptions",
  "gifts",
];

function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 70]);
  const heroFade = useTransform(scrollY, [0, 420], [1, 0]);
  const [signedIn, setSignedIn] = useState(false);

  // After Google sign-in the broker lands back here and sets the session —
  // send the user straight into their ledger instead of making them click again.
  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) setSignedIn(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) setSignedIn(true);
      if (event === "SIGNED_IN") navigate({ to: "/dashboard", replace: true });
      if (event === "SIGNED_OUT") setSignedIn(false);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const ctaTo = signedIn ? "/dashboard" : "/auth";


  // Pointer-driven 3D tilt on the receipt card
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [10, -10]), {
    stiffness: 140,
    damping: 14,
  });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-12, 12]), {
    stiffness: 140,
    damping: 14,
  });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div className="relative z-10 overflow-x-clip">
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease }}
        className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5"
      >
        <span className="font-display text-2xl font-semibold tracking-tight">Tally</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to={ctaTo}
            className="rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:bg-accent"
          >
            {signedIn ? "Open ledger" : "Sign in"}
          </Link>

        </div>
      </motion.header>

      <section className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:pt-16">
        <motion.div style={{ y: heroY, opacity: heroFade }} ref={heroRef} className="max-w-2xl">
          <motion.span
            initial={{ opacity: 0, rotate: -24, scale: 0.6 }}
            animate={{ opacity: 0.9, rotate: -8, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
            className="stamp inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold"
          >
            <Sparkles className="h-3 w-3" />
            Personal ledger
          </motion.span>

          <h1 className="mt-6 font-display text-4xl leading-[1.02] font-semibold sm:text-7xl">
            {"Every rupee,".split(" ").map((w, i) => (
              <motion.span
                key={w}
                initial={{ opacity: 0, y: 40, rotate: 4 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease }}
                className="mr-3 inline-block"
              >
                {w}
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease }}
              className="ink-gradient inline-block"
            >
              written down.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg"
          >
            Tally is a quiet, paper-feeling ledger for daily spending and income. No bank
            linking, no clutter — just your own entries, neatly totalled and always in sync.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5, ease }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <Link to="/auth">
              <motion.span
                whileHover={{ y: -3, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="shine group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground glow-ring"
              >
                Start your ledger
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.span>
            </Link>
            <span className="money text-sm text-muted-foreground">₹ INR · free · private</span>
          </motion.div>
        </motion.div>

        {/* Cinematic film strip + tilting receipt card */}
        <motion.div
          {...reveal}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="relative mt-16 [perspective:1100px] lg:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease }}
            className="glass relative overflow-hidden rounded-2xl p-1.5"
          >
            <video
              className="h-[240px] w-full rounded-xl bg-secondary object-cover sm:h-[420px]"
              src={heroVideo.url}
              poster={heroPoster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="A fountain pen writing entries in a paper ledger"
            />
            <div className="pointer-events-none absolute inset-1.5 rounded-xl bg-gradient-to-t from-background/70 via-transparent to-transparent" />
            <div className="pointer-events-none absolute bottom-5 left-6 right-6">
              <p className="font-display text-xl sm:text-3xl">
                Slow down. <span className="ink-gradient">Write it down.</span>
              </p>
            </div>
          </motion.div>

          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="glass floaty relative z-10 mt-6 rounded-xl p-5 sm:p-7 lg:absolute lg:-bottom-10 lg:right-6 lg:mt-0 lg:w-[340px]"
          >

            <div className="perforated flex items-baseline justify-between pb-3">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                This month
              </span>
              <span className="money text-sm text-gold">Net +₹18,240.00</span>
            </div>
            <ul className="mt-3 space-y-3" style={{ transform: "translateZ(40px)" }}>
              {[
                ["Groceries", "12 Aug", "−₹2,140.00", "var(--expense)"],
                ["Salary", "01 Aug", "+₹68,000.00", "var(--income)"],
                ["Transport", "09 Aug", "−₹340.00", "var(--expense)"],
              ].map(([label, date, amt, color], i) => (
                <motion.li
                  key={label}
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.1, duration: 0.45, ease }}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {label}
                    <span className="ml-2 text-xs text-muted-foreground">{date}</span>
                  </span>
                  <span className="money font-semibold" style={{ color }}>
                    {amt}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

      </section>

      {/* Marquee ticker */}
      <div className="relative border-y border-dashed border-border py-3">
        <div className="marquee-track gap-8 whitespace-nowrap">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span
              key={i}
              className="money text-sm uppercase tracking-[0.18em] text-muted-foreground"
            >
              {t} <span className="text-gold">✳</span>
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="grid gap-6 sm:grid-cols-3">
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
              whileHover={{ y: -6, rotate: i % 2 ? 1 : -1 }}
              className="rounded-lg border border-dashed border-border bg-card/40 p-5 backdrop-blur-sm"
            >
              <motion.div
                whileHover={{ rotate: 12, scale: 1.15 }}
                transition={{ type: "spring", stiffness: 300, damping: 12 }}
                className="grid h-10 w-10 place-items-center rounded-full bg-accent"
              >
                <f.icon className="h-5 w-5 text-gold" />
              </motion.div>
              <h2 className="mt-4 font-display text-xl">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          {...reveal}
          className="glass mt-16 flex flex-col items-center gap-4 rounded-xl px-6 py-12 text-center"
        >
          <h2 className="font-display text-3xl sm:text-4xl">
            Your money story, <span className="ink-gradient">one line at a time.</span>
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Takes about thirty seconds to set up. Keep it for the rest of the year.
          </p>
          <Link to="/auth">
            <motion.span
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
            >
              Open Tally
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
