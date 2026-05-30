import { useMutation, useQuery } from "convex/react";
import { Check, Droplets, Loader2, PenLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";

/* ── Signature Pad ─────────────────────────────────────────────────── */
function SignaturePad({
  onSave,
  label = "Your Signature",
}: {
  onSave: (dataUrl: string) => void;
  label?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.nativeEvent.offsetX) * scaleX,
      y: (e.nativeEvent.offsetY) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    setDrawing(true);
    setHasStrokes(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    setDrawing(false);
  };

  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    setHasStrokes(false);
  };

  const save = () => {
    if (!canvasRef.current || !hasStrokes) return;
    onSave(canvasRef.current.toDataURL("image/png"));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-300">{label}</p>
        {hasStrokes && (
          <button
            onClick={clear}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full h-[120px] touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <p className="text-[11px] text-slate-500 text-center">
        Draw your signature above
      </p>
      {hasStrokes && (
        <button
          onClick={save}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
        >
          <PenLine className="size-4" />
          Apply Signature
        </button>
      )}
    </div>
  );
}

/* ── Form Type Labels ──────────────────────────────────────────────── */
const FORM_TYPE_LABELS: Record<string, string> = {
  customer_agreement: "Customer Agreement",
  service_request: "Service Request",
  referral_program: "Referral Program",
  water_test_booking: "Water Test Booking",
};

/* ── Main Page ─────────────────────────────────────────────────────── */
export function ContractSignPage() {
  const { token } = useParams<{ token: string }>();
  const contract = useQuery(api.contracts.getContractByToken, token ? { shareToken: token } : "skip");
  const signContract = useMutation(api.contracts.signContract);

  const [signature, setSignature] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Parse equipment JSON
  const equipment = (() => {
    if (!contract?.equipment) return [];
    try {
      const parsed = JSON.parse(contract.equipment);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [contract.equipment];
    }
  })();

  const handleSubmit = useCallback(async () => {
    if (!signature || !agreed || !token || submitting) return;
    setSubmitting(true);
    try {
      await signContract({
        shareToken: token,
        signature,
        signerType: "customer",
      });
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }, [signature, agreed, token, submitting, signContract]);

  // Mark as viewed
  useEffect(() => {
    // Future: track contract view
  }, [contract]);

  /* ── Loading ── */
  if (contract === undefined) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  /* ── Not found ── */
  if (!contract) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Droplets className="size-12 text-slate-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-200 mb-2">Form Not Found</h1>
          <p className="text-sm text-slate-500">
            This link may have expired or is invalid. Please contact your water treatment specialist for a new link.
          </p>
        </div>
      </div>
    );
  }

  /* ── Already signed ── */
  if (contract.customerSignature || submitted) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 size-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Check className="size-8 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-200 mb-2">
            {submitted ? "Signed Successfully!" : "Already Signed"}
          </h1>
          <p className="text-sm text-slate-500">
            {submitted
              ? "Thank you for signing. Your water treatment specialist will follow up with next steps."
              : "This form has already been signed. Contact your specialist if you have questions."}
          </p>
          {contract.company?.name && (
            <p className="text-xs text-slate-600 mt-4">
              Provided by {contract.company.name}
            </p>
          )}
        </div>
      </div>
    );
  }

  const formType = contract.formType || "customer_agreement";
  const formLabel = FORM_TYPE_LABELS[formType] || "Agreement";

  return (
    <div className="min-h-screen bg-[#070B14]">
      {/* Header */}
      <div className="border-b border-slate-800 bg-[#0a1020]">
        <div className="max-w-2xl mx-auto px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
              <Droplets className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">
                {formLabel}
              </h1>
              {contract.company?.name && (
                <p className="text-xs text-slate-500">{contract.company.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {/* Customer Info */}
        <section className="rounded-2xl border border-slate-800 bg-[#101826] p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Customer Information
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoRow label="Name" value={contract.customerName} />
            {contract.customerEmail && (
              <InfoRow label="Email" value={contract.customerEmail} />
            )}
            {contract.customerAddress && (
              <InfoRow label="Address" value={contract.customerAddress} />
            )}
          </div>
        </section>

        {/* Equipment & Pricing */}
        <section className="rounded-2xl border border-slate-800 bg-[#101826] p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            {formType === "service_request" ? "Service Details" : "Equipment & Pricing"}
          </h2>

          {equipment.length > 0 && (
            <div className="space-y-2">
              {equipment.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-slate-900/60 p-3"
                >
                  <span className="text-sm text-slate-300">
                    {typeof item === "string" ? item : item.name || item.description || JSON.stringify(item)}
                  </span>
                  {typeof item === "object" && item.price != null && (
                    <span className="text-sm font-semibold text-emerald-400">
                      ${Number(item.price).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <span className="text-sm font-medium text-slate-400">Total</span>
            <span className="text-xl font-bold text-emerald-400">
              ${contract.totalPrice.toLocaleString()}
            </span>
          </div>

          {contract.monthlyPayment != null && contract.monthlyPayment > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Monthly Payment</span>
              <span className="text-sm font-semibold text-cyan-400">
                ${contract.monthlyPayment.toLocaleString()}/mo
              </span>
            </div>
          )}

          {contract.paymentTerms && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Payment Terms</span>
              <span className="text-sm text-slate-300">{contract.paymentTerms}</span>
            </div>
          )}

          {contract.depositAmount != null && contract.depositAmount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Deposit Required</span>
              <span className="text-sm font-semibold text-amber-400">
                ${contract.depositAmount.toLocaleString()}
              </span>
            </div>
          )}

          {contract.installDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Installation Date</span>
              <span className="text-sm text-slate-300">
                {new Date(contract.installDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </section>

        {/* Signature */}
        <section className="rounded-2xl border border-slate-800 bg-[#101826] p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
            Signature
          </h2>

          {signature ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="size-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Signature applied</span>
                </div>
                <img
                  src={signature}
                  alt="Your signature"
                  className="h-16 object-contain opacity-80"
                />
              </div>
              <button
                onClick={() => setSignature(null)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Change signature
              </button>
            </div>
          ) : (
            <SignaturePad onSave={setSignature} />
          )}
        </section>

        {/* Terms */}
        <section className="rounded-2xl border border-slate-800 bg-[#101826] p-5 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 size-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 accent-cyan-500"
            />
            <span className="text-sm text-slate-400 leading-relaxed">
              I agree to the terms of this {formLabel.toLowerCase()}. I understand that my electronic
              signature is legally binding and equivalent to a handwritten signature.
            </span>
          </label>
        </section>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!signature || !agreed || submitting}
          className="w-full rounded-2xl py-4 text-base font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98]"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Submitting…
            </span>
          ) : (
            `Sign ${formLabel}`
          )}
        </button>

        <p className="text-center text-[11px] text-slate-600 pb-6">
          Powered by AquaReport · Secure electronic signature
        </p>
      </div>
    </div>
  );
}

/* ── Helper ── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm text-slate-200">{value}</p>
    </div>
  );
}
