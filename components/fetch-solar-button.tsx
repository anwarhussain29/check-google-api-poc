"use client";

import { useTransition } from "react";
import { Loader2Icon, RefreshCwIcon, SunIcon } from "lucide-react";
import { toast } from "sonner";
import { fetchSolarForLead } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function FetchSolarButton({
  leadId,
  hasData,
  size = "default",
}: {
  leadId: string;
  hasData: boolean;
  size?: "default" | "sm";
}) {
  const [pending, startTransition] = useTransition();

  const onClick = () =>
    startTransition(async () => {
      const result = await fetchSolarForLead(leadId);
      if (result.ok) toast.success(result.message ?? "Solar data fetched");
      else toast.error(result.error);
    });

  const Icon = pending ? Loader2Icon : hasData ? RefreshCwIcon : SunIcon;

  return (
    <Button
      size={size}
      variant={hasData ? "outline" : "default"}
      onClick={onClick}
      disabled={pending}
    >
      <Icon className={pending ? "animate-spin" : undefined} />
      {pending ? "Fetching..." : hasData ? "Re-fetch" : "Fetch Solar Data"}
    </Button>
  );
}
