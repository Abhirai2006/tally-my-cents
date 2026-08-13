import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Users, ShieldAlert, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { pendingInvite } from "@/lib/ledgers";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/invite/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ledger invitation — Tally" },
      { name: "description", content: "You've been invited to join a shared ledger on Tally." },
      { property: "og:title", content: "Ledger invitation — Tally" },
      { property: "og:description", content: "Join a shared ledger on Tally." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvitePage,
});

type Preview = {
  status: "valid" | "invalid" | "revoked" | "expired";
  ledger_name: string | null;
  owner_is_self: boolean;
  already_member: boolean;
};

const MESSAGES: Record<string, string> = {
  invalid: "This invite link isn't valid. Ask for a fresh one.",
  revoked: "This invite link has been revoked by the ledger owner.",
  expired: "This invite link has expired. Ask for a fresh one.",
};

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    setChecking(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setSignedIn(false);
      setChecking(false);
      return;
    }
    setSignedIn(true);
    const { data, error } = await supabase.rpc("preview_ledger_invite", { _token: token });
    if (error) toast.error(error.message);
    setPreview(((data ?? [])[0] as Preview | undefined) ?? null);
    setChecking(false);
  }, [token]);

  useEffect(() => {
    pendingInvite.set(token);
    void load();
  }, [token, load]);

  const join = async () => {
    setJoining(true);
    const { data, error } = await supabase.rpc("accept_ledger_invite", { _token: token });
    setJoining(false);
    const row = (data ?? [])[0] as { status: string; ledger_name: string | null } | undefined;
    if (error || !row) {
      toast.error(error?.message ?? "Couldn't join that ledger.");
      return;
    }
    if (row.status !== "joined") {
      toast.error(MESSAGES[row.status] ?? "Couldn't join that ledger.");
      void load();
      return;
    }
    pendingInvite.clear();
    toast.success(`You've joined ${row.ledger_name}.`);
    navigate({ to: "/dashboard", replace: true });
  };

  const decline = () => {
    pendingInvite.clear();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
        <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
          Tally
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-xl border border-border bg-card p-6"
        >
          {checking ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking your invitation…
            </p>
          ) : !signedIn ? (
            <>
              <Users className="h-6 w-6 text-primary" />
              <h1 className="mt-3 font-display text-2xl">You've been invited to a shared ledger</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in or create a free Tally account first — we'll bring you straight back here to
                accept.
              </p>
              <Link to="/auth" className="mt-5 block">
                <Button className="w-full">Sign in or sign up</Button>
              </Link>
            </>
          ) : preview && preview.status === "valid" ? (
            <>
              <Users className="h-6 w-6 text-primary" />
              <h1 className="mt-3 font-display text-2xl">
                You've been invited to join{" "}
                <span className="text-primary">{preview.ledger_name}</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {preview.already_member
                  ? "You're already part of this ledger."
                  : "Joining lets you see and add entries in this shared ledger. You can leave at any time."}
              </p>
              <div className="mt-5 flex gap-2">
                <Button className="flex-1" disabled={joining} onClick={() => void join()}>
                  {preview.already_member ? "Open ledger" : "Join ledger"}
                </Button>
                <Button variant="outline" onClick={decline}>
                  Decline
                </Button>
              </div>
            </>
          ) : (
            <>
              <ShieldAlert className="h-6 w-6 text-muted-foreground" />
              <h1 className="mt-3 font-display text-2xl">Invitation unavailable</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {MESSAGES[preview?.status ?? "invalid"]}
              </p>
              <div className="mt-5 flex gap-2">
                <Link to="/dashboard" className="flex-1">
                  <Button className="w-full">Go to my ledger</Button>
                </Link>
                <Button variant="outline" onClick={decline}>
                  Home
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
