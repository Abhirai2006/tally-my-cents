import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to Tally" },
      {
        name: "description",
        content: "Sign in to Tally with Google or email to open your personal expense ledger.",
      },
      { property: "og:title", content: "Sign in to Tally" },
      {
        property: "og:description",
        content: "Open your personal expense and income ledger on any device.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (error) {
      toast.error(error.message);
      return;
    }
      setSent("reset");
      return;
    }
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (error) {
      toast.error(error.message);
      return;
    }
      if (!data.session) {
        setSent("confirm");
        return;
      }
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-5xl px-4 py-5">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
          Tally
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass w-full max-w-sm rounded-xl p-6"
        >
          {sent ? (
            <div className="space-y-3 text-center">
              <span className="stamp inline-block px-3 py-1 text-[10px] font-semibold">
                Check inbox
              </span>
              <h1 className="font-display text-2xl">
                {sent === "confirm" ? "Confirm your email" : "Reset link sent"}
              </h1>
              <p className="text-sm text-muted-foreground">
                We sent a link to <span className="font-medium">{email}</span>. Open it to
                {sent === "confirm" ? " activate your ledger." : " choose a new password."}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSent(null);
                  setMode("signin");
                }}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl">
                {mode === "signup"
                  ? "Open a ledger"
                  : mode === "forgot"
                    ? "Forgot password"
                    : "Welcome back"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "forgot"
                  ? "We'll email you a link to set a new password."
                  : "Your entries, on every device you sign in from."}
              </p>

              {mode !== "forgot" ? (
                <>
                  <Button
                    variant="outline"
                    className="mt-6 w-full gap-2"
                    onClick={google}
                    disabled={busy}
                  >
                    <GoogleMark />
                    Continue with Google
                  </Button>
                  <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    <span className="h-px flex-1 border-t border-dashed border-border" />
                    or
                    <span className="h-px flex-1 border-t border-dashed border-border" />
                  </div>
                </>
              ) : null}

              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <AnimatePresence initial={false}>
                  {mode !== "forgot" ? (
                    <motion.div
                      key="pw"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        minLength={6}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
                <Button type="submit" className="w-full" disabled={busy}>
                  {mode === "signup"
                    ? "Create account"
                    : mode === "forgot"
                      ? "Send reset link"
                      : "Sign in"}
                </Button>
              </form>

              <div className="mt-5 flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                >
                  {mode === "signup" ? "Have an account?" : "Create an account"}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => setMode(mode === "forgot" ? "signin" : "forgot")}
                >
                  {mode === "forgot" ? "Back to sign in" : "Forgot password?"}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.58-5.15 3.58-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.93l-3.86-3c-1.08.72-2.45 1.15-4.08 1.15-3.13 0-5.79-2.11-6.74-4.96H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.26 14.26a7.2 7.2 0 0 1 0-4.52v-3.1H1.27a12 12 0 0 0 0 10.72l3.99-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.64l3.99 3.1C6.21 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}
