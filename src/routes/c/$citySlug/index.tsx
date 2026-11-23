import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCityBySlug } from "@/lib/cities.functions";
import { CityHome } from "@/components/civic/CityHome";

export const Route = createFileRoute("/c/$citySlug/")({
  loader: async ({ params }) => {
    const city = await getCityBySlug({ data: { slug: params.citySlug } });
    if (!city) throw notFound();
    return city;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "City";
    return { meta: [
      { title: `${name} housing & outreach — CivicReach` },
      { name: "description", content: `Request rapid housing help or a civilian wellness check from ${name}. No account needed.` },
      { property: "og:title", content: `${name} — Help is a tap away` },
      { property: "og:description", content: `Housing diversion and compassionate civilian outreach from ${name}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ] };
  },
  component: function CityRoute() { return <CityHome city={Route.useLoaderData()} />; },
});
