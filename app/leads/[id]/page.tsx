import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, MapPinIcon, PhoneIcon, UserIcon } from "lucide-react";
import { FetchSolarButton } from "@/components/fetch-solar-button";
import { SolarViewer } from "@/components/solar-viewer";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import type { BuildingInsights } from "@/lib/solar";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) notFound();

  const insights = lead.rawInsights ? (JSON.parse(lead.rawInsights) as BuildingInsights) : null;
  const hasData = lead.solarStatus === "SUCCESS" && insights !== null;

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        All leads
      </Link>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="flex items-center gap-2 text-xl font-semibold">
                <UserIcon className="size-5 text-muted-foreground" />
                {lead.name}
              </h1>
              <StatusBadge status={lead.solarStatus} />
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <PhoneIcon className="size-4" />
              {lead.phone}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPinIcon className="size-4" />
              {lead.address}
              {lead.formattedAddress && lead.formattedAddress !== lead.address && (
                <span className="text-xs">(matched: {lead.formattedAddress})</span>
              )}
            </p>
            {lead.solarFetchedAt && (
              <p className="text-xs text-muted-foreground">
                Last fetched {lead.solarFetchedAt.toLocaleString()}
                {lead.imageryQuality && ` - imagery quality ${lead.imageryQuality}`}
              </p>
            )}
          </div>
          <FetchSolarButton leadId={lead.id} hasData={hasData} />
        </CardContent>
      </Card>

      {lead.solarError && lead.solarStatus !== "SUCCESS" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {lead.solarError}
        </div>
      )}

      {hasData && lead.lat != null && lead.lng != null ? (
        <div className="relative h-[calc(100dvh-10rem)] min-h-[480px] overflow-hidden rounded-2xl border md:h-[760px]">
          <SolarViewer
            key={lead.solarFetchedAt?.toISOString()}
            leadId={lead.id}
            lat={lead.lat}
            lng={lead.lng}
            insights={insights}
            initialPanelCount={lead.selectedPanelCount}
          />
        </div>
      ) : (
        lead.solarStatus === "PENDING" && (
          <div className="rounded-2xl border border-dashed bg-background py-20 text-center text-muted-foreground">
            Click &quot;Fetch Solar Data&quot; to load building insights for this address.
          </div>
        )
      )}
    </div>
  );
}
