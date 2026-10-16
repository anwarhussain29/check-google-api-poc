export type LatLng = { latitude: number; longitude: number };

export type LatLngBox = { sw: LatLng; ne: LatLng };

export type SolarPanelConfig = {
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  roofSegmentSummaries?: RoofSegmentSummary[];
};

export type RoofSegmentSummary = {
  pitchDegrees: number;
  azimuthDegrees: number;
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  segmentIndex: number;
};

export type SolarPanel = {
  center: LatLng;
  orientation: "LANDSCAPE" | "PORTRAIT" | string;
  segmentIndex: number;
  yearlyEnergyDcKwh: number;
};

export type RoofSegmentSizeAndSunshineStats = {
  pitchDegrees: number;
  azimuthDegrees: number;
  stats?: { areaMeters2: number; groundAreaMeters2?: number };
  center?: LatLng;
  boundingBox?: LatLngBox;
  planeHeightAtCenterMeters?: number;
};

export type BuildingInsights = {
  name: string;
  center: LatLng;
  boundingBox?: LatLngBox;
  imageryQuality: "HIGH" | "MEDIUM" | "LOW" | "BASE" | string;
  imageryDate?: { year: number; month: number; day: number };
  postalCode?: string;
  administrativeArea?: string;
  regionCode?: string;
  solarPotential: {
    maxArrayPanelsCount: number;
    maxArrayAreaMeters2: number;
    maxSunshineHoursPerYear: number;
    carbonOffsetFactorKgPerMwh: number;
    panelCapacityWatts: number;
    panelHeightMeters: number;
    panelWidthMeters: number;
    panelLifetimeYears: number;
    wholeRoofStats: { areaMeters2: number; groundAreaMeters2?: number };
    roofSegmentStats?: RoofSegmentSizeAndSunshineStats[];
    solarPanels?: SolarPanel[];
    solarPanelConfigs?: SolarPanelConfig[];
  };
};

export type SolarMetrics = {
  sunshineHoursPerYear: number;
  roofAreaM2: number;
  maxPanelCount: number;
  co2KgPerMwh: number;
};

export type MapLatLng = { lat: number; lng: number };

export function extractMetrics(insights: BuildingInsights): SolarMetrics {
  const p = insights.solarPotential;
  return {
    sunshineHoursPerYear: p.maxSunshineHoursPerYear,
    roofAreaM2: p.wholeRoofStats?.areaMeters2 ?? 0,
    maxPanelCount: p.maxArrayPanelsCount,
    co2KgPerMwh: p.carbonOffsetFactorKgPerMwh,
  };
}

export function getPanelConfigs(insights: BuildingInsights): SolarPanelConfig[] {
  return insights.solarPotential.solarPanelConfigs ?? [];
}

/** Picks the config with the largest panelsCount that does not exceed the requested count. */
export function configForPanelCount(
  insights: BuildingInsights,
  panelCount: number,
): SolarPanelConfig | undefined {
  const configs = getPanelConfigs(insights);
  let match: SolarPanelConfig | undefined;
  for (const config of configs) {
    if (config.panelsCount <= panelCount) match = config;
  }
  return match ?? configs[0];
}

export function defaultConfig(insights: BuildingInsights): SolarPanelConfig | undefined {
  const configs = getPanelConfigs(insights);
  return configs[configs.length - 1];
}

export function productionFactors(config: SolarPanelConfig, panelCapacityWatts: number) {
  const { yearlyEnergyDcKwh, panelsCount } = config;
  const systemKw = (panelsCount * panelCapacityWatts) / 1000;
  return {
    kwhPerPanel: panelsCount > 0 ? yearlyEnergyDcKwh / panelsCount : null,
    kwhPerKw: systemKw > 0 ? yearlyEnergyDcKwh / systemKw : null,
  };
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return Math.round(value).toLocaleString("en-US");
}

/** First N panels from the Solar API list (order matches panel configs). */
export function panelsForCount(insights: BuildingInsights, count: number): SolarPanel[] {
  const panels = insights.solarPotential.solarPanels ?? [];
  return panels.slice(0, Math.max(0, count));
}

/**
 * Approximate data-layer radius from the building bounding box diagonal, or a fallback.
 */
export function dataLayersRadiusMeters(insights: BuildingInsights, fallback = 50): number {
  const box = insights.boundingBox;
  if (!box) return fallback;
  const latSpan = Math.abs(box.ne.latitude - box.sw.latitude);
  const lngSpan = Math.abs(box.ne.longitude - box.sw.longitude);
  const midLat = (box.ne.latitude + box.sw.latitude) / 2;
  const metersPerDegLat = 111_320;
  const metersPerDegLng = 111_320 * Math.cos((midLat * Math.PI) / 180);
  const diagonal = Math.hypot(latSpan * metersPerDegLat, lngSpan * metersPerDegLng);
  return Math.min(Math.max(Math.ceil(diagonal / 2) + 5, 25), 100);
}

type SphericalLibrary = {
  computeOffset: (
    from: MapLatLng,
    distance: number,
    heading: number,
  ) => { lat: () => number; lng: () => number } | MapLatLng;
};

/**
 * Compute panel rectangle corners using Maps geometry spherical offsets
 * (same approach as Google's js-solar-potential sample).
 */
export function panelRectanglePath(
  panel: SolarPanel,
  panelWidthMeters: number,
  panelHeightMeters: number,
  azimuthDegrees: number,
  spherical: SphericalLibrary,
): MapLatLng[] {
  const w = panelWidthMeters / 2;
  const h = panelHeightMeters / 2;
  const points = [
    { x: +w, y: +h },
    { x: +w, y: -h },
    { x: -w, y: -h },
    { x: -w, y: +h },
  ];
  const orientation = panel.orientation === "PORTRAIT" ? 90 : 0;
  const center = { lat: panel.center.latitude, lng: panel.center.longitude };

  return points.map(({ x, y }) => {
    const offset = spherical.computeOffset(
      center,
      Math.sqrt(x * x + y * y),
      Math.atan2(y, x) * (180 / Math.PI) + orientation + azimuthDegrees,
    );
    if (typeof (offset as { lat: unknown }).lat === "function") {
      const ll = offset as { lat: () => number; lng: () => number };
      return { lat: ll.lat(), lng: ll.lng() };
    }
    return offset as MapLatLng;
  });
}

export function panelAzimuthDegrees(insights: BuildingInsights, panel: SolarPanel): number {
  const segments = insights.solarPotential.roofSegmentStats ?? [];
  return segments[panel.segmentIndex]?.azimuthDegrees ?? 0;
}

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
