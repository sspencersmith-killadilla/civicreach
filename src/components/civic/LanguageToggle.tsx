import { Languages } from "lucide-react";
import type { Lang } from "@/lib/i18n";

export function LanguageToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return <button type="button" onClick={() => setLang(lang === "es" ? "en" : "es")} className="flex min-h-12 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold hover:bg-muted" aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}>
    <Languages className="size-4" />{lang === "es" ? "English" : "Español"}
  </button>;
}
