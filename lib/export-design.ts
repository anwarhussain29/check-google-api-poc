import type { Bounds } from "@/lib/geotiff";
import { latLngToMapPixel, type MapFrame } from "@/lib/map-frame";
import type { PanelPolygon } from "@/lib/panel-polygons";
import { formatNumber } from "@/lib/solar";

type ExportInput = {
  source: HTMLCanvasElement;
  bounds: Bounds;
  panels: PanelPolygon[];
  panelCount: number;
  energyKwh: number;
};

function frameFromHeaders(headers: Headers): MapFrame {
  const frame: MapFrame = {
    centerLat: Number(headers.get("X-Map-Center-Lat")),
    centerLng: Number(headers.get("X-Map-Center-Lng")),
    zoom: Number(headers.get("X-Map-Zoom")),
    width: Number(headers.get("X-Map-Width")),
    height: Number(headers.get("X-Map-Height")),
    scale: Number(headers.get("X-Map-Scale")),
  };
  if (Object.values(frame).some((value) => !Number.isFinite(value))) {
    throw new Error("Satellite map response was missing its frame");
  }
  return frame;
}

async function fetchSatellite(bounds: Bounds): Promise<{ image: ImageBitmap; frame: MapFrame }> {
  const params = new URLSearchParams({
    north: String(bounds.north),
    south: String(bounds.south),
    east: String(bounds.east),
    west: String(bounds.west),
  });
  const response = await fetch(`/api/solar/static-map?${params}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Satellite map failed (${response.status})`);
  }

  const frame = frameFromHeaders(response.headers);
  const image = await createImageBitmap(await response.blob());
  return { image, frame };
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create the image"));
    }, "image/png");
  });
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export type SaveResult = "shared" | "downloaded" | "preview";

/** Share or download a PNG. iOS Safari often blocks a download started after async work, so callers should show a preview when this returns "preview". */
export async function saveSolarDesign(blob: Blob): Promise<SaveResult> {
  const file = new File([blob], "solar-design.png", { type: "image/png" });
  if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Solar design" });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "shared";
    }
  }

  if (!isIos()) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "solar-design.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "downloaded";
  }

  return "preview";
}

/** Build a PNG of the satellite map, current overlay, panels, and summary footer. */
export async function renderSolarDesign({
  source,
  bounds,
  panels,
  panelCount,
  energyKwh,
}: ExportInput): Promise<Blob> {
  const { image, frame } = await fetchSatellite(bounds);
  try {
  const scale = Math.max(1, image.width / 640);
  const footer = Math.round(72 * scale);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height + footer;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create export canvas");

  ctx.drawImage(image, 0, 0);

  const topLeft = latLngToMapPixel(
    bounds.north,
    bounds.west,
    frame,
    image.width,
    image.height,
  );
  const bottomRight = latLngToMapPixel(
    bounds.south,
    bounds.east,
    frame,
    image.width,
    image.height,
  );
  ctx.drawImage(
    source,
    topLeft.x,
    topLeft.y,
    bottomRight.x - topLeft.x,
    bottomRight.y - topLeft.y,
  );

  for (const panel of panels) {
    if (panel.path.length === 0) continue;
    ctx.beginPath();
    panel.path.forEach((point, index) => {
      const { x, y } = latLngToMapPixel(
        point.lat,
        point.lng,
        frame,
        image.width,
        image.height,
      );
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = panel.fillColor;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#B0BEC5";
    ctx.lineWidth = Math.max(1, scale);
    ctx.stroke();
  }

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, image.height, canvas.width, footer);
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 ${Math.round(28 * scale)}px sans-serif`;
  ctx.textBaseline = "middle";
  const textY = image.height + footer / 2;
  ctx.textAlign = "left";
  ctx.fillText(`${formatNumber(panelCount)} panels`, 28 * scale, textY);
  ctx.textAlign = "right";
  ctx.fillText(`${formatNumber(energyKwh)} kWh/yr`, canvas.width - 28 * scale, textY);
  return canvasToBlob(canvas);
  } finally {
    image.close();
  }
}
