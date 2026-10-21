import type { Bounds } from "@/lib/geotiff";

/** Logical Static Maps size. `scale` doubles the returned pixels without changing coverage. */
export const STATIC_MAP_SIZE = 640;
export const STATIC_MAP_SCALE = 2;

export type MapFrame = {
  centerLat: number;
  centerLng: number;
  zoom: number;
  width: number;
  height: number;
  scale: number;
};

function mercatorY(lat: number): number {
  const siny = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999);
  return 0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI);
}

function mercatorX(lng: number): number {
  return 0.5 + lng / 360;
}

/** Highest zoom at which the bounds still fit inside a Static Maps image. */
export function frameForBounds(bounds: Bounds): MapFrame {
  const lngFraction = Math.abs(bounds.east - bounds.west) / 360;
  const latFraction = Math.abs(mercatorY(bounds.north) - mercatorY(bounds.south));
  const lngZoom = lngFraction > 0 ? Math.log2(STATIC_MAP_SIZE / 256 / lngFraction) : 20;
  const latZoom = latFraction > 0 ? Math.log2(STATIC_MAP_SIZE / 256 / latFraction) : 20;
  const zoom = Math.max(0, Math.min(21, Math.floor(Math.min(lngZoom, latZoom))));

  return {
    centerLat: (bounds.north + bounds.south) / 2,
    centerLng: (bounds.east + bounds.west) / 2,
    zoom,
    width: STATIC_MAP_SIZE,
    height: STATIC_MAP_SIZE,
    scale: STATIC_MAP_SCALE,
  };
}

/** Pixel on a Static Maps image for a lat/lng, using the image's real pixel size. */
export function latLngToMapPixel(
  lat: number,
  lng: number,
  frame: MapFrame,
  imageWidth: number,
  imageHeight: number,
): { x: number; y: number } {
  const world = 256 * frame.scale * 2 ** frame.zoom;
  const dx = (mercatorX(lng) - mercatorX(frame.centerLng)) * world;
  const dy = (mercatorY(lat) - mercatorY(frame.centerLat)) * world;
  return {
    x: imageWidth / 2 + dx,
    y: imageHeight / 2 + dy,
  };
}
