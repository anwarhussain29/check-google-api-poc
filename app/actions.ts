"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { findClosestBuilding, geocodeAddress, NotFoundError } from "@/lib/google";
import {
  configForPanelCount,
  defaultConfig,
  extractMetrics,
  type BuildingInsights,
} from "@/lib/solar";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

type LeadInput = { name: string; phone: string; address: string };

function normalize(input: Partial<LeadInput>): LeadInput | null {
  const name = input.name?.toString().trim() ?? "";
  const phone = input.phone?.toString().trim() ?? "";
  const address = input.address?.toString().trim() ?? "";
  if (!name || !phone || !address) return null;
  return { name, phone, address };
}

export async function createLead(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const lead = normalize({
    name: formData.get("name")?.toString(),
    phone: formData.get("phone")?.toString(),
    address: formData.get("address")?.toString(),
  });
  if (!lead) return { ok: false, error: "Name, phone and address are required" };

  await db.lead.create({ data: { ...lead, source: "manual" } });
  revalidatePath("/");
  return { ok: true, message: `Lead "${lead.name}" added` };
}

export async function importLeadsCsv(
  rows: Partial<LeadInput>[],
): Promise<{ inserted: number; skipped: number }> {
  const valid = rows.map(normalize).filter((r): r is LeadInput => r !== null);
  if (valid.length > 0) {
    await db.lead.createMany({ data: valid.map((r) => ({ ...r, source: "csv" })) });
  }
  revalidatePath("/");
  return { inserted: valid.length, skipped: rows.length - valid.length };
}

export async function fetchSolarForLead(id: string): Promise<ActionResult> {
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return { ok: false, error: "Lead not found" };

  try {
    const geo = await geocodeAddress(lead.address);
    const insights = await findClosestBuilding(geo.lat, geo.lng);
    const metrics = extractMetrics(insights);
    const config = defaultConfig(insights);

    await db.lead.update({
      where: { id },
      data: {
        ...metrics,
        solarStatus: "SUCCESS",
        solarError: null,
        formattedAddress: geo.formattedAddress,
        lat: insights.center?.latitude ?? geo.lat,
        lng: insights.center?.longitude ?? geo.lng,
        imageryQuality: insights.imageryQuality,
        selectedPanelCount: config?.panelsCount ?? null,
        selectedEnergyKwh: config?.yearlyEnergyDcKwh ?? null,
        rawInsights: JSON.stringify(insights),
        solarFetchedAt: new Date(),
      },
    });
    revalidatePath("/");
    revalidatePath(`/leads/${id}`);
    return { ok: true, message: "Solar data fetched" };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    await db.lead.update({
      where: { id },
      data: {
        solarStatus: err instanceof NotFoundError ? "NOT_FOUND" : "ERROR",
        solarError: error,
        solarFetchedAt: new Date(),
      },
    });
    revalidatePath("/");
    revalidatePath(`/leads/${id}`);
    return { ok: false, error };
  }
}

export async function savePanelSelection(id: string, panelCount: number): Promise<ActionResult> {
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead?.rawInsights) return { ok: false, error: "No solar data for this lead" };

  const insights = JSON.parse(lead.rawInsights) as BuildingInsights;
  const config = configForPanelCount(insights, panelCount);
  if (!config) return { ok: false, error: "No panel configurations available" };

  await db.lead.update({
    where: { id },
    data: {
      selectedPanelCount: config.panelsCount,
      selectedEnergyKwh: config.yearlyEnergyDcKwh,
    },
  });
  revalidatePath("/");
  return { ok: true };
}
