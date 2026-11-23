import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCityBySlug } from "@/lib/cities.functions";
import { HelpRequest } from "@/components/civic/HelpRequest";

export const Route = createFileRoute("/c/$citySlug/help")({
  loader: async ({ params }) => {
    const city = await getCityBySlug({ data: { slug: params.citySlug } });
    if (!city) throw notFound();
    return city;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "City";
    return { meta: [
      { title: `Get help staying housed in ${name} — CivicReach` },
      { name: "description", content: `A four-step rapid diversion request for ${name} residents. No login needed.` },
      { property: "og:title", content: `Get help staying housed — ${name}` },
      { property: "og:description", content: "Request rapid, flexible help to keep or regain housing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ] };
  },
  component: function CityHelpRoute() { return <HelpRequest city={Route.useLoaderData()} />; },
});
