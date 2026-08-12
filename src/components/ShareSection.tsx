import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Plus, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney, type Txn } from "@/lib/tally";

type Share = {
  id: string;
  owner_id: string;
  member_email: string;
  label: string | null;
  created_at: string;
};

export function ShareSection({
  userId,
  userEmail,
  start,
  end,
}: {
  userId: string;
  userEmail: string;
  start: string;
  end: string;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: shares = [] } = useQuery({
    queryKey: ["shares", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("ledger_shares").select("*");
      if (error) throw error;
      return (data ?? []) as Share[];
    },
  });

  const mine = shares.filter((s) => s.owner_id === userId);
  const sharedWithMe = shares.filter(
    (s) => s.owner_id !== userId && s.member_email.toLowerCase() === userEmail.toLowerCase(),
  );

  // Rows visible to me that belong to somebody else = the shared ledgers.
  const { data: guestRows = [] } = useQuery({
    queryKey: ["shared-txns", userId, start, end],
    enabled: sharedWithMe.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .neq("user_id", userId)
        .gte("occurred_on", start)
        .lte("occurred_on", end);
      if (error) throw error;
      return (data ?? []) as Txn[];
    },
  });

  const invite = async () => {
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (clean === userEmail.toLowerCase()) {
      toast.error("That's your own ledger.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("ledger_shares")
      .insert({ owner_id: userId, member_email: clean });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Already shared with them." : error.message);
      return;
    }
    setEmail("");
    toast.success(`${clean} can now view your ledger`);
    queryClient.invalidateQueries({ queryKey: ["shares", userId] });
  };

  const revoke = async (s: Share) => {
    const { error } = await supabase.from("ledger_shares").delete().eq("id", s.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["shares", userId] });
  };

  const guestTotals = guestRows.reduce(
    (acc, t) => {
      if (t.type === "expense") acc.spent += Number(t.amount);
      else acc.earned += Number(t.amount);
      return acc;
    },
    { spent: 0, earned: 0 },
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="rounded-lg border border-border bg-card p-5"
    >
      <div className="perforated flex items-baseline justify-between pb-3">
        <h2 className="flex items-center gap-2 font-display text-lg">
          <Users className="h-4 w-4 text-primary" />
          Shared ledger
        </h2>
        <span className="text-xs text-muted-foreground">
          {mine.length} {mine.length === 1 ? "person" : "people"}
        </span>
      </div>

      <div className="flex gap-2 pt-4">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void invite();
          }}
          placeholder="partner@email.com"
          type="email"
          aria-label="Invite by email"
        />
        <Button onClick={() => void invite()} disabled={busy} className="shrink-0 gap-1.5">
          <Plus className="h-4 w-4" />
          Invite
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        They'll see your entries read-only when they sign in with that email. Nobody can edit your
        ledger but you.
      </p>

      {mine.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          <AnimatePresence initial={false}>
            {mine.map((s) => (
              <motion.li
                key={s.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <span className="truncate text-sm">{s.member_email}</span>
                <button
                  type="button"
                  onClick={() => void revoke(s)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={`Revoke ${s.member_email}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {sharedWithMe.length > 0 && (
        <div className="mt-4 rounded-md border border-dashed border-border p-3">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            Shared with you
          </p>
          <p className="mt-2 text-sm">
            {sharedWithMe.length} {sharedWithMe.length === 1 ? "ledger" : "ledgers"} · this month
          </p>
          <div className="money mt-1 flex gap-4 text-sm font-semibold">
            <span style={{ color: "var(--expense)" }}>{formatMoney(guestTotals.spent, "expense")}</span>
            <span style={{ color: "var(--income)" }}>{formatMoney(guestTotals.earned, "income")}</span>
          </div>
        </div>
      )}
    </motion.section>
  );
}
