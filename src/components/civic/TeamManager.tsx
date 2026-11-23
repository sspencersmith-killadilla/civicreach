import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, Mail, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { inviteStaffMember, listCityTeam } from "@/lib/cities.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Member = Awaited<ReturnType<typeof listCityTeam>>[number];

export function TeamManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [teamZone, setTeamZone] = useState("Central");
  const [role, setRole] = useState<"outreach" | "supervisor">("outreach");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try { setMembers(await listCityTeam()); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't load the team"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setInviteLink("");
    try {
      const result = await inviteStaffMember({ data: { fullName, email: email.trim(), role, teamZone } });
      setInviteLink(result.inviteLink);
      setFullName(""); setEmail("");
      await load();
      toast.success("Invitation created");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't create the invitation"); }
    finally { setBusy(false); }
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return <div>
    <h2 className="text-2xl font-bold tracking-tight">City team</h2>
    <p className="text-sm text-muted-foreground">Only supervisors can create staff invitations. Each invitation grants access to this city only.</p>
    <form onSubmit={invite} className="mt-5 grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 font-semibold"><UserPlus className="size-5 text-teal" /> Invite a staff member</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2"><Label htmlFor="invite-name">Full name</Label><Input id="invite-name" className="h-12" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={120} /></div>
        <div className="grid gap-2"><Label htmlFor="invite-email">Work email</Label><Input id="invite-email" type="email" className="h-12" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="grid gap-2"><Label htmlFor="invite-zone">Team / zone</Label><Input id="invite-zone" className="h-12" value={teamZone} onChange={(e) => setTeamZone(e.target.value)} required maxLength={80} /></div>
        <div className="grid gap-2"><Label htmlFor="invite-role">Access level</Label><select id="invite-role" className="h-12 rounded-md border border-input bg-card px-3 text-sm" value={role} onChange={(e) => setRole(e.target.value as "outreach" | "supervisor")}><option value="outreach">Outreach worker</option><option value="supervisor">Diversion supervisor</option></select></div>
      </div>
      <Button className="h-12" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Mail />} Create invitation link</Button>
      {inviteLink && <div className="rounded-xl bg-teal-soft p-4">
        <p className="text-sm font-semibold text-accent-foreground">Send this private link to the new staff member. It lets them set a password and enter this city’s console.</p>
        <Button type="button" variant="outline" className="mt-3 h-12 w-full" onClick={copyInvite}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy invitation link"}</Button>
      </div>}
    </form>
    <h3 className="mt-8 flex items-center gap-2 font-semibold"><Users className="size-5" /> Active staff</h3>
    {loading ? <Loader2 className="mt-6 animate-spin text-muted-foreground" /> : <ul className="mt-3 grid gap-2">
      {members.map((member) => <li key={member.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div><div className="font-semibold">{member.fullName}</div><div className="text-sm text-muted-foreground">{member.teamZone}</div></div>
        <Badge variant={member.role === "supervisor" ? "default" : "secondary"}>{member.role === "supervisor" ? "Supervisor" : "Outreach"}</Badge>
      </li>)}
    </ul>}
  </div>;
}
