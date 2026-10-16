"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EligibilityBadge } from "@/components/eligibility-badge";
import { FetchSolarButton } from "@/components/fetch-solar-button";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEligibility } from "@/lib/eligibility";
import { formatNumber } from "@/lib/solar";

export type LeadRow = {
  id: string;
  name: string;
  phone: string;
  address: string;
  solarStatus: string;
  sunshineHoursPerYear: number | null;
  roofAreaM2: number | null;
  maxPanelCount: number | null;
  selectedPanelCount: number | null;
  selectedEnergyKwh: number | null;
  kwhPerPanel: number | null;
  kwhPerKw: number | null;
};

type FilterValue = "all" | "eligible" | "not_eligible";

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  const [filter, setFilter] = useState<FilterValue>("eligible");

  const filtered = useMemo(() => {
    if (filter === "all") return leads;
    return leads.filter((lead) => getEligibility(lead.kwhPerKw) === filter);
  }, [leads, filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <label htmlFor="eligibility-filter" className="text-sm text-muted-foreground">
          Eligibility
        </label>
        <select
          id="eligibility-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterValue)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="all">All</option>
          <option value="eligible">Eligible</option>
          <option value="not_eligible">Not eligible</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No leads match this eligibility filter.
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
              <TableHead>Eligibility</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((lead) => (
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
                <TableCell>
                  <EligibilityBadge eligibility={getEligibility(lead.kwhPerKw)} />
                </TableCell>
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
    </div>
  );
}
