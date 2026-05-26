import { Check, Droplets, Mail, MapPin, Phone, User } from "lucide-react";

interface Props {
  report: any;
  onNext: () => void;
}

export function DemoCustomerStep({ report, onNext }: Props) {
  return (
    <div className="mx-auto w-full max-w-5xl px-8 space-y-6 pt-4">
      {/* Greeting */}
      <div className="text-center">
        <div className="inline-flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 mb-4">
          <User className="size-7 text-blue-400" />
        </div>
        <h2 className="text-2xl font-black">
          Welcome, {report.customerName?.split(" ")[0] || "Homeowner"}
        </h2>
        <p className="mt-1 text-sm text-white/50">
          Let's take a look at your home's water quality
        </p>
      </div>

      {/* Customer Info Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/15">
            <User className="size-5 text-blue-400" />
          </div>
          <div>
            <p className="font-bold">{report.customerName || "Homeowner"}</p>
            <p className="text-xs text-white/40">Homeowner</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {report.customerAddress && (
            <div className="flex items-center gap-2.5 text-sm text-white/70">
              <MapPin className="size-4 shrink-0 text-white/30" />
              <span>
                {report.customerAddress}, {report.customerCity || report.city},{" "}
                {report.customerState || report.state}{" "}
                {report.customerZip || report.zip}
              </span>
            </div>
          )}
          {!report.customerAddress && (
            <div className="flex items-center gap-2.5 text-sm text-white/70">
              <MapPin className="size-4 shrink-0 text-white/30" />
              <span>
                {report.city}, {report.state} {report.zip}
              </span>
            </div>
          )}
          {report.customerEmail && (
            <div className="flex items-center gap-2.5 text-sm text-white/70">
              <Mail className="size-4 shrink-0 text-white/30" />
              {report.customerEmail}
            </div>
          )}
          {report.customerPhone && (
            <div className="flex items-center gap-2.5 text-sm text-white/70">
              <Phone className="size-4 shrink-0 text-white/30" />
              {report.customerPhone}
            </div>
          )}
        </div>
      </div>

      {/* Utility Info */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/15">
            <Droplets className="size-5 text-cyan-400" />
          </div>
          <div>
            <p className="font-bold text-sm">{report.utilityName}</p>
            <p className="text-xs text-white/40">Water Utility</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/5 p-3 text-center">
            <p className="text-lg font-black">
              {report.populationServed?.toLocaleString() ?? "—"}
            </p>
            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
              People Served
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-3 text-center">
            <p className="text-lg font-black capitalize">{report.waterSource}</p>
            <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
              Water Source
            </p>
          </div>
        </div>
      </div>

      {/* What we'll cover */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
          What we'll cover today
        </p>
        <div className="space-y-2.5">
          {[
            "Your water's contaminant profile",
            "Your AquaScore rating",
            "The right solution for your home",
            "Real-time water testing",
            "Cost comparison & next steps",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="flex size-5 items-center justify-center rounded-full bg-blue-500/20">
                <Check className="size-3 text-blue-400" />
              </div>
              <span className="text-sm text-white/70">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-transform"
        style={{
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
        }}
      >
        Let's Get Started →
      </button>
    </div>
  );
}
