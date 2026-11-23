import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Crosshair, Loader2, MapPin, Timer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WELLNESS_NEEDS, makeTrackingCode } from "@/lib/civic";
import type { CitySummary } from "@/lib/cities";
import { Chip, TrackingCode } from "@/components/civic/ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const SLA_MIN = 45;

export function WellnessRequest({ city }: { city: CitySummary }) {
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [needs, setNeeds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ code: string; at: number } | null>(null);

  function pin() {
    if (!navigator.geolocation) { toast.error("Location isn't available on this device"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition((p) => {
      setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
      if (!location) setLocation("Pinned location");
      setLocating(false);
    }, () => { setLocating(false); toast.error("Couldn't get your location — type a landmark instead"); }, { enableHighAccuracy: true, timeout: 10000 });
  }

  async function submit() {
    setBusy(true);
    const code = makeTrackingCode("W");
    let photo_path: string | null = null;
    if (photo) {
      photo_path = `${city.id}/${code}/${Date.now()}-${photo.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("wellness-photos").upload(photo_path, photo);
      if (error) { setBusy(false); toast.error("The photo couldn't be uploaded. Remove it or try again."); return; }
    }
    const { error } = await supabase.from("wellness_checks").insert({
      city_id: city.id,
      tracking_code: code,
      location_text: location.trim(),
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      urgency_tags: needs,
      description: notes.trim() || null,
      photo_path,
    });
    setBusy(false);
    if (error) { toast.error("We couldn't send this request. Please try again."); return; }
    setDone({ code, at: Date.now() });
  }

  if (done) return <Confirmation city={city} code={done.code} at={done.at} />;

  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-8">
      <p className="mb-2 text-sm font-semibold text-teal">{city.name} civilian outreach</p>
      <h1 className="text-3xl font-bold tracking-tight">Request a wellness check</h1>
      <p className="mt-2 text-muted-foreground">A trained civilian outreach team — not police — will check on the person with care.</p>
      <section className="mt-8">
        <h2 className="font-semibold">Where are they?</h2>
        <div className="mt-3 flex gap-2">
          <Input className="h-14 text-base" placeholder="Intersection or landmark" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200} />
          <Button type="button" variant="outline" className="h-14 shrink-0 px-4" onClick={pin} aria-label="Use my location">{locating ? <Loader2 className="animate-spin" /> : <Crosshair />}</Button>
        </div>
        {coords && <div className="mt-3 overflow-hidden rounded-xl border border-border">
          <iframe title="Pinned location" className="h-44 w-full" src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.004},${coords.lat - 0.003},${coords.lng + 0.004},${coords.lat + 0.003}&layer=mapnik&marker=${coords.lat},${coords.lng}`} />
          <div className="flex items-center gap-2 bg-teal-soft px-3 py-2 text-sm"><MapPin className="size-4 text-teal" /> Pin dropped at {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</div>
        </div>}
      </section>
      <section className="mt-8"><h2 className="font-semibold">What did you notice?</h2><div className="mt-3 flex flex-wrap gap-2">
        {WELLNESS_NEEDS.map((n) => <Chip key={n.id} selected={needs.includes(n.id)} onClick={() => setNeeds((s) => s.includes(n.id) ? s.filter((x) => x !== n.id) : [...s, n.id])}>{n.label}</Chip>)}
      </div></section>
      <section className="mt-8">
        <h2 className="font-semibold">Anything else? <span className="font-normal text-muted-foreground">(optional)</span></h2>
        <Textarea className="mt-3 min-h-28 text-base" placeholder="What they're wearing, what they need, how long they've been there…" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} />
        <label className="mt-3 flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input px-4 text-sm font-medium hover:bg-muted">
          <Camera className="size-4" /> {photo ? photo.name : "Add a photo of the location"}<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        </label>
      </section>
      <Button className="mt-8 h-14 w-full bg-teal text-base text-teal-foreground hover:bg-teal/90" disabled={busy || location.trim().length < 3 || needs.length === 0} onClick={submit}>{busy && <Loader2 className="animate-spin" />} Send outreach team</Button>
      <p className="mt-3 text-center text-sm text-muted-foreground">If someone is in immediate danger, call 911.</p>
    </main>
  );
}

function Confirmation({ city, code, at }: { city: CitySummary; code: string; at: number }) {
  const [now, setNow] = useState(at);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const left = Math.max(0, SLA_MIN * 60 - Math.floor((now - at) / 1000));
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");
  return <main className="mx-auto max-w-xl px-4 pb-16 pt-8">
    <h1 className="text-3xl font-bold tracking-tight">Request received</h1>
    <p className="mt-2 text-muted-foreground">Thank you for caring about your neighbor. {city.name}’s outreach queue has been notified. The countdown is a target, not a guaranteed arrival time.</p>
    <div className="mt-6 rounded-2xl bg-primary p-6 text-center text-primary-foreground">
      <div className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-widest opacity-80"><Timer className="size-4" /> Target response window</div>
      <div className="mt-2 font-mono text-5xl font-semibold tabular-nums">{mm}:{ss}</div><div className="mt-1 text-sm opacity-80">Target response: within {SLA_MIN} minutes</div>
    </div>
    <div className="mt-4"><TrackingCode code={code} /></div>
    <Link to="/c/$citySlug" params={{ citySlug: city.slug }} className="mt-6 flex min-h-12 items-center justify-center rounded-xl border border-border font-semibold hover:bg-muted">Back to {city.name}</Link>
  </main>;
}
