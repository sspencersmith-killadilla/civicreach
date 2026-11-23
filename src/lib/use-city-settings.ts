import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mergeSettings, type CitySettings } from "./city-settings";

/** Staff view: full settings for the signed-in user's city. */
export function useCitySettings(cityId: string | null | undefined) {
  const [settings, setSettings] = useState<CitySettings>(() => mergeSettings(null));
  const [goLive, setGoLive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const reload = useCallback(async () => {
    if (!cityId) return;
    const { data } = await supabase.from("city_settings").select("settings, go_live").eq("city_id", cityId).maybeSingle();
    setSettings(mergeSettings(data?.settings)); setGoLive(!!data?.go_live); setLoaded(true);
  }, [cityId]);
  useEffect(() => void reload(), [reload]);
  return { settings, goLive, loaded, reload };
}

/** Resident view: only the public parts of a city's settings. */
export function usePublicCityConfig(slug: string) {
  const [settings, setSettings] = useState<CitySettings>(() => mergeSettings(null));
  const [goLive, setGoLive] = useState(true);
  useEffect(() => {
    let live = true;
    void supabase.rpc("public_city_config", { _slug: slug }).then(({ data }) => {
      if (!live || !data) return;
      const d = data as Record<string, unknown>;
      setSettings(mergeSettings(d)); setGoLive(!!d["go_live"]);
    });
    return () => { live = false; };
  }, [slug]);
  return { settings, goLive };
}
