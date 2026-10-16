import { ironPalette, rainbowPalette } from "@/lib/colors";
import { downloadGeoTIFF, type Bounds, type DataLayersUrls, type GeoTiff } from "@/lib/geotiff";
import { renderPalette, renderRGB } from "@/lib/visualize";

export type OverlayLayerId = "flux" | "dsm" | "rgb";

export type LoadedLayers = {
  mask: GeoTiff;
  rgb: GeoTiff;
  dsm: GeoTiff;
  monthlyFlux: GeoTiff;
  annualFlux: GeoTiff;
  bounds: Bounds;
};

export async function loadSolarLayers(urls: DataLayersUrls): Promise<LoadedLayers> {
  const [mask, rgb, dsm, monthlyFlux, annualFlux] = await Promise.all([
    downloadGeoTIFF(urls.maskUrl),
    downloadGeoTIFF(urls.rgbUrl),
    downloadGeoTIFF(urls.dsmUrl),
    downloadGeoTIFF(urls.monthlyFluxUrl),
    downloadGeoTIFF(urls.annualFluxUrl),
  ]);

  return {
    mask,
    rgb,
    dsm,
    monthlyFlux,
    annualFlux,
    bounds: mask.bounds,
  };
}

export function renderOverlayCanvas(
  layers: LoadedLayers,
  layerId: OverlayLayerId,
  maskRoof: boolean,
  monthIndex: number,
): HTMLCanvasElement {
  const mask = maskRoof ? layers.mask : undefined;

  if (layerId === "rgb") {
    return renderRGB(layers.rgb, mask);
  }

  if (layerId === "dsm") {
    const sorted = [...layers.dsm.rasters[0]].sort((a, b) => a - b);
    return renderPalette({
      data: layers.dsm,
      mask,
      colors: rainbowPalette,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    });
  }

  // Flux: prefer monthly band; fall back to annual if monthly missing
  if (layers.monthlyFlux.rasters.length >= 12) {
    return renderPalette({
      data: layers.monthlyFlux,
      mask,
      colors: ironPalette,
      min: 0,
      max: 200,
      index: monthIndex,
    });
  }

  return renderPalette({
    data: layers.annualFlux,
    mask,
    colors: ironPalette,
    min: 0,
    max: 1800,
  });
}
