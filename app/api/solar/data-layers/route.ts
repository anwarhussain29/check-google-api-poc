import { NextRequest, NextResponse } from "next/server";
import { getDataLayers, NotFoundError } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const lat = Number.parseFloat(req.nextUrl.searchParams.get("lat") ?? "");
  const lng = Number.parseFloat(req.nextUrl.searchParams.get("lng") ?? "");
  const radius = Number.parseFloat(req.nextUrl.searchParams.get("radius") ?? "50");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  try {
    const layers = await getDataLayers(lat, lng, Number.isFinite(radius) ? radius : 50);
    return NextResponse.json(layers);
  } catch (e) {
    if (e instanceof NotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    const message = e instanceof Error ? e.message : "Failed to fetch data layers";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
