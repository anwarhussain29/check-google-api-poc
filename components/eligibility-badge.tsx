import { Badge } from "@/components/ui/badge";
import type { Eligibility } from "@/lib/eligibility";
import { cn } from "@/lib/utils";

const STYLES: Record<Exclude<Eligibility, "unknown">, { label: string; className: string }> = {
  eligible: { label: "Eligible", className: "bg-green-100 text-green-700" },
  not_eligible: { label: "Not eligible", className: "bg-red-100 text-red-700" },
};

export function EligibilityBadge({ eligibility }: { eligibility: Eligibility }) {
  if (eligibility === "unknown") {
    return <span className="text-muted-foreground">—</span>;
  }
  const style = STYLES[eligibility];
  return <Badge className={cn("border-transparent", style.className)}>{style.label}</Badge>;
}
