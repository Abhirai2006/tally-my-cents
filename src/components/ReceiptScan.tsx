import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ScanLine, Loader2 } from "lucide-react";
import { scanReceipt } from "@/lib/receipt.functions";
import { Button } from "@/components/ui/button";

export type ScannedEntry = {
  amount: number;
  category: string;
  occurred_on?: string | null;
  note?: string;
};

/** Reads a photographed bill and hands the parsed entry back for confirmation. */
export function ReceiptScan({ onScanned }: { onScanned: (e: ScannedEntry) => void }) {
  const run = useServerFn(scanReceipt);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handle = async (file: File) => {
    if (file.size > 6_000_000) {
      toast.error("That image is too large — try a smaller photo.");
      return;
    }
    setBusy(true);
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const res = await run({ data: { image } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      onScanned(res.entry);
      toast.success("Receipt read — check the details and save.");
    } catch {
      toast.error("Could not read that receipt.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handle(file);
        }}
      />
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
        <span className="hidden sm:inline">{busy ? "Reading…" : "Scan receipt"}</span>
      </Button>
    </>
  );
}
