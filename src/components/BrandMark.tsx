import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={cn("size-9", className)}>
      <rect width="48" height="48" rx="14" fill="currentColor" />
      <text x="24" y="27" textAnchor="middle" fill="var(--brand-mark-line)" fontFamily="Montserrat, Arial, sans-serif" fontSize="17" fontWeight="800" letterSpacing="-1">CR</text>
      <rect x="15" y="32" width="18" height="3" rx="1.5" fill="var(--teal)" />
    </svg>
  );
}
