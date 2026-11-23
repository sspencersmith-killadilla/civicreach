import { createFileRoute, notFound } from "@tanstack/react-router";
import { getCityBySlug } from "@/lib/cities.functions";
import { WellnessRequest } from "@/components/civic/WellnessRequest";

export const Route = createFileRoute("/c/$citySlug/wellness")({
  loader: async ({ params }) => {
    const city = await getCityBySlug({ data: { slug: params.citySlug } });
    if (!city) throw notFound();
    return city;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.name ?? "City";
    return { meta: [
      { title: `Request a wellness check in ${name} — CivicReach` },
      { name: "description", content: `Send a ${name} civilian outreach team to check on someone outside. Drop a pin, pick needs, and add a photo.` },
      { property: "og:title", content: `Request a compassionate wellness check — ${name}` },
      { property: "og:description", content: "Civilian outreach instead of police for people in need outdoors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ] };
  },
  component: function CityWellnessRoute() { return <WellnessRequest city={Route.useLoaderData()} />; },
});
