import { useAction, useMutation, useQuery } from "convex/react";
import {
  Building2,
  Check,
  CreditCard,
  Droplets,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Palette,
  Phone,
  Globe,
  Plus,
  Trash2,
  Users,
  UserCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "../../convex/_generated/api";
import { useNavigate } from "react-router-dom";

type TeamRole = "owner" | "admin" | "manager" | "sales_rep" | "viewer";

export function CompanySettingsPage() {
  const navigate = useNavigate();
  const company = useQuery(api.companies.getMyCompany);
  const members = useQuery(api.companies.getTeamMembers);
  const createCompany = useMutation(api.companies.createCompany);
  const updateCompany = useMutation(api.companies.updateCompany);
  const addMember = useMutation(api.companies.addTeamMember);
  const removeMember = useMutation(api.companies.removeTeamMember);
  const revokeInvite = useMutation(api.companies.revokeInvite);

  // If no company yet, show creation form
  if (company === null) {
    return <CreateCompanyForm onCreate={createCompany} onCreated={() => navigate("/dashboard", { replace: true })} />;
  }

  if (company === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your company profile and team
        </p>
      </div>

      <CompanyProfileCard company={company} onUpdate={updateCompany} />

      <BrandingCard company={company} onUpdate={updateCompany} />

      <TeamCardFixed
        members={members ?? []}
        isAdmin={company.role === "admin" || company.role === "owner"}
        onAdd={addMember}
        onRemove={removeMember}
        onRevoke={revokeInvite}
      />

      {(company.role === "admin" || company.role === "owner") && <StripeCard />}
    </div>
  );
}

function CreateCompanyForm({
  onCreate,
  onCreated,
}: {
  onCreate: (args: { name: string; email?: string; phone?: string }) => Promise<unknown>;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      toast.success("Company created!");
      onCreated();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create company"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-blue-500/10 mx-auto mb-2">
            <Building2 className="size-7 text-blue-500" />
          </div>
          <CardTitle>Set Up Your Company</CardTitle>
          <CardDescription>
            Create your company profile to start generating branded reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Pure Water Solutions"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Business Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="info@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading || !name.trim()} className="w-full">
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Building2 className="size-4" />
              )}
              Create Company
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function CompanyProfileCard({
  company,
  onUpdate,
}: {
  company: Record<string, unknown>;
  onUpdate: (args: Record<string, string | undefined>) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState((company.name as string) || "");
  const [email, setEmail] = useState((company.email as string) || "");
  const [phone, setPhone] = useState((company.phone as string) || "");
  const [website, setWebsite] = useState((company.website as string) || "");
  const [address, setAddress] = useState((company.address as string) || "");

  useEffect(() => {
    setName((company.name as string) || "");
    setEmail((company.email as string) || "");
    setPhone((company.phone as string) || "");
    setWebsite((company.website as string) || "");
    setAddress((company.address as string) || "");
  }, [company]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        address: address.trim() || undefined,
      });
      toast.success("Company profile updated");
      setEditing(false);
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-muted-foreground" />
            Company Profile
          </CardTitle>
          <CardDescription>
            This information appears on your reports
          </CardDescription>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourcompany.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <InfoRow icon={Building2} label="Company" value={company.name as string} />
            <InfoRow icon={Mail} label="Email" value={(company.email as string) || "—"} />
            <InfoRow icon={Phone} label="Phone" value={(company.phone as string) || "—"} />
            <InfoRow icon={Globe} label="Website" value={(company.website as string) || "—"} />
            <InfoRow icon={MapPin} label="Address" value={(company.address as string) || "—"} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground w-20 shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function BrandingCard({
  company,
  onUpdate,
}: {
  company: Record<string, unknown>;
  onUpdate: (args: Record<string, string | string[] | undefined>) => Promise<unknown>;
}) {
  const [color, setColor] = useState(
    (company.primaryColor as string) || "#2563eb"
  );
  const [logoUrl, setLogoUrl] = useState((company.logoUrl as string) || "");
  const [productName, setProductName] = useState((company.solutionProductName as string) || "Whole Home Advanced Filtration System");
  const [productImage, setProductImage] = useState((company.solutionProductImage as string) || "");
  const [productDescription, setProductDescription] = useState((company.solutionProductDescription as string) || "Hand-picked for this home's water profile and designed to protect every tap.");
  const [productBullets, setProductBullets] = useState(
    Array.isArray(company.solutionProductBullets)
      ? (company.solutionProductBullets as string[]).join("\n")
      : "Reduces chemicals, heavy metals, and harmful contaminants\nProtects your health and home\nImproves taste, skin, and hair\nHigh capacity, low maintenance"
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setColor((company.primaryColor as string) || "#2563eb");
    setLogoUrl((company.logoUrl as string) || "");
    setProductName((company.solutionProductName as string) || "Whole Home Advanced Filtration System");
    setProductImage((company.solutionProductImage as string) || "");
    setProductDescription((company.solutionProductDescription as string) || "Hand-picked for this home's water profile and designed to protect every tap.");
    setProductBullets(
      Array.isArray(company.solutionProductBullets)
        ? (company.solutionProductBullets as string[]).join("\n")
        : "Reduces chemicals, heavy metals, and harmful contaminants\nProtects your health and home\nImproves taste, skin, and hair\nHigh capacity, low maintenance"
    );
  }, [company]);

  const readImageFile = (file: File, setter: (value: string) => void) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 900_000) {
      toast.error("Please use an image under 900KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        primaryColor: color,
        logoUrl: logoUrl.trim() || undefined,
        solutionProductName: productName.trim() || undefined,
        solutionProductImage: productImage.trim() || undefined,
        solutionProductDescription: productDescription.trim() || undefined,
        solutionProductBullets: productBullets
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 6),
      });
      toast.success("Branding updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const presetColors = [
    "#2563eb",
    "#0891b2",
    "#059669",
    "#d97706",
    "#dc2626",
    "#7c3aed",
    "#db2777",
    "#1e293b",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="size-4 text-muted-foreground" />
          Branding
        </CardTitle>
        <CardDescription>
          Customize the look of your reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="mb-3 block">Primary Color</Label>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="size-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? c : "transparent",
                    boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none",
                  }}
                />
              ))}
            </div>
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="size-8 p-0 border-0 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) readImageFile(file, setLogoUrl);
              }}
            />
            <Input
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              placeholder="or paste logo image URL"
            />
          </div>
          <div className="space-y-2">
            <Label>Product Image</Label>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) readImageFile(file, setProductImage);
              }}
            />
            <Input
              value={productImage}
              onChange={(event) => setProductImage(event.target.value)}
              placeholder="or paste product image URL"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Recommended Product Name</Label>
            <Input value={productName} onChange={(event) => setProductName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Product Description</Label>
            <Textarea value={productDescription} onChange={(event) => setProductDescription(event.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Product Benefits</Label>
          <Textarea
            value={productBullets}
            onChange={(event) => setProductBullets(event.target.value)}
            placeholder="One benefit per line"
          />
          <p className="text-xs text-muted-foreground">One benefit per line. These appear in the report and exported PDF.</p>
        </div>

        <div className="rounded-xl overflow-hidden border">
          <div
            className="p-4 text-white"
            style={{
              background: `linear-gradient(135deg, ${color}, #06b6d4)`,
            }}
          >
            <p className="text-xs opacity-80">Preview</p>
            <p className="font-bold text-lg">
              {(company.name as string) || "Your Company"}
            </p>
            <p className="text-sm opacity-90">Water Quality Report</p>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-[120px_1fr]">
            <div className="rounded-lg bg-muted aspect-square overflow-hidden flex items-center justify-center">
              {productImage ? <img src={productImage} alt="" className="h-full w-full object-contain" /> : <Droplets className="size-8 text-muted-foreground" />}
            </div>
            <div>
              {logoUrl && <img src={logoUrl} alt="" className="mb-3 max-h-10 max-w-40 object-contain" />}
              <p className="font-semibold">{productName}</p>
              <p className="text-sm text-muted-foreground">{productDescription}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Save Branding & Product
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamCardFixed({
  members,
  isAdmin,
  onAdd,
  onRemove,
  onRevoke,
}: {
  members: Array<{
    _id: string;
    kind?: string;
    name?: string;
    email?: string;
    role: string;
    reportCount: number;
    expiresAt?: number;
    teamLimit?: number | null;
    teamUsed?: number;
  }>;
  isAdmin: boolean;
  onAdd: (args: { name: string; email: string; role: TeamRole }) => Promise<unknown>;
  onRemove: (args: { memberId: any }) => Promise<unknown>;
  onRevoke: (args: { inviteId: any }) => Promise<unknown>;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<TeamRole>("sales_rep");
  const [adding, setAdding] = useState(false);
  const teamLimit = members[0]?.teamLimit ?? null;
  const teamUsed = members[0]?.teamUsed ?? members.length;
  const atLimit = typeof teamLimit === "number" && teamUsed >= teamLimit;

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newName.trim() || !newEmail.trim() || atLimit) return;
    setAdding(true);
    try {
      await onAdd({ name: newName.trim(), email: newEmail.trim(), role: newRole });
      toast.success("Invite sent");
      setAddOpen(false);
      setNewName("");
      setNewEmail("");
      setNewRole("sales_rep");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invite");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await onRemove({ memberId });
      toast.success("Member removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member");
    }
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      await onRevoke({ inviteId });
      toast.success("Invite revoked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to revoke invite");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-muted-foreground" />
            Team ({members.length})
          </CardTitle>
          <CardDescription>Manage members and pending invites</CardDescription>
          <p className="mt-1 text-xs text-muted-foreground">
            {teamLimit ? `${teamUsed}/${teamLimit} seats used on this plan` : `${teamUsed} seats used · unlimited plan`}
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" disabled={atLimit} onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Invite Member
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {atLimit && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              Team limit reached for this plan. Upgrade to invite more users.
            </div>
          )}
          {members.map((member) => (
            <div key={member._id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <UserCircle className="size-5 text-blue-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{member.name || "Unnamed"}</p>
                    {member.kind === "invite" && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                        Pending
                      </span>
                    )}
                    {(member.role === "admin" || member.role === "owner") && (
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded">
                        {member.role === "owner" ? "Owner" : "Admin"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {member.email || "No email"} · {member.kind === "invite" ? "invite sent" : `${member.reportCount} reports`}
                    {member.kind === "invite" && member.expiresAt ? ` · expires ${new Date(member.expiresAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
              </div>
              {isAdmin && member.kind === "invite" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleRevoke(member._id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
              {isAdmin && member.kind !== "invite" && member.role !== "owner" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(member._id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Send an invite link to a new member of your sales team.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="John Smith" value={newName} onChange={(event) => setNewName(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="john@company.com" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as TeamRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_rep">Sales Rep</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={adding || atLimit}>
                {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                Send Invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TeamCard({
  members,
  isAdmin,
  onAdd,
  onRemove,
  onRevoke,
}: {
  members: Array<{
    _id: string;
    kind?: string;
    name?: string;
    email?: string;
    role: string;
    reportCount: number;
    expiresAt?: number;
  }>;
  isAdmin: boolean;
  onAdd: (args: { name: string; email: string; role: TeamRole }) => Promise<unknown>;
  onRemove: (args: { memberId: any }) => Promise<unknown>;
  onRevoke: (args: { inviteId: any }) => Promise<unknown>;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<TeamRole>("sales_rep");
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    setAdding(true);
    try {
      await onAdd({ name: newName.trim(), email: newEmail.trim(), role: newRole });
      toast.success("Invite sent");
      setAddOpen(false);
      setNewName("");
      setNewEmail("");
      setNewRole("sales_rep");
    } catch {
      toast.error("Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await onRemove({ memberId });
      toast.success("Member removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      await onRevoke({ inviteId });
      toast.success("Invite revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke invite");
    }
  };
  void handleRevoke;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-muted-foreground" />
            Team ({members.length})
          </CardTitle>
          <CardDescription>Manage your sales team members</CardDescription>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Invite Member
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((m) => (
            <div
              key={m._id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <UserCircle className="size-5 text-blue-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">
                      {m.name || "Unnamed"}
                    </p>
                    {m.kind === "invite" && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                        Pending
                      </span>
                    )}
                    {(m.role === "admin" || m.role === "owner") && (
                      <span className="text-[10px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded">
                        {m.role === "owner" ? "Owner" : "Admin"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {m.email || "No email"} · {m.reportCount} reports
                  </p>
                </div>
              </div>
              {isAdmin && m.role !== "owner" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(m._id)}
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your sales team
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="John Smith"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="john@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as TeamRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_rep">Sales Rep</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={adding}>
                {adding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

void TeamCard;

function StripeCard() {
  const navigate = useNavigate();
  const subscription = useQuery(api.stripe.getSubscription);
  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const createPortal = useAction(api.stripe.createPortalSession);
  const [loading, setLoading] = useState("");

  const handleSubscribe = async (priceId: string, plan: string) => {
    setLoading(plan);
    try {
      const { url } = await createCheckout({ priceId, plan });
      if (url) window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setLoading("");
    }
  };

  const handleManageBilling = async () => {
    setLoading("portal");
    try {
      const { url } = await createPortal();
      if (url) window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open billing portal");
    } finally {
      setLoading("");
    }
  };

  const currentPlan = subscription?.plan || "free";
  const isActive = subscription?.status === "active";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="size-4 text-muted-foreground" />
          Billing & Subscription
        </CardTitle>
        <CardDescription>
          Manage your subscription and payment settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current plan status */}
        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="text-lg font-bold capitalize">{currentPlan}</p>
            {isActive && subscription?.periodEnd && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Renews {new Date(subscription.periodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
            currentPlan === "free" ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" :
            "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
          }`}>
            {isActive ? "Active" : currentPlan === "free" ? "1 free report" : subscription?.status || "Inactive"}
          </div>
        </div>

        {/* Plans grid */}
        {(!isActive || currentPlan === "free") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl border p-4 space-y-3 ${plan.id === "growth" ? "border-blue-500 bg-blue-500/5" : ""}`}
              >
                <div>
                  <p className="font-semibold text-sm">{plan.name}</p>
                  <p className="text-lg font-bold">{plan.price}</p>
                </div>
                <ul className="space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Check className="size-3 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  variant={plan.id === "growth" ? "default" : "outline"}
                  className="w-full"
                  disabled={loading === plan.id}
                  onClick={() => {
                    if (plan.priceId) {
                      handleSubscribe(plan.priceId, plan.id);
                    } else {
                      navigate("/subscription");
                    }
                  }}
                >
                  {loading === plan.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    plan.id === "enterprise" ? "Contact" : "Subscribe"
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Manage billing */}
        {isActive && (
          <Button variant="outline" onClick={handleManageBilling} disabled={loading === "portal"}>
            {loading === "portal" ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
            Manage Billing
          </Button>
        )}

        {/* Setup instructions */}
        <div className="rounded-xl border border-dashed p-4 space-y-2">
          <p className="text-sm font-medium">Stripe Configuration</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            To enable payments, add these environment variables to your Convex dashboard:
          </p>
          <div className="font-mono text-xs bg-muted rounded-lg p-3 space-y-1">
            <p><span className="text-blue-500">STRIPE_SECRET_KEY</span>=sk_live_...</p>
            <p><span className="text-blue-500">STRIPE_WEBHOOK_SECRET</span>=whsec_...</p>
            <p><span className="text-blue-500">SITE_URL</span>=https://yourdomain.com</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Webhook endpoint: <code className="bg-muted px-1 rounded">/api/stripe-webhook</code>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
