import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** Live-ish count of people keeping a ledger on Tally. */
export function UserCount({ className = "" }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void supabase.rpc("tally_user_count").then(({ data }) => {
      if (cancelled) return;
      setCount(typeof data === "number" ? data : 0);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (count === null) return;
    let raf = 0;
    const start = performance.now();
    const run = (t: number) => {
      const p = Math.min((t - start) / 900, 1);
      setShown(Math.round(count * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [count]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`glass inline-flex items-center gap-3 rounded-full px-4 py-2 ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
          style={{ background: "var(--mesh-2)" }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--mesh-2)" }} />
      </span>
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="money text-sm font-semibold">{count === null ? "—" : shown.toLocaleString("en-IN")}</span>
      <span className="text-xs text-muted-foreground">
        {count === 1 ? "ledger open" : "ledgers open"}
      </span>
    </motion.div>
  );
}
