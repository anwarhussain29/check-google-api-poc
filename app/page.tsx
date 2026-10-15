import Link from "next/link";
import { AddLeadDialog } from "@/components/add-lead-dialog";
import { CsvImport } from "@/components/csv-import";
import { FetchSolarButton } from "@/components/fetch-solar-button";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatNumber } from "@/lib/solar";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl">Leads</CardTitle>
          <CardDescription>
            Import leads, then fetch Google Solar API building insights for each address.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <CsvImport />
          <AddLeadDialog />
        </div>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            No leads yet. Add one manually or import a CSV.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sunshine (h/yr)</TableHead>
                <TableHead className="text-right">Roof (m2)</TableHead>
                <TableHead className="text-right">Panels</TableHead>
                <TableHead className="text-right">Energy (kWh/yr)</TableHead>
                <TableHead className="text-right">kWh/panel</TableHead>
                <TableHead className="text-right">kWh/kW</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">
                    <Link href={`/leads/${lead.id}`} className="hover:underline">
                      {lead.name}
                    </Link>
                  </TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell className="max-w-xs truncate" title={lead.address}>
                    {lead.address}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={lead.solarStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(lead.sunshineHoursPerYear)}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(lead.roofAreaM2)}</TableCell>
                  <TableCell className="text-right">
                    {lead.maxPanelCount != null
                      ? `${lead.selectedPanelCount ?? "-"}/${lead.maxPanelCount}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(lead.selectedEnergyKwh)}
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(lead.kwhPerPanel)}</TableCell>
                  <TableCell className="text-right">{formatNumber(lead.kwhPerKw)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <FetchSolarButton
                        leadId={lead.id}
                        hasData={lead.solarStatus === "SUCCESS"}
                        size="sm"
                      />
                      <Link
                        href={`/leads/${lead.id}`}
                        className="inline-flex h-7 items-center rounded-md px-2.5 text-[0.8rem] font-medium hover:bg-muted"
                      >
                        View
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
