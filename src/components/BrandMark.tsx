import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={cn("size-9", className)}>
      <defs>
        <linearGradient id="civicreach-mark" x1="8" y1="6" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--primary)" />
          <stop offset="0.58" stopColor="var(--teal)" />
          <stop offset="1" stopColor="var(--brand-green)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="17" fill="url(#civicreach-mark)" />
      <path d="M18 43c0-12 7-21 19-21h9" stroke="var(--primary-foreground)" strokeWidth="5" strokeLinecap="round" />
      <path d="M25 43h21" stroke="var(--primary-foreground)" strokeWidth="5" strokeLinecap="round" opacity="0.72" />
      <circle cx="18" cy="43" r="5" fill="var(--primary-foreground)" />
      <circle cx="46" cy="22" r="5" fill="var(--primary-foreground)" />
    </svg>
  );
}
