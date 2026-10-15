export type LatLng = { latitude: number; longitude: number };

export type SolarPanelConfig = {
  panelsCount: number;
  yearlyEnergyDcKwh: number;
  roofSegmentSummaries?: unknown[];
};

export type BuildingInsights = {
  name: string;
  center: LatLng;
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
    solarPanelConfigs?: SolarPanelConfig[];
  };
};

export type SolarMetrics = {
  sunshineHoursPerYear: number;
  roofAreaM2: number;
  maxPanelCount: number;
  co2KgPerMwh: number;
};

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
