import { NextRequest, NextResponse } from "next/server";
import { fetchGeoTiffBinary } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const allowed =
    parsed.hostname.endsWith("googleapis.com") ||
    parsed.hostname.endsWith("googleusercontent.com") ||
    parsed.hostname === "storage.googleapis.com";
  if (!allowed) {
    return NextResponse.json({ error: "URL host not allowed" }, { status: 400 });
  }

  try {
    const buffer = await fetchGeoTiffBinary(url);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/tiff",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to download GeoTIFF";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
