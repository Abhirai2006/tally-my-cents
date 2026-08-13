import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Link2, Copy, Check, RotateCw, X, UserMinus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  inviteUrl,
  makeInviteToken,
  type Ledger,
  type LedgerInvite,
  type LedgerMember,
} from "@/lib/ledgers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LedgerPanel({
  ledger,
  userId,
  isOwner,
  onMembershipChange,
}: {
  ledger: Ledger | null;
  userId: string;
  isOwner: boolean;
  onMembershipChange: () => void;
}) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const ledgerId = ledger?.id ?? null;

  const { data: members = [] } = useQuery({
    queryKey: ["ledger-members", ledgerId],
    enabled: !!ledgerId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ledger_member_list", { _ledger: ledgerId! });
      if (error) throw error;
      return (data ?? []) as LedgerMember[];
    },
  });

  const { data: invite = null } = useQuery({
    queryKey: ["ledger-invite", ledgerId],
    enabled: !!ledgerId && isOwner,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ledger_invites")
        .select("*")
        .eq("ledger_id", ledgerId!)
        .eq("revoked", false)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return ((data ?? [])[0] as LedgerInvite | undefined) ?? null;
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ledger-invite", ledgerId] });
    queryClient.invalidateQueries({ queryKey: ["ledger-members", ledgerId] });
  };

  const createInvite = async () => {
    if (!ledgerId) return;
    setBusy(true);
    // A fresh link supersedes any older one.
    await supabase.from("ledger_invites").update({ revoked: true }).eq("ledger_id", ledgerId);
    const { error } = await supabase.from("ledger_invites").insert({
      ledger_id: ledgerId,
      token: makeInviteToken(),
      created_by: userId,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Invite link ready — share it however you like.");
    refresh();
  };

  const revokeInvite = async () => {
    if (!invite) return;
    const { error } = await supabase
      .from("ledger_invites")
      .update({ revoked: true })
      .eq("id", invite.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Link revoked. It no longer works.");
    refresh();
  };

  const copy = async () => {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(inviteUrl(invite.token));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy — select the link and copy it manually.");
    }
  };

  const removeMember = async (m: LedgerMember) => {
    if (!ledgerId) return;
    const { error } = await supabase
      .from("ledger_members")
      .delete()
      .eq("ledger_id", ledgerId)
      .eq("user_id", m.user_id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${m.email} removed`);
    refresh();
    onMembershipChange();
  };

  const leave = async () => {
    if (!ledgerId) return;
    const { error } = await supabase
      .from("ledger_members")
      .delete()
      .eq("ledger_id", ledgerId)
      .eq("user_id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("You left this ledger.");
    onMembershipChange();
  };

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
          Shared with
        </h2>
        <span className="text-xs text-muted-foreground">
          {members.length} {members.length === 1 ? "person" : "people"}
        </span>
      </div>

      <ul className="divide-y divide-dashed divide-border pt-2">
        {members.map((m) => (
          <li key={m.user_id} className="flex items-center gap-3 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-xs uppercase">
              {m.email.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{m.email}</p>
              <p className="text-[11px] capitalize text-muted-foreground">
                {m.role}
                {m.user_id === userId ? " · you" : ""}
              </p>
            </div>
            {isOwner && m.user_id !== userId ? (
              <button
                type="button"
                onClick={() => void removeMember(m)}
                aria-label={`Remove ${m.email}`}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <UserMinus className="h-4 w-4" />
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {isOwner ? (
        <div className="mt-4 space-y-3">
          <AnimatePresence mode="wait">
            {invite ? (
              <motion.div
                key="link"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={inviteUrl(invite.token)}
                    onFocus={(e) => e.currentTarget.select()}
                    className="money text-xs"
                    aria-label="Invite link"
                  />
                  <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={() => void copy()}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy link"}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5"
                    disabled={busy}
                    onClick={() => void createInvite()}
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    New link
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => void revokeInvite()}>
                    <X className="h-3.5 w-3.5" />
                    Revoke
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Anyone with this link can join and edit this ledger. Revoke it when you're done.
                </p>
              </motion.div>
            ) : (
              <motion.div key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={busy}
                  onClick={() => void createInvite()}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Invite to this ledger
                </Button>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Creates a private link you can send through WhatsApp, email or SMS.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mt-4">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => void leave()}>
            <X className="h-3.5 w-3.5" />
            Leave this ledger
          </Button>
        </div>
      )}
    </motion.section>
  );
}
