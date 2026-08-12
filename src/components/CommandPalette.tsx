import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CalendarRange, ChevronLeft, ChevronRight, Download, Moon, Plus, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function CommandPalette({
  open,
  onOpenChange,
  onAddEntry,
  onShiftMonth,
  onExport,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAddEntry: () => void;
  onShiftMonth: (delta: number) => void;
  onExport: () => void;
}) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const run = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Add an entry, jump a month, export…" />
      <CommandList>
        <CommandEmpty>Nothing matches that.</CommandEmpty>
        <CommandGroup heading="Ledger">
          <CommandItem onSelect={() => run(onAddEntry)}>
            <Plus className="mr-2 h-4 w-4" /> Add entry
          </CommandItem>
          <CommandItem onSelect={() => run(() => onShiftMonth(-1))}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous month
          </CommandItem>
          <CommandItem onSelect={() => run(() => onShiftMonth(1))}>
            <ChevronRight className="mr-2 h-4 w-4" /> Next month
          </CommandItem>
          <CommandItem onSelect={() => run(onExport)}>
            <Download className="mr-2 h-4 w-4" /> Export this month as CSV
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Go">
          <CommandItem onSelect={() => run(() => void navigate({ to: "/year" }))}>
            <CalendarRange className="mr-2 h-4 w-4" /> Year in review
          </CommandItem>
          <CommandItem onSelect={() => run(toggle)}>
            {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            Switch to {theme === "dark" ? "light" : "dark"} theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
