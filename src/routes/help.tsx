import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/help")({
  beforeLoad: () => { throw redirect({ to: "/c/$citySlug/help", params: { citySlug: "demo" }, replace: true }); },
  head: () => ({ meta: [
    { title: "Demo rapid housing help — CivicReach" },
    { name: "description", content: "Continue to Demo City’s rapid housing diversion request." },
    { property: "og:title", content: "Demo rapid housing help — CivicReach" },
    { property: "og:description", content: "Try the four-step housing help request in Demo City." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => null,
});
