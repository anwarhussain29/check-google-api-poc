import { NextRequest, NextResponse } from "next/server";
import { frameForBounds } from "@/lib/map-frame";

export const dynamic = "force-dynamic";

function apiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY is not set");
  return key;
}

export async function GET(req: NextRequest) {
  const north = Number.parseFloat(req.nextUrl.searchParams.get("north") ?? "");
  const south = Number.parseFloat(req.nextUrl.searchParams.get("south") ?? "");
  const east = Number.parseFloat(req.nextUrl.searchParams.get("east") ?? "");
  const west = Number.parseFloat(req.nextUrl.searchParams.get("west") ?? "");

  if (![north, south, east, west].every(Number.isFinite) || north <= south || east <= west) {
    return NextResponse.json({ error: "A valid map bounds is required" }, { status: 400 });
  }

  const frame = frameForBounds({ north, south, east, west });
  const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
  url.searchParams.set("center", `${frame.centerLat},${frame.centerLng}`);
  url.searchParams.set("zoom", String(frame.zoom));
  url.searchParams.set("size", `${frame.width}x${frame.height}`);
  url.searchParams.set("scale", String(frame.scale));
  url.searchParams.set("maptype", "satellite");
  url.searchParams.set("key", apiKey());

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { error: `Satellite map failed (${res.status}): ${body.slice(0, 180)}` },
        { status: 502 },
      );
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      const body = await res.text();
      return NextResponse.json(
        { error: body.slice(0, 180) || "Satellite map did not return an image" },
        { status: 502 },
      );
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        "X-Map-Center-Lat": String(frame.centerLat),
        "X-Map-Center-Lng": String(frame.centerLng),
        "X-Map-Zoom": String(frame.zoom),
        "X-Map-Scale": String(frame.scale),
        "X-Map-Width": String(frame.width),
        "X-Map-Height": String(frame.height),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch satellite map";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
