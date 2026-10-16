import "server-only";
import type { BuildingInsights } from "@/lib/solar";

const QUALITY_FALLBACK = ["HIGH", "MEDIUM", "LOW"] as const;

export class NotFoundError extends Error {}

function apiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY is not set");
  return key;
}

export type GeocodeResult = {
  formattedAddress: string;
  lat: number;
  lng: number;
};

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", apiKey());

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  if (data.status === "ZERO_RESULTS") {
    throw new NotFoundError(`Address could not be geocoded: ${address}`);
  }
  if (data.status !== "OK") {
    throw new Error(
      `Geocoding failed (${data.status})${data.error_message ? `: ${data.error_message}` : ""}`,
    );
  }

  const result = data.results[0];
  return {
    formattedAddress: result.formatted_address,
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
  };
}

export async function findClosestBuilding(lat: number, lng: number): Promise<BuildingInsights> {
  for (const quality of QUALITY_FALLBACK) {
    const url = new URL("https://solar.googleapis.com/v1/buildingInsights:findClosest");
    url.searchParams.set("location.latitude", lat.toFixed(6));
    url.searchParams.set("location.longitude", lng.toFixed(6));
    url.searchParams.set("requiredQuality", quality);
    url.searchParams.set("key", apiKey());

    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) return (await res.json()) as BuildingInsights;

    const body = await res.json().catch(() => null);
    if (res.status === 404) continue;

    throw new Error(
      `Solar API error ${res.status}: ${body?.error?.message ?? res.statusText}`,
    );
  }

  throw new NotFoundError("No building with solar data found near this address");
}

export type DataLayersResponse = {
  imageryDate?: { year: number; month: number; day: number };
  imageryProcessedDate?: { year: number; month: number; day: number };
  dsmUrl: string;
  rgbUrl: string;
  maskUrl: string;
  annualFluxUrl: string;
  monthlyFluxUrl: string;
  hourlyShadeUrls?: string[];
  imageryQuality: "HIGH" | "MEDIUM" | "LOW" | "BASE" | string;
};

/** Fetch Solar dataLayers URLs for a circular region around a point. */
export async function getDataLayers(
  lat: number,
  lng: number,
  radiusMeters = 50,
): Promise<DataLayersResponse> {
  for (const quality of [...QUALITY_FALLBACK, "BASE"] as const) {
    const url = new URL("https://solar.googleapis.com/v1/dataLayers:get");
    url.searchParams.set("location.latitude", lat.toFixed(5));
    url.searchParams.set("location.longitude", lng.toFixed(5));
    url.searchParams.set("radiusMeters", String(radiusMeters));
    url.searchParams.set("view", "FULL_LAYERS");
    url.searchParams.set("requiredQuality", quality);
    url.searchParams.set("pixelSizeMeters", "0.5");
    url.searchParams.set("key", apiKey());

    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) return (await res.json()) as DataLayersResponse;

    const body = await res.json().catch(() => null);
    if (res.status === 404) continue;

    throw new Error(
      `Data layers error ${res.status}: ${body?.error?.message ?? res.statusText}`,
    );
  }

  throw new NotFoundError("No solar data layers found near this location");
}

/** Download a Solar GeoTIFF binary, appending the server API key when needed. */
export async function fetchGeoTiffBinary(url: string): Promise<ArrayBuffer> {
  const solarUrl = url.includes("solar.googleapis.com")
    ? `${url}${url.includes("?") ? "&" : "?"}key=${apiKey()}`
    : url;

  const res = await fetch(solarUrl, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      `GeoTIFF download failed ${res.status}: ${body?.error?.message ?? res.statusText}`,
    );
  }
  return res.arrayBuffer();
}
