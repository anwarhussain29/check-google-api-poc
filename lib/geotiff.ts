import * as geotiff from "geotiff";
import { toProj4 } from "geotiff-geokeys-to-proj4";
import proj4 from "proj4";

export type Bounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type GeoTiff = {
  width: number;
  height: number;
  rasters: number[][];
  bounds: Bounds;
};

export type DataLayersUrls = {
  dsmUrl: string;
  rgbUrl: string;
  maskUrl: string;
  annualFluxUrl: string;
  monthlyFluxUrl: string;
  imageryQuality?: string;
};

/** Download + parse a Solar GeoTIFF via our authenticated proxy. */
export async function downloadGeoTIFF(url: string): Promise<GeoTiff> {
  const proxy = `/api/solar/geotiff?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxy);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `GeoTIFF download failed (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const tiff = await geotiff.fromArrayBuffer(arrayBuffer);
  const image = await tiff.getImage();
  const rasters = await image.readRasters();

  const projObj = toProj4(image.getGeoKeys() || {});
  const projection = proj4(projObj.proj4, "WGS84");
  const box = image.getBoundingBox();
  const sw = projection.forward(projObj.convertCoordinates({ x: box[0], y: box[1] }));
  const ne = projection.forward(projObj.convertCoordinates({ x: box[2], y: box[3] }));

  return {
    width: rasters.width,
    height: rasters.height,
    rasters: [...Array(rasters.length).keys()].map((i) =>
      Array.from(rasters[i] as geotiff.TypedArray),
    ),
    bounds: {
      north: ne.y,
      south: sw.y,
      east: ne.x,
      west: sw.x,
    },
  };
}

export async function fetchDataLayerUrls(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<DataLayersUrls> {
  const res = await fetch(
    `/api/solar/data-layers?lat=${lat}&lng=${lng}&radius=${radiusMeters}`,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Data layers failed (${res.status})`);
  }
  return res.json();
}
