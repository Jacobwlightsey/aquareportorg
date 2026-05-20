import { useMutation, useQuery } from "convex/react";
import { MoreHorizontal, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  const summary = useMemo(() => {
    const active = (members ?? []).filter((member: any) => member.kind !== "invite");
    return {
      admins: active.filter((member: any) => member.role === "owner" || member.role === "admin").length,
      managers: active.filter((member: any) => member.role === "manager").length,
      reps: active.filter((member: any) => member.role === "sales_rep").length,
      viewers: active.filter((member: any) => member.role === "viewer").length,
    };
  }, [members]);

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
              <Button>
                <UserPlus className="size-4" />
                Invite Team Member
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

      <div className="grid gap-4 md:grid-cols-4">
        <RoleCard label="Admins" value={summary.admins} />
        <RoleCard label="Managers" value={summary.managers} />
        <RoleCard label="Reps" value={summary.reps} />
        <RoleCard label="Viewers" value={summary.viewers} />
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
