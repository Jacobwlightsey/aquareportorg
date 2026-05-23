import { useAction, useMutation, useQuery } from "convex/react";
import {
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  Droplets,
  ExternalLink,
  GripVertical,
  Loader2,
  Mail,
  MapPin,
  Palette,
  Phone,
  Globe,
  Plus,
  Settings,
  Trash2,
  Users,
  UserCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS_FLAT as SUBSCRIPTION_PLANS } from "@/lib/constants";
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
import { Link, useNavigate } from "react-router-dom";

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
        <h1 className="text-2xl font-bold tracking-tight">⚙️ Company Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your company profile, team, branding, and demo experience
        </p>
      </div>

      <CompanyProfileCard company={company} onUpdate={updateCompany} />

      <BrandingCard company={company} onUpdate={updateCompany} />

      {(company.role === "admin" || company.role === "owner") && <DemoStepConfigCard />}

      {(company.role === "admin" || company.role === "owner") && <DemoConfigCard />}

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
            🏢 Company Profile
          </CardTitle>
          <CardDescription>
            Your business info — this appears on every report you generate
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
          <div className="grid gap-3">
            <InfoRow icon={Building2} label="Company" value={company.name as string} emoji="🏢" />
            <InfoRow icon={Mail} label="Email" value={(company.email as string) || "—"} emoji="📧" />
            <InfoRow icon={Phone} label="Phone" value={(company.phone as string) || "—"} emoji="📱" />
            <InfoRow icon={Globe} label="Website" value={(company.website as string) || "—"} emoji="🌐" />
            <InfoRow icon={MapPin} label="Address" value={(company.address as string) || "—"} emoji="📍" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoRow({
  icon: _Icon,
  label,
  value,
  emoji,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  emoji?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors">
      <span className="text-base shrink-0">{emoji || "•"}</span>
      <span className="text-sm text-muted-foreground w-20 shrink-0 font-medium">
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
          🎨 Branding
        </CardTitle>
        <CardDescription>
          Customize colors, logos, and the look of your reports
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
            👥 Team ({members.length})
          </CardTitle>
          <CardDescription>Manage members and pending invites</CardDescription>
          <p className="mt-1 text-xs text-muted-foreground">
            {teamLimit ? `📊 ${teamUsed}/${teamLimit} seats used on this plan` : `${teamUsed} seats used · unlimited plan`}
          </p>
          {typeof teamLimit === "number" && (
            <div className="mt-2 w-48">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${atLimit ? "bg-amber-500" : "bg-blue-500"}`}
                  style={{ width: `${Math.min(100, Math.round((teamUsed / teamLimit) * 100))}%` }}
                />
              </div>
            </div>
          )}
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
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 flex items-center justify-between">
              <span>Team limit reached for this plan.</span>
              <Link to="/subscription" className="font-semibold text-amber-900 dark:text-amber-100 hover:underline ml-2 whitespace-nowrap">
                Upgrade Plan →
              </Link>
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
            👥 Team ({members.length})
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


/* ─── Demo Step Config ──────────────────────────────────────────── */

const DEMO_STEPS = [
  { key: "welcome", label: "Welcome", color: "#3b82f6", required: true },
  { key: "score", label: "AquaScore Reveal", color: "#10b981", required: false },
  { key: "contaminants", label: "What\'s In Your Water", color: "#f59e0b", required: false },
  { key: "impact", label: "Impact On Your Life", color: "#f43f5e", required: false },
  { key: "test", label: "Live Water Test", color: "#06b6d4", required: false },
  { key: "transform", label: "Score Transform", color: "#8b5cf6", required: false },
  { key: "system", label: "System Info", color: "#6366f1", required: false },
  { key: "pricing", label: "Pricing", color: "#10b981", required: false },
  { key: "comparison", label: "Cost Comparison", color: "#ec4899", required: false },
  { key: "boost", label: "Score Boost", color: "#f59e0b", required: false },
  { key: "customerClose", label: "Customer Close", color: "#22c55e", required: false },
  { key: "dealerClose", label: "Dealer Close", color: "#6b7280", required: true },
];

const STEP_KEY_ALIASES: Record<string, string> = { solution: "transform", close: "dealerClose" };

function DemoStepConfigCard() {
  const company = useQuery(api.companies.getMyCompany);
  const updateStepConfig = useMutation(api.dealerShared.updateDemoStepConfig);
  const [steps, setSteps] = useState<Array<typeof DEMO_STEPS[0] & { enabled: boolean }>>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!company) return;
    const cfg = company.demoStepConfig as any;
    const normalize = (k: string) => STEP_KEY_ALIASES[k] ?? k;
    const disabled = new Set((cfg?.disabled ?? []).map(normalize));
    const stepMap = new Map(DEMO_STEPS.map((s) => [s.key, s]));

    let ordered: Array<typeof DEMO_STEPS[0] & { enabled: boolean }>;
    if (cfg?.order) {
      const seen = new Set<string>();
      ordered = cfg.order.map(normalize).filter((k: string) => stepMap.has(k) && !seen.has(k)).map((k: string) => {
        seen.add(k);
        const s = stepMap.get(k)!;
        return { ...s, enabled: !disabled.has(k) || s.required };
      });
      for (const s of DEMO_STEPS) {
        if (!seen.has(s.key)) ordered.push({ ...s, enabled: !disabled.has(s.key) || s.required });
      }
    } else {
      ordered = DEMO_STEPS.map((s) => ({ ...s, enabled: !disabled.has(s.key) || s.required }));
    }
    setSteps(ordered);
  }, [company]);

  const persist = useCallback(async (s: typeof steps) => {
    setSaving(true);
    try {
      await updateStepConfig({ order: s.map((x) => x.key), disabled: s.filter((x) => !x.enabled).map((x) => x.key) });
      toast.success("Demo step order saved");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  }, [updateStepConfig]);

  const toggle = useCallback((idx: number) => {
    setSteps((prev) => {
      const next = [...prev];
      if (!next[idx].required) next[idx] = { ...next[idx], enabled: !next[idx].enabled };
      persist(next);
      return next;
    });
  }, [persist]);

  const reset = useCallback(() => {
    const fresh = DEMO_STEPS.map((s) => ({ ...s, enabled: true }));
    setSteps(fresh);
    persist(fresh);
  }, [persist]);

  if (!company) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">🧙‍♂️ Demo Wizard Steps</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Drag to reorder · Toggle to show/hide steps</p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset} className="flex items-center gap-1.5 text-xs">
          <RotateCcw className="size-3" /> Reset
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {steps.map((step, idx) => (
          <div
            key={step.key}
            draggable
            onDragStart={() => setDragIdx(idx)}
            onDragOver={(e) => { e.preventDefault(); if (dragIdx !== null && dragIdx !== idx) { setSteps((prev) => { const n = [...prev]; const [item] = n.splice(dragIdx, 1); n.splice(idx, 0, item); return n; }); setDragIdx(idx); } }}
            onDragEnd={() => { if (dragIdx !== null) persist(steps); setDragIdx(null); }}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all cursor-grab active:cursor-grabbing ${dragIdx === idx ? "bg-muted/50 scale-[1.02] shadow-lg" : "hover:bg-muted/30"} ${step.enabled ? "" : "opacity-40"}`}
          >
            <GripVertical className="size-4 text-muted-foreground/30 shrink-0" />
            <div className="size-2.5 rounded-full shrink-0" style={{ background: step.color }} />
            <span className="flex-1 text-sm font-medium">
              {step.label}
              {step.required && <span className="ml-2 text-[10px] text-muted-foreground/50 uppercase tracking-wider">Required</span>}
            </span>
            <span className="text-[10px] text-muted-foreground/30 font-mono mr-2">{idx + 1}</span>
            <button
              onClick={() => toggle(idx)}
              disabled={step.required}
              className={`rounded p-1 transition-colors cursor-pointer ${step.required ? "text-muted-foreground/20 cursor-not-allowed" : step.enabled ? "text-muted-foreground/50 hover:text-foreground" : "text-muted-foreground/20 hover:text-foreground"}`}
              title={step.required ? "Required step" : step.enabled ? "Hide step" : "Show step"}
            >
              {step.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </button>
          </div>
        ))}
        {saving && <p className="text-[10px] text-muted-foreground text-center pt-1">Saving…</p>}
      </CardContent>
    </Card>
  );
}

/* ─── Collapsible Section helper ─────────────────────────────────── */

function ConfigSection({ title, description, children, defaultOpen }: { title: string; description: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-shadow ${open ? "shadow-sm ring-1 ring-blue-500/10" : ""}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-muted/30 transition-colors cursor-pointer">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 space-y-3 border-t bg-muted/5">{children}</div>}
    </div>
  );
}

/* ─── Editable list item helpers ──────────────────────────────────── */

function EditableListItem({ value, placeholder, onChange, onRemove }: { value: string; placeholder: string; onChange: (v: string) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="flex-1 text-sm" />
      <button onClick={onRemove} className="p-1 rounded text-muted-foreground hover:text-red-500 cursor-pointer"><X className="size-3.5" /></button>
    </div>
  );
}

function TitledListItem({ item, onChange, onRemove }: { item: { title: string; description: string }; onChange: (v: { title: string; description: string }) => void; onRemove: () => void }) {
  return (
    <div className="rounded-xl border p-3 bg-background space-y-1">
      <div className="flex items-center gap-2">
        <Input value={item.title} placeholder="Title" onChange={(e) => onChange({ ...item, title: e.target.value })} className="flex-1 text-sm font-semibold" />
        <button onClick={onRemove} className="p-1 rounded text-muted-foreground hover:text-red-500 cursor-pointer"><X className="size-3.5" /></button>
      </div>
      <Textarea value={item.description} placeholder="Description" onChange={(e) => onChange({ ...item, description: e.target.value })} rows={2} className="text-xs resize-none" />
    </div>
  );
}

function DiscountItem({ d, onChange, onRemove }: { d: { id: string; label: string; amount: number; icon: string }; onChange: (v: any) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Input value={d.icon} className="w-12 text-center" onChange={(e) => onChange({ ...d, icon: e.target.value })} />
      <Input value={d.label} placeholder="Discount label" onChange={(e) => onChange({ ...d, label: e.target.value })} className="flex-1" />
      <Input type="number" value={d.amount || ""} placeholder="$" onChange={(e) => onChange({ ...d, amount: Number(e.target.value) })} className="w-24" />
      <button onClick={onRemove} className="p-1 rounded text-muted-foreground hover:text-red-500 cursor-pointer"><X className="size-3.5" /></button>
    </div>
  );
}

function CostItem({ item, onChange, onRemove }: { item: { label: string; monthlyCost: number; enabled: boolean }; onChange: (v: any) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Input value={item.label} placeholder="Cost label" onChange={(e) => onChange({ ...item, label: e.target.value })} className="flex-1" />
      <Input type="number" value={item.monthlyCost || ""} placeholder="$/mo" onChange={(e) => onChange({ ...item, monthlyCost: Number(e.target.value) })} className="w-24" />
      <button onClick={onRemove} className="p-1 rounded text-muted-foreground hover:text-red-500 cursor-pointer"><X className="size-3.5" /></button>
    </div>
  );
}

/* ─── Demo Config Card ────────────────────────────────────────────── */

const DEFAULT_CLOSE_OPTIONS = ["Sold — Install Scheduled", "Follow Up Needed", "Not Interested", "No Show"];

const COLOR_PRESETS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4", "#0ea5e9", "#84cc16"];

function DemoConfigCard() {
  const company = useQuery(api.companies.getMyCompany);
  const updateDemoConfig = useMutation(api.dealerShared.updateDemoConfig);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [cfg, setCfg] = useState<Record<string, any>>({});

  useEffect(() => {
    if (company && !initialized) {
      const v = (company as any).demoConfig || {};
      setCfg({
        welcomeHeadline: v.welcomeHeadline || "",
        welcomeSubtext: v.welcomeSubtext || "",
        accentColor: v.accentColor || "#3b82f6",
        highlightCategories: v.highlightCategories || [],
        projectedScore: v.projectedScore ?? 95,
        solutionHeadline: v.solutionHeadline || "",
        solutionProducts: v.solutionProducts || [],
        systemIncludes: v.systemIncludes?.length ? v.systemIncludes : [
          { title: "Carbon Filtration", description: "Reduces chlorine, chemicals, bad taste & odor" },
          { title: "Water Softening", description: "Reduces hardness, scale & protects plumbing" },
          { title: "Sediment Filtration", description: "Reduces dirt, rust, sand & fine particles" },
          { title: "Digital Control Valve", description: "High efficiency metered control valve" },
          { title: "Brine Tank with Safety Float", description: "Ensures reliable & efficient operation" },
          { title: "Bypass Valve", description: "Built-in bypass for easy maintenance" },
          { title: "Professional Installation", description: "Installed by certified water quality experts" },
        ],
        warrantyTitle: v.warrantyTitle || "20 Year Unlimited Warranty",
        warrantyBullets: v.warrantyBullets?.length ? v.warrantyBullets : [
          "20 Year Warranty on Tanks", "20 Year Warranty on Control Valve",
          "10 Year Warranty on Components", "5 Year Warranty on Labor",
          "100% Parts & Labor Coverage", "No Prorating — Ever", "Lifetime Customer Support",
        ],
        howItWorksSteps: v.howItWorksSteps?.length ? v.howItWorksSteps : [
          { title: "Water Analysis", description: "We test your water and review your local utility data to identify concerns." },
          { title: "Custom Design", description: "Your system is configured specifically for the contaminants in your water." },
          { title: "Professional Installation", description: "Certified technicians install your system — free of charge." },
          { title: "Enjoy Better Water", description: "Cleaner, softer water from every tap in your home, starting day one." },
        ],
        systemCallouts: v.systemCallouts?.length ? v.systemCallouts : ["Free Professional Installation", "Free Annual Water Review", "Lifetime Support"],
        programPrice: v.programPrice,
        revealPrice: v.revealPrice,
        discountOptions: v.discountOptions?.length ? v.discountOptions : [
          { id: "today", label: "Same-Day Decision", amount: 500, icon: "⚡" },
          { id: "referral", label: "Referral Credit", amount: 300, icon: "👥" },
          { id: "military", label: "Military / First Responder", amount: 250, icon: "🎖️" },
          { id: "senior", label: "Senior Discount", amount: 200, icon: "🤝" },
        ],
        costItems: v.costItems?.length ? v.costItems : [
          { label: "Bottled Water", monthlyCost: 120, enabled: true },
          { label: "Water Delivery", monthlyCost: 60, enabled: true },
          { label: "Pitcher Filters", monthlyCost: 25, enabled: true },
          { label: "Appliance Repairs", monthlyCost: 40, enabled: true },
          { label: "Skin/Hair Products", monthlyCost: 35, enabled: true },
          { label: "Plumbing Maintenance", monthlyCost: 30, enabled: true },
        ],
        systemCostMonthly: v.systemCostMonthly,
        roSystemName: v.roSystemName || "Reverse Osmosis System",
        roSystemDescription: v.roSystemDescription || "A premium under-sink reverse osmosis system that removes 99.9% of all remaining contaminants, giving you the purest water possible — included free with your whole-home system.",
        roSystemImage: v.roSystemImage || "",
        boostedScore: v.boostedScore ?? 99,
        closeHeadline: v.closeHeadline || "",
        customerCloseSubtext: v.customerCloseSubtext || "",
        closeOptions: v.closeOptions?.length ? v.closeOptions : DEFAULT_CLOSE_OPTIONS,
      });
      setInitialized(true);
    }
  }, [company, initialized]);

  const update = useCallback((patch: Record<string, any>) => {
    setCfg((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  }, []);

  if (!company) return null;

  const accent = cfg.accentColor || "#3b82f6";

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build config object, sending undefined for empty values
      const config: Record<string, any> = {};
      for (const [k, v] of Object.entries(cfg)) {
        if (Array.isArray(v)) { if (v.length > 0) config[k] = v; }
        else if (v !== "" && v !== undefined && v !== null) config[k] = v;
      }
      await updateDemoConfig({ config });
      setSaved(true);
      toast.success("Demo settings saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const contaminantCategories = ["Heavy Metals", "Disinfection Byproducts", "Pesticides", "Radioactive", "Microorganisms", "Industrial Chemicals", "Pharmaceuticals"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          🎯 Demo Wizard Customization
        </CardTitle>
        <CardDescription>Configure every part of your demo presentation. Changes show up in every new demo you present.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Brand Color */}
        <ConfigSection title="🎨 Brand Color" description="Colors buttons, highlights, and accents throughout the demo">
          <div className="flex flex-wrap gap-2 pt-2">
            {COLOR_PRESETS.map((c) => (
              <button key={c} onClick={() => update({ accentColor: c })} className={`size-8 rounded-xl transition-all cursor-pointer ${accent === c ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : "hover:scale-105"}`} style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={accent} onChange={(e) => update({ accentColor: e.target.value })} className="w-8 h-8 rounded-lg border cursor-pointer" />
            <span className="text-xs text-muted-foreground">Or pick any custom color</span>
          </div>
        </ConfigSection>

        {/* Welcome Screen */}
        <ConfigSection title="👋 Welcome Screen" description="First thing customers see when the demo starts" defaultOpen>
          <div className="space-y-2 pt-2">
            <Label className="text-xs">Headline</Label>
            <Input value={cfg.welcomeHeadline || ""} placeholder="Your Water Quality Report" onChange={(e) => update({ welcomeHeadline: e.target.value })} />
            <Label className="text-xs">Subtext</Label>
            <Textarea value={cfg.welcomeSubtext || ""} placeholder="Let\'s look at what\'s in your water..." onChange={(e) => update({ welcomeSubtext: e.target.value })} rows={2} />
          </div>
        </ConfigSection>

        {/* Featured Contaminants */}
        <ConfigSection title="🧪 Featured Contaminants" description="Pick which contaminants to emphasize — leave empty to auto-detect">
          <div className="flex flex-wrap gap-2 pt-2">
            {contaminantCategories.map((cat) => (
              <button key={cat} onClick={() => {
                const list = cfg.highlightCategories || [];
                update({ highlightCategories: list.includes(cat) ? list.filter((c: string) => c !== cat) : [...list, cat] });
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${(cfg.highlightCategories || []).includes(cat) ? "bg-blue-500 text-white border-blue-500" : "border-muted-foreground/20 hover:bg-muted/50"}`}>{cat}</button>
            ))}
          </div>
        </ConfigSection>

        {/* Score Transform */}
        <ConfigSection title="✨ Score Transform" description="Projected score after filtration — the \'before → after\' reveal">
          <div className="pt-2">
            <Label className="text-xs">Projected Score After Filtration</Label>
            <div className="flex items-center gap-3 mt-1">
              <input type="range" min={60} max={100} value={cfg.projectedScore ?? 95} onChange={(e) => update({ projectedScore: Number(e.target.value) })} className="flex-1 accent-blue-500 cursor-pointer" />
              <div className="size-10 rounded-full flex items-center justify-center text-white text-sm font-black" style={{ backgroundColor: accent }}>{cfg.projectedScore ?? 95}</div>
            </div>
          </div>
        </ConfigSection>

        {/* System Info */}
        <ConfigSection title="🔧 System Info" description="System includes, warranty, how it works, callouts">
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-muted/30 p-3 border border-dashed">
              <p className="text-xs text-muted-foreground">💡 System Name & Image are set in <strong>Company Settings → General</strong> (Solution Product section above).</p>
            </div>

            <div>
              <Label className="text-xs font-semibold">System Includes</Label>
              <div className="space-y-2 mt-2">
                {(cfg.systemIncludes || []).map((item: any, idx: number) => (
                  <TitledListItem key={idx} item={item} onChange={(v) => { const n = [...(cfg.systemIncludes || [])]; n[idx] = v; update({ systemIncludes: n }); }} onRemove={() => { const n = [...(cfg.systemIncludes || [])]; n.splice(idx, 1); update({ systemIncludes: n }); }} />
                ))}
                <button onClick={() => update({ systemIncludes: [...(cfg.systemIncludes || []), { title: "", description: "" }] })} className="mt-1 flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-blue-300 text-blue-500 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer w-full justify-center"><Plus className="size-4" /> Add Item</button>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Warranty</Label>
              <Input value={cfg.warrantyTitle || ""} placeholder="20 Year Unlimited Warranty" onChange={(e) => update({ warrantyTitle: e.target.value })} className="mt-1" />
              <div className="space-y-2 mt-2">
                {(cfg.warrantyBullets || []).map((b: string, idx: number) => (
                  <EditableListItem key={idx} value={b} placeholder="e.g. 20 Year Warranty on Tanks" onChange={(v) => { const n = [...(cfg.warrantyBullets || [])]; n[idx] = v; update({ warrantyBullets: n }); }} onRemove={() => { const n = [...(cfg.warrantyBullets || [])]; n.splice(idx, 1); update({ warrantyBullets: n }); }} />
                ))}
                <button onClick={() => update({ warrantyBullets: [...(cfg.warrantyBullets || []), ""] })} className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-blue-300 text-blue-500 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer w-full justify-center"><Plus className="size-4" /> Add Warranty Point</button>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">How It Works Steps</Label>
              <div className="space-y-2 mt-2">
                {(cfg.howItWorksSteps || []).map((step: any, idx: number) => (
                  <TitledListItem key={idx} item={step} onChange={(v) => { const n = [...(cfg.howItWorksSteps || [])]; n[idx] = v; update({ howItWorksSteps: n }); }} onRemove={() => { const n = [...(cfg.howItWorksSteps || [])]; n.splice(idx, 1); update({ howItWorksSteps: n }); }} />
                ))}
                <button onClick={() => update({ howItWorksSteps: [...(cfg.howItWorksSteps || []), { title: "", description: "" }] })} className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-blue-300 text-blue-500 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer w-full justify-center"><Plus className="size-4" /> Add Step</button>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Bottom Callouts</Label>
              <p className="text-xs text-muted-foreground mb-2">Up to 3 short callouts</p>
              <div className="space-y-2">
                {(cfg.systemCallouts || []).map((c: string, idx: number) => (
                  <EditableListItem key={idx} value={c} placeholder="e.g. Free Professional Installation" onChange={(v) => { const n = [...(cfg.systemCallouts || [])]; n[idx] = v; update({ systemCallouts: n }); }} onRemove={() => { const n = [...(cfg.systemCallouts || [])]; n.splice(idx, 1); update({ systemCallouts: n }); }} />
                ))}
                {(cfg.systemCallouts || []).length < 3 && (
                  <button onClick={() => update({ systemCallouts: [...(cfg.systemCallouts || []), ""] })} className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-blue-300 text-blue-500 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer w-full justify-center"><Plus className="size-4" /> Add Callout</button>
                )}
              </div>
            </div>
          </div>
        </ConfigSection>

        {/* Pricing */}
        <ConfigSection title="💰 Pricing" description="Program price, reveal price, stackable discounts">
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Program Price (crossed out)</Label>
                <Input type="number" value={cfg.programPrice || ""} placeholder="e.g. 12995" onChange={(e) => update({ programPrice: Number(e.target.value) || undefined })} />
              </div>
              <div>
                <Label className="text-xs">Reveal Price (actual)</Label>
                <Input type="number" value={cfg.revealPrice || ""} placeholder="e.g. 9995" onChange={(e) => update({ revealPrice: Number(e.target.value) || undefined })} />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Stackable Discounts</Label>
              <p className="text-xs text-muted-foreground mb-2">Sales rep can toggle these on during the demo</p>
              <div className="space-y-2">
                {(cfg.discountOptions || []).map((d: any, idx: number) => (
                  <DiscountItem key={idx} d={d} onChange={(v) => { const n = [...(cfg.discountOptions || [])]; n[idx] = v; update({ discountOptions: n }); }} onRemove={() => { const n = [...(cfg.discountOptions || [])]; n.splice(idx, 1); update({ discountOptions: n }); }} />
                ))}
                <button onClick={() => update({ discountOptions: [...(cfg.discountOptions || []), { id: `discount_${Date.now()}`, label: "", amount: 0, icon: "🏷️" }] })} className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-blue-300 text-blue-500 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer w-full justify-center"><Plus className="size-4" /> Add Discount</button>
              </div>
            </div>
          </div>
        </ConfigSection>

        {/* Cost Comparison */}
        <ConfigSection title="📊 Cost Comparison" description="Monthly expenses customers pay without filtration vs. your system">
          <div className="space-y-3 pt-2">
            <p className="text-xs text-muted-foreground">Set the average monthly expenses a homeowner spends without filtration.</p>
            <div className="space-y-2">
              {(cfg.costItems || []).map((item: any, idx: number) => (
                <CostItem key={idx} item={item} onChange={(v) => { const n = [...(cfg.costItems || [])]; n[idx] = v; update({ costItems: n }); }} onRemove={() => { const n = [...(cfg.costItems || [])]; n.splice(idx, 1); update({ costItems: n }); }} />
              ))}
              <button onClick={() => update({ costItems: [...(cfg.costItems || []), { label: "", monthlyCost: 0, enabled: true }] })} className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-blue-300 text-blue-500 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer w-full justify-center"><Plus className="size-4" /> Add Cost Item</button>
            </div>
            <div>
              <Label className="text-xs">Your System Monthly Cost</Label>
              <Input type="number" value={cfg.systemCostMonthly || ""} placeholder="e.g. 49" onChange={(e) => update({ systemCostMonthly: Number(e.target.value) || undefined })} />
              <p className="text-[10px] text-muted-foreground mt-1">What customers pay instead. Can also be entered live during the pricing step.</p>
            </div>
          </div>
        </ConfigSection>

        {/* RO System / Score Boost */}
        <ConfigSection title="🚀 Score Boost (RO System)" description="The free RO system popup that boosts the score to near-perfect">
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">RO System Name</Label>
              <Input value={cfg.roSystemName || ""} placeholder="Reverse Osmosis System" onChange={(e) => update({ roSystemName: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={cfg.roSystemDescription || ""} placeholder="A premium under-sink reverse osmosis system..." onChange={(e) => update({ roSystemDescription: e.target.value })} rows={3} />
            </div>
            <div>
              <Label className="text-xs">RO System Image URL</Label>
              <Input value={cfg.roSystemImage || ""} placeholder="https://..." onChange={(e) => update({ roSystemImage: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Boosted Score</Label>
              <Input type="number" value={cfg.boostedScore ?? 99} placeholder="99" onChange={(e) => update({ boostedScore: Number(e.target.value) })} className="w-24" />
              <p className="text-[10px] text-muted-foreground mt-1">The score to show after the RO system is added. Default: 99</p>
            </div>
          </div>
        </ConfigSection>

        {/* Customer Close */}
        <ConfigSection title="🤝 Customer Close" description="The friendly ending screen the customer sees">
          <div className="space-y-2 pt-2">
            <Label className="text-xs">Headline</Label>
            <Input value={cfg.closeHeadline || ""} placeholder="Thank You, {firstName}!" onChange={(e) => update({ closeHeadline: e.target.value })} />
            <Label className="text-xs">Subtext</Label>
            <Textarea value={cfg.customerCloseSubtext || ""} placeholder="We\'re excited to help you achieve cleaner, safer water..." onChange={(e) => update({ customerCloseSubtext: e.target.value })} rows={2} />
          </div>
        </ConfigSection>

        {/* Dealer Close Options */}
        <ConfigSection title="🎯 Dealer Close (Outcome Options)" description="Outcome buttons the sales rep sees after the demo">
          <div className="space-y-2 pt-2">
            {(cfg.closeOptions || DEFAULT_CLOSE_OPTIONS).map((opt: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="size-6 rounded-lg flex items-center justify-center text-[10px] font-bold bg-muted">{idx + 1}</span>
                <Input value={opt} onChange={(e) => { const n = [...(cfg.closeOptions || DEFAULT_CLOSE_OPTIONS)]; n[idx] = e.target.value; update({ closeOptions: n }); }} className="flex-1" />
                {(cfg.closeOptions || DEFAULT_CLOSE_OPTIONS).length > 2 && (
                  <button onClick={() => { const n = [...(cfg.closeOptions || DEFAULT_CLOSE_OPTIONS)]; n.splice(idx, 1); update({ closeOptions: n }); }} className="p-1 rounded text-muted-foreground hover:text-red-500 cursor-pointer"><X className="size-3.5" /></button>
                )}
              </div>
            ))}
            <button onClick={() => update({ closeOptions: [...(cfg.closeOptions || DEFAULT_CLOSE_OPTIONS), ""] })} className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-blue-300 text-blue-500 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer w-full justify-center"><Plus className="size-4" /> Add Option</button>
          </div>
        </ConfigSection>

        {/* Save Button */}
        <div className="pt-3 flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: accent, boxShadow: `0 4px 14px ${accent}40` }} className="text-white font-bold">
            {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : saved ? <Check className="size-4 mr-2" /> : <Save className="size-4 mr-2" />}
            {saving ? "Saving..." : saved ? "Saved!" : "Save All Changes"}
          </Button>
          {saved && <span className="text-xs text-emerald-500 font-medium">✓ Changes will appear in your next demo</span>}
        </div>
      </CardContent>
    </Card>
  );
}


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
          💳 Billing & Subscription
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
