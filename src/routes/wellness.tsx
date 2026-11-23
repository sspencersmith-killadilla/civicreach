import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/wellness")({
  beforeLoad: () => { throw redirect({ to: "/c/$citySlug/wellness", params: { citySlug: "demo" }, replace: true }); },
  head: () => ({ meta: [
    { title: "Demo wellness check request — CivicReach" },
    { name: "description", content: "Continue to Demo City’s civilian wellness check request." },
    { property: "og:title", content: "Demo wellness check request — CivicReach" },
    { property: "og:description", content: "Try the compassionate civilian outreach request in Demo City." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => null,
});
