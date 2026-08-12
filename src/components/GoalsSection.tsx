import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sprout, Plus, Trash2, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/tally";
import { GOAL_ACCENTS, daysLeft, goalAccent, goalProgress, type Goal } from "@/lib/goals";
import { celebrate } from "@/lib/celebrate";

/** A jar that fills with liquid to the goal's progress, with two drifting wave crests. */
function Jar({ pct, color }: { pct: number; color: string }) {
  const level = 96 - pct * 78; // y position of the liquid surface inside the jar
  return (
    <svg viewBox="0 0 80 110" className="h-24 w-20 shrink-0" role="presentation">
      <defs>
        <clipPath id={`jar-clip-${color.replace(/\W/g, "")}`}>
          <path d="M16 26 h48 a6 6 0 0 1 6 6 v62 a10 10 0 0 1 -10 10 h-40 a10 10 0 0 1 -10 -10 v-62 a6 6 0 0 1 6 -6 z" />
        </clipPath>
      </defs>

      <g clipPath={`url(#jar-clip-${color.replace(/\W/g, "")})`}>
        <rect x="0" y="0" width="80" height="110" fill="color-mix(in oklab, var(--ink) 5%, transparent)" />
        <motion.g initial={{ y: 30 }} whileInView={{ y: 0 }} viewport={{ once: true }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
          <motion.path
            d={`M-80 ${level} q 20 -6 40 0 t 40 0 t 40 0 t 40 0 t 40 0 V 120 H -80 Z`}
            fill={color}
            opacity={0.85}
            animate={{ x: [0, 80] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          <motion.path
            d={`M-80 ${level + 4} q 20 6 40 0 t 40 0 t 40 0 t 40 0 t 40 0 V 120 H -80 Z`}
            fill={color}
            opacity={0.45}
            animate={{ x: [0, -80] }}
            transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
          />
        </motion.g>
      </g>

      <path
        d="M16 26 h48 a6 6 0 0 1 6 6 v62 a10 10 0 0 1 -10 10 h-40 a10 10 0 0 1 -10 -10 v-62 a6 6 0 0 1 6 -6 z"
        fill="none"
        stroke="color-mix(in oklab, var(--ink) 28%, transparent)"
        strokeWidth="2"
      />
      <rect x="26" y="14" width="28" height="12" rx="4" fill="none" stroke="color-mix(in oklab, var(--ink) 28%, transparent)" strokeWidth="2" />
    </svg>
  );
}

export function GoalsSection({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [accent, setAccent] = useState("moss");
  const [saving, setSaving] = useState(false);

  const { data: goals = [] } = useQuery({
    queryKey: ["goals", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Goal[];
    },
  });

  const totals = useMemo(() => {
    const saved = goals.reduce((s, g) => s + Number(g.saved_amount), 0);
    const target = goals.reduce((s, g) => s + Number(g.target_amount), 0);
    return { saved, target };
  }, [goals]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["goals", userId] });

  const create = async () => {
    const amount = Number(target);
    if (!name.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast.error("Give the goal a name and a target amount.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("savings_goals").insert({
      user_id: userId,
      name: name.trim(),
      target_amount: amount,
      accent,
      deadline: deadline || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOpen(false);
    setName("");
    setTarget("");
    setDeadline("");
    toast.success("Goal added");
    refresh();
  };

  const addToGoal = async (g: Goal, delta: number) => {
    const next = Math.max(0, Number(g.saved_amount) + delta);
    const { error } = await supabase
      .from("savings_goals")
      .update({ saved_amount: next })
      .eq("id", g.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (next >= Number(g.target_amount) && Number(g.saved_amount) < Number(g.target_amount)) {
      celebrate();
      toast.success(`${g.name} is fully funded!`);
    }
    refresh();
  };

  const remove = async (g: Goal) => {
    const { error } = await supabase.from("savings_goals").delete().eq("id", g.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
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
          <Sprout className="h-4 w-4 text-primary" />
          Savings jars
        </h2>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          New jar
        </Button>
      </div>

      {goals.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No jars yet. Start one for a trip, a gadget or an emergency fund.
        </p>
      ) : (
        <>
          <p className="money pt-4 text-xs text-muted-foreground">
            {formatMoney(totals.saved)} saved of {formatMoney(totals.target)}
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {goals.map((g) => {
                const pct = goalProgress(g);
                const color = goalAccent(g.accent);
                const left = daysLeft(g.deadline);
                return (
                  <motion.li
                    key={g.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background/50 p-3"
                  >
                    <Jar pct={pct} color={color} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-medium">{g.name}</p>
                        <button
                          type="button"
                          onClick={() => void remove(g)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                          aria-label={`Delete ${g.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="money mt-1 text-sm font-semibold" style={{ color }}>
                        {formatMoney(Number(g.saved_amount))}
                        <span className="text-muted-foreground"> / {formatMoney(Number(g.target_amount))}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {Math.round(pct * 100)}% there
                        {left !== null ? ` · ${left >= 0 ? `${left} days left` : "past deadline"}` : ""}
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        {[500, 1000, 5000].map((amt) => (
                          <Button
                            key={amt}
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => void addToGoal(g, amt)}
                          >
                            <Coins className="mr-1 h-3 w-3" />₹{amt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">New savings jar</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="goal-name">Name</Label>
              <Input
                id="goal-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Goa trip"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="goal-target">Target ₹</Label>
                <Input
                  id="goal-target"
                  inputMode="decimal"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="25000"
                  className="money"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goal-deadline">By (optional)</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Colour</Label>
              <div className="flex gap-2">
                {Object.entries(GOAL_ACCENTS).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAccent(key)}
                    aria-label={key}
                    className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      background: value,
                      borderColor: accent === key ? "var(--foreground)" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={() => void create()} disabled={saving}>
              {saving ? "Saving…" : "Create jar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
}
