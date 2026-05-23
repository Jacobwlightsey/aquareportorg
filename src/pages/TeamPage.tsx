import { useMutation, useQuery } from "convex/react";
import { Crown, MoreHorizontal, ShieldCheck, Sparkles, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { PLAN_TEAM_LIMIT, planLabel, planPrice, type Plan } from "@/lib/planGate";
import { api } from "../../convex/_generated/api";

const ROLES = ["owner", "admin", "manager", "sales_rep", "viewer"] as const;
type TeamRole = (typeof ROLES)[number];

function roleLabel(role: string) {
  return role === "sales_rep" ? "Sales Rep" : role.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function roleVariant(role: string) {
  if (role === "owner" || role === "admin") return "default" as const;
  if (role === "manager") return "info" as const;
  if (role === "sales_rep") return "success" as const;
  return "secondary" as const;
}

function TeamLimitCard({ activeCount, plan }: { activeCount: number; plan: Plan }) {
  const limit = PLAN_TEAM_LIMIT[plan] ?? 1;
  const isUnlimited = !Number.isFinite(limit);
  const percentage = isUnlimited ? 0 : Math.min(100, (activeCount / limit) * 100);
  const atLimit = !isUnlimited && activeCount >= limit;
  const nearLimit = !isUnlimited && activeCount >= limit - 1 && !atLimit;

  // Determine next plan for upgrade CTA
  const planOrder: Plan[] = ["free", "starter", "growth", "pro", "enterprise"];
  const currentIdx = planOrder.indexOf(plan);
  const nextPlan = currentIdx < planOrder.length - 1 ? planOrder[currentIdx + 1] : null;
  const nextLimit = nextPlan ? PLAN_TEAM_LIMIT[nextPlan] : null;

  return (
    <Card className={atLimit ? "border-amber-500/50 bg-amber-500/5" : ""}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-blue-500" />
            <span className="font-semibold text-sm">Team Members</span>
          </div>
          <Badge variant={atLimit ? "warning" : "secondary"} className="text-xs">
            {isUnlimited
              ? `${activeCount} members`
              : `${activeCount} / ${limit}`}
          </Badge>
        </div>

        {!isUnlimited && (
          <Progress
            value={percentage}
            className={`h-2 ${atLimit ? "[&>div]:bg-amber-500" : nearLimit ? "[&>div]:bg-yellow-500" : "[&>div]:bg-blue-500"}`}
          />
        )}

        {isUnlimited && (
          <p className="text-xs text-muted-foreground">Unlimited team members on your Enterprise plan.</p>
        )}

        {atLimit && nextPlan && (
          <div className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
            <div className="flex items-center gap-2">
              <Crown className="size-4 text-amber-400" />
              <span className="text-xs text-amber-200">
                Team limit reached. Upgrade to {planLabel(nextPlan)} for {Number.isFinite(nextLimit!) ? `${nextLimit} members` : "unlimited members"}.
              </span>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs gap-1 border-amber-500/30 text-amber-300 hover:bg-amber-500/20" asChild>
              <Link to="/subscription">
                <Sparkles className="size-3" />
                Upgrade
              </Link>
            </Button>
          </div>
        )}

        {nearLimit && !atLimit && nextPlan && (
          <p className="text-xs text-yellow-400/80">
            Almost at your team limit — {limit - activeCount} seat{limit - activeCount === 1 ? "" : "s"} remaining.
            {nextPlan && ` Upgrade to ${planLabel(nextPlan)} (${planPrice(nextPlan)}) for ${Number.isFinite(nextLimit!) ? `up to ${nextLimit}` : "unlimited"} members.`}
          </p>
        )}

        {!atLimit && !nearLimit && !isUnlimited && (
          <p className="text-xs text-muted-foreground">
            {limit - activeCount} seat{limit - activeCount === 1 ? "" : "s"} available on your {planLabel(plan)} plan.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function TeamPage() {
  const company = useQuery(api.companies.getMyCompany);
  const members = useQuery(api.companies.getTeamMembers);
  const inviteTeamMember = useMutation(api.companies.inviteTeamMember);
  const removeTeamMember = useMutation(api.companies.removeTeamMember);
  const revokeInvite = useMutation(api.companies.revokeInvite);
  const updateRole = useMutation(api.companies.updateTeamMemberRole);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("sales_rep");
  const [saving, setSaving] = useState(false);
  const { effectivePlan } = useFreeTrial();

  const summary = useMemo(() => {
    const active = (members ?? []).filter((member: any) => member.kind !== "invite");
    return {
      total: active.length,
      admins: active.filter((member: any) => member.role === "owner" || member.role === "admin").length,
      managers: active.filter((member: any) => member.role === "manager").length,
      reps: active.filter((member: any) => member.role === "sales_rep").length,
      viewers: active.filter((member: any) => member.role === "viewer").length,
    };
  }, [members]);

  const plan = (effectivePlan || "free") as Plan;
  const limit = PLAN_TEAM_LIMIT[plan] ?? 1;
  const atLimit = Number.isFinite(limit) && summary.total >= limit;

  const canManage = company?.role === "owner" || company?.role === "admin" || company?.role === "manager";

  const submitInvite = async () => {
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }
    setSaving(true);
    try {
      await inviteTeamMember({ email: email.trim(), role });
      toast.success("Invite sent.");
      setEmail("");
      setRole("sales_rep");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send invite.");
    } finally {
      setSaving(false);
    }
  };

  if (members === undefined || company === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Users className="size-8 animate-pulse text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage roles, invites, and access for your AquaReport workspace.
          </p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={atLimit}>
                <UserPlus className="size-4" />
                {atLimit ? "Team Limit Reached" : "Invite Team Member"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} type="email" onChange={(event) => setEmail(event.target.value)} placeholder="rep@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(value: TeamRole) => setRole(value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.filter((item) => company?.role === "owner" || item !== "owner").map((item) => (
                        <SelectItem key={item} value={item}>{roleLabel(item)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submitInvite} disabled={saving}>{saving ? "Sending..." : "Send Invite"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Team limit + role summary */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="md:col-span-2">
          <TeamLimitCard activeCount={summary.total} plan={plan} />
        </div>
        <RoleCard label="Admins" value={summary.admins} />
        <RoleCard label="Managers" value={summary.managers} />
        <RoleCard label="Reps" value={summary.reps} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-blue-500" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(members ?? []).map((member: any) => (
                <TableRow key={String(member._id)}>
                  <TableCell className="font-medium">{member.name || member.email?.split("@")[0] || "Team member"}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.kind === "invite" ? "warning" : roleVariant(member.role)}>
                      {member.kind === "invite" ? "Pending " : ""}{roleLabel(member.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.kind === "invite"
                      ? `Invited ${new Date(member.invitedAt).toLocaleDateString()}`
                      : member.acceptedAt
                        ? new Date(member.acceptedAt).toLocaleDateString()
                        : "Active"}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          {member.kind !== "invite" && member.role !== "owner" && (
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {ROLES.filter((item) => company?.role === "owner" || item !== "owner").map((item) => (
                                  <DropdownMenuItem
                                    key={item}
                                    onClick={async () => {
                                      try {
                                        await updateRole({ memberId: member._id, role: item });
                                        toast.success("Role updated.");
                                      } catch (error) {
                                        toast.error(error instanceof Error ? error.message : "Could not update role.");
                                      }
                                    }}
                                  >
                                    {roleLabel(item)}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          )}
                          <DropdownMenuSeparator />
                          {member.kind === "invite" ? (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={async () => {
                                try {
                                  await revokeInvite({ inviteId: member._id });
                                  toast.success("Invite revoked.");
                                } catch (error) {
                                  toast.error(error instanceof Error ? error.message : "Could not revoke invite.");
                                }
                              }}
                            >
                              Revoke Invite
                            </DropdownMenuItem>
                          ) : member.role !== "owner" && (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={async () => {
                                try {
                                  await removeTeamMember({ memberId: member._id });
                                  toast.success("Team member removed.");
                                } catch (error) {
                                  toast.error(error instanceof Error ? error.message : "Could not remove member.");
                                }
                              }}
                            >
                              Remove
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function RoleCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
