"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  DownloadIcon,
  SearchIcon,
} from "lucide-react";
import Papa from "papaparse";
import { EligibilityBadge } from "@/components/eligibility-badge";
import { FetchSolarButton } from "@/components/fetch-solar-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEligibility, type Eligibility } from "@/lib/eligibility";
import { formatNumber } from "@/lib/solar";
import { cn } from "@/lib/utils";

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
  createdAt: string;
};

type EligibilityFilter = "all" | Eligibility;
type StatusFilter = "all" | "PENDING" | "SUCCESS" | "NOT_FOUND" | "ERROR";
type SortKey =
  | "createdAt"
  | "name"
  | "phone"
  | "address"
  | "status"
  | "sunshine"
  | "roof"
  | "panels"
  | "energy"
  | "kwhPerPanel"
  | "kwhPerKw";
type SortDirection = "asc" | "desc";
type PageSize = 10 | 25 | 50;

const PAGE_SIZES: PageSize[] = [10, 25, 50];

const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  SUCCESS: "Fetched",
  NOT_FOUND: "No coverage",
  ERROR: "Error",
};

const ELIGIBILITY_LABELS: Record<Eligibility, string> = {
  eligible: "Eligible",
  not_eligible: "Not eligible",
  unknown: "Unknown",
};

function statusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function compareText(a: string, b: string, direction: SortDirection) {
  const result = a.localeCompare(b, undefined, { sensitivity: "base" });
  return direction === "asc" ? result : -result;
}

function compareNumber(a: number | null, b: number | null, direction: SortDirection) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return direction === "asc" ? a - b : b - a;
}

function sortValue(lead: LeadRow, key: SortKey): string | number | null {
  switch (key) {
    case "createdAt":
      return lead.createdAt;
    case "name":
      return lead.name;
    case "phone":
      return lead.phone;
    case "address":
      return lead.address;
    case "status":
      return statusLabel(lead.solarStatus);
    case "sunshine":
      return lead.sunshineHoursPerYear;
    case "roof":
      return lead.roofAreaM2;
    case "panels":
      return lead.selectedPanelCount ?? lead.maxPanelCount;
    case "energy":
      return lead.selectedEnergyKwh;
    case "kwhPerPanel":
      return lead.kwhPerPanel;
    case "kwhPerKw":
      return lead.kwhPerKw;
  }
}

function compareLeads(a: LeadRow, b: LeadRow, key: SortKey, direction: SortDirection) {
  const left = sortValue(a, key);
  const right = sortValue(b, key);
  if (typeof left === "string" && typeof right === "string") {
    return compareText(left, right, direction);
  }
  return compareNumber(
    typeof left === "number" ? left : null,
    typeof right === "number" ? right : null,
    direction,
  );
}

function panelsLabel(lead: LeadRow) {
  if (lead.maxPanelCount == null) return "";
  return `${lead.selectedPanelCount ?? ""}/${lead.maxPanelCount}`;
}

function exportLeads(leads: LeadRow[]) {
  const csv = Papa.unparse(
    leads.map((lead) => ({
      Name: lead.name,
      Phone: lead.phone,
      Address: lead.address,
      Status: statusLabel(lead.solarStatus),
      "Sunshine (h/yr)": lead.sunshineHoursPerYear ?? "",
      "Roof (m2)": lead.roofAreaM2 ?? "",
      Panels: panelsLabel(lead),
      "Energy (kWh/yr)": lead.selectedEnergyKwh ?? "",
      "kWh/panel": lead.kwhPerPanel ?? "",
      "kWh/kW": lead.kwhPerKw ?? "",
      Eligibility: ELIGIBILITY_LABELS[getEligibility(lead.kwhPerKw)],
    })),
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "icheckenergy-leads.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function SortHeader({
  label,
  column,
  sortKey,
  direction,
  align = "left",
  onSort,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  direction: SortDirection;
  align?: "left" | "right";
  onSort: (column: SortKey) => void;
}) {
  const active = sortKey === column;
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onSort(column)}
        aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground",
          align === "right" && "w-full justify-end",
        )}
      >
        {label}
        {active ? (
          direction === "asc" ? (
            <ArrowUpIcon className="size-3.5" />
          ) : (
            <ArrowDownIcon className="size-3.5" />
          )
        ) : (
          <ArrowUpDownIcon className="size-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  const [search, setSearch] = useState("");
  const [eligibility, setEligibility] = useState<EligibilityFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(25);

  const sorted = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matched = leads.filter((lead) => {
      if (eligibility !== "all" && getEligibility(lead.kwhPerKw) !== eligibility) return false;
      if (status !== "all" && lead.solarStatus !== status) return false;
      if (!query) return true;
      return [lead.name, lead.phone, lead.address].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
    return [...matched].sort((a, b) => compareLeads(a, b, sortKey, direction));
  }, [leads, search, eligibility, status, sortKey, direction]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(startIndex, startIndex + pageSize);
  const rangeStart = sorted.length === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + pageSize, sorted.length);

  const onSort = (column: SortKey) => {
    if (sortKey === column) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(column);
      setDirection("asc");
    }
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search name, phone, or address"
            aria-label="Search leads"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Eligibility
            <select
              value={eligibility}
              onChange={(event) => {
                setEligibility(event.target.value as EligibilityFilter);
                setPage(1);
              }}
              className={SELECT_CLASS}
            >
              <option value="all">All</option>
              <option value="eligible">Eligible</option>
              <option value="not_eligible">Not eligible</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Status
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                setPage(1);
              }}
              className={SELECT_CLASS}
            >
              <option value="all">All</option>
              <option value="PENDING">Pending</option>
              <option value="SUCCESS">Fetched</option>
              <option value="NOT_FOUND">No coverage</option>
              <option value="ERROR">Error</option>
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={() => exportLeads(sorted)}
            disabled={sorted.length === 0}
          >
            <DownloadIcon data-icon="inline-start" />
            Export
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No leads match these filters.
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader
                  label="Name"
                  column="name"
                  sortKey={sortKey}
                  direction={direction}
                  onSort={onSort}
                />
                <SortHeader
                  label="Phone"
                  column="phone"
                  sortKey={sortKey}
                  direction={direction}
                  onSort={onSort}
                />
                <SortHeader
                  label="Address"
                  column="address"
                  sortKey={sortKey}
                  direction={direction}
                  onSort={onSort}
                />
                <SortHeader
                  label="Status"
                  column="status"
                  sortKey={sortKey}
                  direction={direction}
                  onSort={onSort}
                />
                <SortHeader
                  label="Sunshine (h/yr)"
                  column="sunshine"
                  sortKey={sortKey}
                  direction={direction}
                  align="right"
                  onSort={onSort}
                />
                <SortHeader
                  label="Roof (m2)"
                  column="roof"
                  sortKey={sortKey}
                  direction={direction}
                  align="right"
                  onSort={onSort}
                />
                <SortHeader
                  label="Panels"
                  column="panels"
                  sortKey={sortKey}
                  direction={direction}
                  align="right"
                  onSort={onSort}
                />
                <SortHeader
                  label="Energy (kWh/yr)"
                  column="energy"
                  sortKey={sortKey}
                  direction={direction}
                  align="right"
                  onSort={onSort}
                />
                <SortHeader
                  label="kWh/panel"
                  column="kwhPerPanel"
                  sortKey={sortKey}
                  direction={direction}
                  align="right"
                  onSort={onSort}
                />
                <SortHeader
                  label="kWh/kW"
                  column="kwhPerKw"
                  sortKey={sortKey}
                  direction={direction}
                  align="right"
                  onSort={onSort}
                />
                <TableHead>Eligibility</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((lead) => (
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {rangeStart}–{rangeEnd} of {sorted.length}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Rows
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value) as PageSize);
                    setPage(1);
                  }}
                  className={SELECT_CLASS}
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {pageCount}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= pageCount}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
