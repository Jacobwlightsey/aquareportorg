import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

/**
 * Consistent empty state placeholder for pages with no data.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-16 text-center">
        <div className="mb-4 rounded-2xl bg-muted/8 p-4">
          <Icon className="size-10 text-muted-foreground/40" />
        </div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        {actionLabel && onAction && (
          <Button className="mt-5" onClick={onAction}>
            <Plus className="size-4 mr-1.5" />
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
