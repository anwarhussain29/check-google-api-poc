import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-slate-100 text-slate-700" },
  SUCCESS: { label: "Fetched", className: "bg-green-100 text-green-700" },
  NOT_FOUND: { label: "No coverage", className: "bg-amber-100 text-amber-800" },
  ERROR: { label: "Error", className: "bg-red-100 text-red-700" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? STYLES.PENDING;
  return <Badge className={cn("border-transparent", style.className)}>{style.label}</Badge>;
}
