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

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the satellite map"));
    image.src = url;
  });
}

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

async function fetchSatellite(bounds: Bounds): Promise<{ image: HTMLImageElement; frame: MapFrame }> {
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
  const blobUrl = URL.createObjectURL(await response.blob());
  try {
    const image = await loadImage(blobUrl);
    return { image, frame };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

/** Satellite map, current overlay, panels, and a summary footer, downloaded as a PNG. */
export async function downloadSolarDesign({
  source,
  bounds,
  panels,
  panelCount,
  energyKwh,
}: ExportInput) {
  const { image, frame } = await fetchSatellite(bounds);
  const scale = Math.max(1, image.naturalWidth / 640);
  const footer = Math.round(72 * scale);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight + footer;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create export canvas");

  ctx.drawImage(image, 0, 0);

  const topLeft = latLngToMapPixel(
    bounds.north,
    bounds.west,
    frame,
    image.naturalWidth,
    image.naturalHeight,
  );
  const bottomRight = latLngToMapPixel(
    bounds.south,
    bounds.east,
    frame,
    image.naturalWidth,
    image.naturalHeight,
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
        image.naturalWidth,
        image.naturalHeight,
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
  ctx.fillRect(0, image.naturalHeight, canvas.width, footer);
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 ${Math.round(28 * scale)}px sans-serif`;
  ctx.textBaseline = "middle";
  const textY = image.naturalHeight + footer / 2;
  ctx.textAlign = "left";
  ctx.fillText(`${formatNumber(panelCount)} panels`, 28 * scale, textY);
  ctx.textAlign = "right";
  ctx.fillText(`${formatNumber(energyKwh)} kWh/yr`, canvas.width - 28 * scale, textY);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "solar-design.png";
  link.click();
}
