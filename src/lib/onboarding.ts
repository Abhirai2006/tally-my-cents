import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Accounts older than this when the profile row is first created are treated as existing users. */
const NEW_ACCOUNT_WINDOW_MS = 30 * 60 * 1000;

/**
 * Decides whether the first-run tour should play. The flag lives on the user's
 * profile row so it follows them across devices; existing accounts are marked
 * as "seen" on first read so they never get the tour retroactively.
 */
export function useOnboarding(userId: string, accountCreatedAt: string | undefined) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("has_seen_onboarding")
        .eq("id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setShow(!data.has_seen_onboarding);
        return;
      }

      const created = accountCreatedAt ? new Date(accountCreatedAt).getTime() : 0;
      const isNewSignup = created > 0 && Date.now() - created < NEW_ACCOUNT_WINDOW_MS;
      await supabase
        .from("profiles")
        .insert({ id: userId, has_seen_onboarding: !isNewSignup });
      if (!cancelled) setShow(isNewSignup);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, accountCreatedAt]);

  const dismiss = () => {
    setShow(false);
    void supabase
      .from("profiles")
      .upsert({ id: userId, has_seen_onboarding: true }, { onConflict: "id" });
  };

  return { show, dismiss };
}
