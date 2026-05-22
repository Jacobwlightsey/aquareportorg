import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Building2, Loader2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "../../convex/_generated/api";

export function OnboardingModal() {
  const company = useQuery(api.companies.getMyCompany);
  const createCompany = useMutation(api.companies.createCompany);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Only show when company is explicitly null (loaded but doesn't exist)
  if (company !== null) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createCompany({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      toast.success("Company created! You're all set.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create company"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center items-center">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-blue-500/10 mb-2">
            <Building2 className="size-7 text-blue-500" />
          </div>
          <DialogTitle>Welcome to AquaReport!</DialogTitle>
          <DialogDescription>
            Set up your company to start generating branded water quality reports
            for your customers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="onboard-name" className="flex items-center gap-2">
              <Building2 className="size-3.5 text-muted-foreground" />
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="onboard-name"
              placeholder="e.g. Pure Water Solutions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onboard-email" className="flex items-center gap-2">
              <Mail className="size-3.5 text-muted-foreground" />
              Business Email
            </Label>
            <Input
              id="onboard-email"
              type="email"
              placeholder="info@yourcompany.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onboard-phone" className="flex items-center gap-2">
              <Phone className="size-3.5 text-muted-foreground" />
              Phone
            </Label>
            <Input
              id="onboard-phone"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Building2 className="size-4" />
            )}
            Get Started
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            You can update these details anytime in Company Settings.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
