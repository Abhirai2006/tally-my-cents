import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categoriesFor, type EntryType } from "@/lib/categories";
import type { Txn } from "@/lib/tally";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const todayIso = () => new Date().toISOString().slice(0, 10);

export function EntryDialog({
  open,
  onOpenChange,
  editing,
  userId,
  defaultDate,
  ledgerId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Txn | null;
  userId: string;
  defaultDate?: string;
  ledgerId: string | null;
  onSaved: () => void;
}) {
  const [type, setType] = useState<EntryType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food & Dining");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmount(String(Number(editing.amount)));
      setCategory(editing.category);
      setDate(editing.occurred_on);
      setNote(editing.note ?? "");
    } else {
      setType("expense");
      setAmount("");
      setCategory("Food & Dining");
      setDate(defaultDate ?? todayIso());
      setNote("");
    }
  }, [open, editing, defaultDate]);

  const switchType = (next: EntryType) => {
    setType(next);
    setCategory(categoriesFor(next)[0]!);
  };

  const save = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter an amount greater than zero.");
      return;
    }
    setBusy(true);
    const fields = {
      amount: value,
      type,
      category,
      occurred_on: date,
      note: note.trim() ? note.trim().slice(0, 200) : null,
    };
    const { error } = editing
      ? // Keep the original author and ledger on edits.
        await supabase.from("transactions").update(fields).eq("id", editing.id)
      : await supabase
          .from("transactions")
          .insert({ ...fields, user_id: userId, ledger_id: ledgerId });

    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Entry updated" : "Entry recorded");
    onOpenChange(false);
    onSaved();
  };

  const remove = async () => {
    if (!editing) return;
    setBusy(true);
    const { error } = await supabase.from("transactions").delete().eq("id", editing.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Entry deleted");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {editing ? "Edit entry" : "New entry"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-secondary/60 p-1">
            {(["expense", "income"] as EntryType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchType(t)}
                className="relative rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors"
                style={
                  type === t
                    ? {
                        background: t === "expense" ? "var(--expense)" : "var(--income)",
                        color: "var(--primary-foreground)",
                      }
                    : undefined
                }
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              className="money text-lg"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoriesFor(type).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              rows={2}
              maxLength={200}
              placeholder="Coffee with Riya"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={busy} className="flex-1">
              {editing ? "Save changes" : "Add entry"}
            </Button>
            {editing ? (
              <Button variant="destructive" onClick={remove} disabled={busy}>
                Delete
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
