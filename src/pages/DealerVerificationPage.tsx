import { useAction, useConvex, useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  Copy,
  Droplets,
  FlaskConical,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../convex/_generated/api";

const SYSTEMS = [
  "Excalibur Chlor-A-Soft",
  "Excalibur Premium",
  "SpringWell CF1",
  "AquaOx FCS-2",
  "Pelican PC600",
  "US Water Matrixx",
  "Kind Water E-2000",
  "Pentair Pelican Whole House",
  "Other",
];

type CustomerForm = {
  customerName: string;
  customerAddress: string;
  customerZip: string;
  customerEmail: string;
  customerPhone: string;
};

type TestForm = CustomerForm & {
  chlorineFree: string;
  chlorineTotal: string;
  tds: string;
  ph: string;
  hardness: string;
  iron: string;
  lead: string;
  nitrate: string;
  equipmentUsed: string;
  filtrationRecommendation: string;
  notes: string;
  photos: string[];
};

type FiltrationForm = CustomerForm & {
  systemName: string;
  customSystemName: string;
  systemType: "whole_home" | "point_of_use";
  installDate: string;
  notes: string;
  photos: string[];
};

const baseCustomer: CustomerForm = {
  customerName: "",
  customerAddress: "",
  customerZip: "",
  customerEmail: "",
  customerPhone: "",
};

function numberOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

async function uploadPhotoUrls(
  files: FileList | null,
  generateUploadUrl: () => Promise<string>,
  getStorageUrl: (storageId: any) => Promise<string | null>,
) {
  const selected = Array.from(files ?? []).slice(0, 5);
  const urls: string[] = [];
  for (const file of selected) {
    const uploadUrl = await generateUploadUrl();
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!response.ok) throw new Error("Photo upload failed.");
    const { storageId } = await response.json();
    const url = await getStorageUrl(storageId);
    if (url) urls.push(url);
  }
  return urls;
}

function UpgradeCard({ message }: { message?: string }) {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/10">
          <Lock className="size-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Verification tools are locked</h2>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            {message || "Upgrade to Growth ($349/mo) to verify test results and issue consumer reports."}
          </p>
        </div>
        <Button asChild>
          <Link to="/subscription">Upgrade Plan</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ReferralResult({ url }: { url: string }) {
  if (!url) return null;
  return (
    <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20">
      <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-emerald-950 dark:text-emerald-100">Results saved. Referral link is ready.</p>
          <p className="break-all text-sm text-emerald-800 dark:text-emerald-200">{url}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void navigator.clipboard?.writeText(url);
            toast.success("Referral link copied.");
          }}
        >
          <Copy className="size-4" />
          Copy
        </Button>
      </CardContent>
    </Card>
  );
}

export function DealerVerificationPage() {
  const context = useQuery(api.dealerShared.getDealerContext);
  const convex = useConvex();
  const generateUploadUrl = useMutation(api.dealerShared.generateUploadUrl);
  const createInHomeTest = useAction(api.dealerShared.createInHomeTest);
  const createFiltrationVerification = useAction(api.dealerShared.createFiltrationVerification);
  const [saving, setSaving] = useState(false);
  const [referralUrl, setReferralUrl] = useState("");
  const [testForm, setTestForm] = useState<TestForm>({
    ...baseCustomer,
    chlorineFree: "",
    chlorineTotal: "",
    tds: "",
    ph: "",
    hardness: "",
    iron: "",
    lead: "",
    nitrate: "",
    equipmentUsed: "",
    filtrationRecommendation: "",
    notes: "",
    photos: [],
  });
  const [filtrationForm, setFiltrationForm] = useState<FiltrationForm>({
    ...baseCustomer,
    systemName: "Excalibur Chlor-A-Soft",
    customSystemName: "",
    systemType: "whole_home",
    installDate: new Date().toISOString().slice(0, 10),
    notes: "",
    photos: [],
  });

  if (context === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!context?.access.inHomeTests) {
    return <UpgradeCard message={context?.messages.growth} />;
  }

  const updateTest = (field: keyof TestForm, value: string | string[]) => {
    setTestForm((current) => ({ ...current, [field]: value }));
  };

  const updateFiltration = (field: keyof FiltrationForm, value: string | string[]) => {
    setFiltrationForm((current) => ({ ...current, [field]: value }));
  };

  const handlePhotos = async (files: FileList | null, setPhotos: (photos: string[]) => void) => {
    try {
      const urls = await uploadPhotoUrls(files, generateUploadUrl, (storageId) =>
        convex.query(api.dealerShared.getStorageUrl, { storageId }),
      );
      setPhotos(urls);
      if (urls.length) toast.success(`${urls.length} photo${urls.length === 1 ? "" : "s"} uploaded.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload photos.");
    }
  };

  const submitInHomeTest = async () => {
    if (!testForm.customerName || !testForm.customerAddress || !testForm.customerZip || !testForm.customerEmail) {
      toast.error("Customer name, address, ZIP, and email are required.");
      return;
    }
    setSaving(true);
    try {
      const result = await createInHomeTest({
        customerName: testForm.customerName,
        customerAddress: testForm.customerAddress,
        customerZip: testForm.customerZip,
        customerEmail: testForm.customerEmail,
        customerPhone: testForm.customerPhone || undefined,
        readings: {
          chlorine_free: numberOrUndefined(testForm.chlorineFree),
          chlorine_total: numberOrUndefined(testForm.chlorineTotal),
          tds: numberOrUndefined(testForm.tds),
          ph: numberOrUndefined(testForm.ph),
          hardness: numberOrUndefined(testForm.hardness),
          iron: numberOrUndefined(testForm.iron),
          lead: numberOrUndefined(testForm.lead),
          nitrate: numberOrUndefined(testForm.nitrate),
        },
        equipmentUsed: testForm.equipmentUsed || undefined,
        photos: testForm.photos,
        filtrationRecommendation: testForm.filtrationRecommendation || undefined,
        notes: testForm.notes || undefined,
      });
      setReferralUrl(result.referralUrl);
      toast.success("In-home test results saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save in-home results.");
    } finally {
      setSaving(false);
    }
  };

  const submitFiltration = async () => {
    if (!filtrationForm.customerName || !filtrationForm.customerAddress || !filtrationForm.customerZip) {
      toast.error("Customer name, address, and ZIP are required.");
      return;
    }
    setSaving(true);
    try {
      const systemName =
        filtrationForm.systemName === "Other"
          ? filtrationForm.customSystemName || "Other"
          : filtrationForm.systemName;
      const result = await createFiltrationVerification({
        customerName: filtrationForm.customerName,
        customerAddress: filtrationForm.customerAddress,
        customerZip: filtrationForm.customerZip,
        customerEmail: filtrationForm.customerEmail || undefined,
        customerPhone: filtrationForm.customerPhone || undefined,
        systemName,
        systemType: filtrationForm.systemType,
        installDate: filtrationForm.installDate,
        photos: filtrationForm.photos,
        notes: filtrationForm.notes || undefined,
      });
      setReferralUrl(result.referralUrl);
      toast.success("Filtration install verified.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not verify filtration install.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dealer Verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter trusted in-home results and verified filtration installs for MyAquaReport claims.
        </p>
      </div>

      <ReferralResult url={referralUrl} />

      <Tabs defaultValue="test">
        <TabsList>
          <TabsTrigger value="test">
            <FlaskConical className="size-4" />
            In-Home Test
          </TabsTrigger>
          <TabsTrigger value="filtration">
            <ShieldCheck className="size-4" />
            Filtration Install
          </TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="size-5 text-blue-500" />
                In-Home Test Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <CustomerFields values={testForm} onChange={updateTest} requireEmail />
              <div>
                <h3 className="mb-3 text-sm font-semibold">Test Readings</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <Field label="Chlorine Free" value={testForm.chlorineFree} unit="ppm" onChange={(v) => updateTest("chlorineFree", v)} />
                  <Field label="Chlorine Total" value={testForm.chlorineTotal} unit="ppm" onChange={(v) => updateTest("chlorineTotal", v)} />
                  <Field label="TDS" value={testForm.tds} unit="ppm" onChange={(v) => updateTest("tds", v)} />
                  <Field label="pH" value={testForm.ph} unit="0-14" onChange={(v) => updateTest("ph", v)} />
                  <Field label="Hardness" value={testForm.hardness} unit="gpg" onChange={(v) => updateTest("hardness", v)} />
                  <Field label="Iron" value={testForm.iron} unit="ppm" onChange={(v) => updateTest("iron", v)} />
                  <Field label="Lead" value={testForm.lead} unit="ppb" onChange={(v) => updateTest("lead", v)} />
                  <Field label="Nitrate" value={testForm.nitrate} unit="ppm" onChange={(v) => updateTest("nitrate", v)} />
                </div>
              </div>
              <MetaFields
                equipment={testForm.equipmentUsed}
                recommendation={testForm.filtrationRecommendation}
                notes={testForm.notes}
                onEquipment={(value) => updateTest("equipmentUsed", value)}
                onRecommendation={(value) => updateTest("filtrationRecommendation", value)}
                onNotes={(value) => updateTest("notes", value)}
                onPhotos={(files) => void handlePhotos(files, (photos) => updateTest("photos", photos))}
              />
              <Button onClick={submitInHomeTest} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Save Results & Generate Referral
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filtration" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-500" />
                Filtration Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <CustomerFields values={filtrationForm} onChange={updateFiltration} />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>System Name</Label>
                  <Select value={filtrationForm.systemName} onValueChange={(value) => updateFiltration("systemName", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SYSTEMS.map((system) => <SelectItem key={system} value={system}>{system}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {filtrationForm.systemName === "Other" && (
                  <div className="space-y-2">
                    <Label>Other System</Label>
                    <Input value={filtrationForm.customSystemName} onChange={(event) => updateFiltration("customSystemName", event.target.value)} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>System Type</Label>
                  <Select value={filtrationForm.systemType} onValueChange={(value: "whole_home" | "point_of_use") => updateFiltration("systemType", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whole_home">Whole home</SelectItem>
                      <SelectItem value="point_of_use">Point of use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Install Date</Label>
                  <Input type="date" value={filtrationForm.installDate} onChange={(event) => updateFiltration("installDate", event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Photos</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => void handlePhotos(event.target.files, (photos) => updateFiltration("photos", photos))}
                />
                <p className="text-xs text-muted-foreground">Optional proof of install. Up to 5 images.</p>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={filtrationForm.notes} onChange={(event) => updateFiltration("notes", event.target.value)} />
              </div>
              <Button onClick={submitFiltration} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Verify Install & Generate Referral
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CustomerFields({
  values,
  onChange,
  requireEmail = false,
}: {
  values: CustomerForm;
  onChange: (field: any, value: string) => void;
  requireEmail?: boolean;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">Customer</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Customer Name</Label>
          <Input value={values.customerName} onChange={(event) => onChange("customerName", event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Customer Email{requireEmail ? " *" : ""}</Label>
          <Input type="email" value={values.customerEmail} onChange={(event) => onChange("customerEmail", event.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Customer Address</Label>
          <Input value={values.customerAddress} onChange={(event) => onChange("customerAddress", event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Customer ZIP</Label>
          <Input maxLength={5} value={values.customerZip} onChange={(event) => onChange("customerZip", event.target.value.replace(/\D/g, "").slice(0, 5))} />
        </div>
        <div className="space-y-2">
          <Label>Customer Phone</Label>
          <Input value={values.customerPhone} onChange={(event) => onChange("customerPhone", event.target.value)} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, unit, onChange }: { label: string; value: string; unit: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input inputMode="decimal" value={value} placeholder={unit} onChange={(event) => onChange(event.target.value.replace(/[^\d.]/g, ""))} />
    </div>
  );
}

function MetaFields({
  equipment,
  recommendation,
  notes,
  onEquipment,
  onRecommendation,
  onNotes,
  onPhotos,
}: {
  equipment: string;
  recommendation: string;
  notes: string;
  onEquipment: (value: string) => void;
  onRecommendation: (value: string) => void;
  onNotes: (value: string) => void;
  onPhotos: (files: FileList | null) => void;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">Meta</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Equipment Used</Label>
          <Input value={equipment} placeholder="Hach test kit" onChange={(event) => onEquipment(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Filtration Recommendation</Label>
          <Input value={recommendation} placeholder="Excalibur Chlor-A-Soft" onChange={(event) => onRecommendation(event.target.value)} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Photos</Label>
          <Input type="file" accept="image/*" multiple onChange={(event) => onPhotos(event.target.files)} />
          <p className="text-xs text-muted-foreground">Optional. Up to 5 images.</p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(event) => onNotes(event.target.value)} />
        </div>
      </div>
    </div>
  );
}
