import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Ledger = {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
  owner_email: string | null;
  owner_name: string | null;
};

const GENERIC_NAMES = ["personal ledger", "my ledger", "shared ledger"];

/**
 * What a ledger should be called in the switcher and panels: the owner's own
 * custom name when they set one, otherwise a name derived from the owner.
 */
export function ledgerDisplayName(ledger: Ledger, viewerId: string): string {
  const custom = ledger.name?.trim();
  const isGeneric = !custom || GENERIC_NAMES.includes(custom.toLowerCase());
  if (!isGeneric) return custom;
  if (ledger.owner_id === viewerId) return "My ledger";
  const base =
    ledger.owner_name?.trim() || (ledger.owner_email ?? "someone").split("@")[0] || "someone";
  return `${base}'s ledger`;
}


export type LedgerMember = {
  user_id: string;
  email: string;
  role: string;
  joined_at: string;
};

export type LedgerInvite = {
  id: string;
  ledger_id: string;
  token: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  revoked: boolean;
};

const STORAGE_KEY = "tally:active-ledger";

export function makeInviteToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function inviteUrl(token: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/invite/${token}`;
}

/**
 * Loads every ledger the signed-in user can reach (their own plus any they
 * joined through an invite link), creating a default personal ledger the very
 * first time. Keeps the chosen ledger in localStorage.
 */
export function useLedgers(userId: string) {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["ledgers", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("ledgers_with_owner");
      if (error) throw error;
      let rows = (data ?? []) as Ledger[];
      if (!rows.length) {
        const { error: rpcError } = await supabase.rpc("ensure_default_ledger");
        if (rpcError) throw rpcError;
        const retry = await supabase.rpc("ledgers_with_owner");
        if (retry.error) throw retry.error;
        rows = (retry.data ?? []) as Ledger[];
      }
      return rows;
    },
  });


  const ledgers = query.data ?? [];

  useEffect(() => {
    if (!ledgers.length) return;
    const stored = typeof window === "undefined" ? null : localStorage.getItem(STORAGE_KEY);
    const valid = stored && ledgers.some((l) => l.id === stored) ? stored : null;
    setActiveId((current) => {
      if (current && ledgers.some((l) => l.id === current)) return current;
      return valid ?? ledgers[0]!.id;
    });
  }, [ledgers]);

  const select = (id: string) => {
    setActiveId(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  };

  const active = ledgers.find((l) => l.id === activeId) ?? null;

  return {
    ledgers,
    active,
    activeId,
    isOwner: active ? active.owner_id === userId : false,
    select,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["ledgers", userId] }),
    isLoading: query.isLoading,
  };
}

const PENDING_KEY = "tally:pending-invite";

/** Remembers an invite token across the sign-in / OAuth round trip. */
export const pendingInvite = {
  set(token: string) {
    if (typeof window !== "undefined") localStorage.setItem(PENDING_KEY, token);
  },
  get(): string | null {
    return typeof window === "undefined" ? null : localStorage.getItem(PENDING_KEY);
  },
  clear() {
    if (typeof window !== "undefined") localStorage.removeItem(PENDING_KEY);
  },
};
