/* ──── Global Customer Selector ────
   Searchable dropdown of existing customers (from reports table).
   Use in every "create new" dialog to link records to customer profiles.
   ──── */

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Check, ChevronsUpDown, User } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Id } from "../../convex/_generated/dataModel";

interface CustomerOption {
  reportId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  waterScore?: number;
}

interface CustomerSelectProps {
  value?: string; // reportId
  onSelect: (customer: CustomerOption | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomerSelect({
  value,
  onSelect,
  placeholder = "Select customer…",
  className,
  disabled,
}: CustomerSelectProps) {
  const [open, setOpen] = useState(false);
  const reports = useQuery(api.reports.getMyReports);

  // Deduplicate by customer name (take most recent report per name)
  const customers: CustomerOption[] = [];
  const seen = new Set<string>();
  if (reports) {
    for (const r of reports) {
      const name = r.customerName?.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      customers.push({
        reportId: r._id,
        name,
        email: r.customerEmail || undefined,
        phone: r.customerPhone || undefined,
        address: r.customerAddress
          ? [r.customerAddress, r.customerCity, r.customerState, r.customerZip]
              .filter(Boolean)
              .join(", ")
          : undefined,
        waterScore: r.waterScore ?? undefined,
      });
    }
  }

  const selected = customers.find((c) => c.reportId === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", !selected && "text-muted-foreground", className)}
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <User className="size-3.5 shrink-0" />
              {selected.name}
              {selected.email && <span className="text-xs text-muted-foreground">({selected.email})</span>}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search customers…" />
          <CommandList>
            <CommandEmpty>No customers found.</CommandEmpty>
            <CommandGroup>
              {customers.map((c) => (
                <CommandItem
                  key={c.reportId}
                  value={`${c.name} ${c.email || ""} ${c.phone || ""}`}
                  onSelect={() => {
                    onSelect(c.reportId === value ? null : c);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 size-3.5", value === c.reportId ? "opacity-100" : "opacity-0")} />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">{c.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {[c.email, c.phone].filter(Boolean).join(" · ") || "No contact info"}
                    </span>
                  </div>
                  {c.waterScore !== undefined && (
                    <span className="ml-auto text-xs font-mono text-muted-foreground">{c.waterScore}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export type { CustomerOption };
