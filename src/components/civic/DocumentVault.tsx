import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Eye, FileLock2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { DOC_TYPES, labelFor } from "@/lib/civic";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Chip } from "./ui";

type Doc = Tables<"client_documents">;

function expiryState(d: string | null) {
  if (!d) return null;
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  if (days < 0) return { tone: "expired" as const, text: `Expired ${-days}d ago` };
  if (days <= 60) return { tone: "soon" as const, text: `Expires in ${days}d` };
  return { tone: "ok" as const, text: `Valid until ${new Date(d).toLocaleDateString()}` };
}

export function DocumentVault() {
  const { session } = useSession();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [alias, setAlias] = useState("");
  const [type, setType] = useState("id");
  const [expires, setExpires] = useState("");
  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("client_documents").select("*").order("created_at", { ascending: false });
    setDocs(data ?? []);
  }, []);
  useEffect(() => void load(), [load]);

  async function upload() {
    if (!file || !session) return;
    setBusy(true);
    const path = `${alias.trim().replace(/[^\w-]/g, "_")}/${type}-${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const up = await supabase.storage.from("client-documents").upload(path, file);
    if (up.error) {
      setBusy(false);
      { toast.error(up.error.message); return; }
    }
    const { error } = await supabase.from("client_documents").insert({
      client_alias: alias.trim(),
      doc_type: type,
      storage_path: path,
      consent_verified: consent,
      expires_on: expires || null,
      uploaded_by: session.user.id,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Document stored securely");
    setAlias(""); setFile(null); setExpires(""); setConsent(false);
    void load();
  }

  async function view(d: Doc) {
    const { data, error } = await supabase.storage.from("client-documents").createSignedUrl(d.storage_path, 60);
    if (error || !data) { toast.error("Couldn't open document"); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  const alerts = docs.filter((d) => ["expired", "soon"].includes(expiryState(d.expires_on)?.tone ?? ""));

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Document vault</h2>
      <p className="text-sm text-muted-foreground">Private, staff-only storage for client vital records. Links expire after 60 seconds.</p>

      {alerts.length > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-soft px-4 py-3 text-sm font-medium text-amber-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {alerts.length} document{alerts.length > 1 ? "s" : ""} expired or expiring within 60 days.
        </div>
      )}

      <div className="mt-5 grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="grid gap-2">
          <Label htmlFor="alias">Client alias</Label>
          <Input id="alias" className="h-12" placeholder="e.g. RiverPark-JM" value={alias} onChange={(e) => setAlias(e.target.value)} maxLength={60} />
        </div>
        <div className="flex flex-wrap gap-2">
          {DOC_TYPES.map((t) => <Chip key={t.id} selected={type === t.id} onClick={() => setType(t.id)}>{t.label}</Chip>)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="exp">Expiration date (optional)</Label>
            <Input id="exp" type="date" className="h-12" value={expires} onChange={(e) => setExpires(e.target.value)} />
          </div>
          <label className="flex min-h-12 cursor-pointer items-center gap-2 self-end rounded-xl border border-dashed border-input px-4 text-sm font-medium hover:bg-muted">
            <Upload className="size-4" /> <span className="truncate">{file ? file.name : "Choose file or take photo"}</span>
            <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <label className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3">
          <span className="text-sm font-medium">Client gave informed consent to store this record</span>
          <Switch checked={consent} onCheckedChange={setConsent} />
        </label>
        <Button className="h-12" disabled={busy || !file || !consent || alias.trim().length < 2} onClick={upload}>
          {busy ? <Loader2 className="animate-spin" /> : <FileLock2 />} Upload to vault
        </Button>
      </div>

      <ul className="mt-6 grid gap-2">
        {docs.map((d) => {
          const ex = expiryState(d.expires_on);
          return (
            <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <div className="min-w-0">
                <div className="font-semibold">{d.client_alias}</div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {labelFor(DOC_TYPES, d.doc_type)}
                  {d.consent_verified && <Badge variant="secondary">Consent ✓</Badge>}
                  {ex && <Badge className={ex.tone === "ok" ? "bg-teal-soft text-accent-foreground" : "bg-amber text-amber-foreground"}>{ex.text}</Badge>}
                </div>
              </div>
              <Button variant="outline" size="icon" className="size-12 shrink-0" onClick={() => view(d)} aria-label="View document"><Eye /></Button>
            </li>
          );
        })}
        {docs.length === 0 && <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No documents yet.</li>}
      </ul>
    </div>
  );
}
