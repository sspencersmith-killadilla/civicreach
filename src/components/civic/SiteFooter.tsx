import { Link, useRouterState } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";

export function SiteFooter() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname.startsWith("/console")) return null;

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BrandMark className="size-8" />
          <div>
            <div className="font-display text-base font-bold tracking-tight text-primary">CivicReach</div>
            <p className="text-xs text-muted-foreground">Every response, in step.</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground" aria-label="Footer">
          <Link to="/for-cities" className="flex min-h-10 items-center hover:text-foreground">For cities</Link>
          <Link to="/guide" className="flex min-h-10 items-center hover:text-foreground">City guide</Link>
          <Link to="/c/$citySlug" params={{ citySlug: "demo" }} className="flex min-h-10 items-center hover:text-foreground">Demo City</Link>
        </nav>
      </div>
    </footer>
  );
}
