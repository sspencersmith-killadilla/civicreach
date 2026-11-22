import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChoiceButton({ selected, onClick, children, multi }: { selected: boolean; onClick: () => void; children: ReactNode; multi?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left text-base font-medium transition-colors",
        selected ? "border-teal bg-teal-soft text-foreground" : "border-border bg-card hover:border-primary/30",
      )}
    >
      <span>{children}</span>
      <span className={cn("grid size-6 shrink-0 place-items-center border-2", multi ? "rounded-md" : "rounded-full", selected ? "border-teal bg-teal text-teal-foreground" : "border-input")}>
        {selected && <Check className="size-4" />}
      </span>
    </button>
  );
}

export function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "min-h-12 rounded-full border-2 px-4 text-sm font-semibold transition-colors",
        selected ? "border-teal bg-teal text-teal-foreground" : "border-border bg-card hover:border-teal/50",
      )}
    >
      {children}
    </button>
  );
}

export function TrackingCode({ code }: { code: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-teal bg-teal-soft p-5 text-center">
      <div className="text-xs font-semibold uppercase tracking-widest text-accent-foreground">Your tracking code</div>
      <div className="mt-1 font-mono text-4xl font-semibold tracking-[0.3em]">{code}</div>
      <div className="mt-2 text-sm text-muted-foreground">Write this down or take a screenshot.</div>
    </div>
  );
}
