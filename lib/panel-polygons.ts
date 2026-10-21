import { panelsPalette } from "@/lib/colors";
import {
  panelAzimuthDegrees,
  panelRectanglePath,
  panelsForCount,
  type BuildingInsights,
  type MapLatLng,
} from "@/lib/solar";
import { createPalette, normalize, rgbToColor } from "@/lib/visualize";

type SphericalLibrary = {
  computeOffset: (
    from: MapLatLng,
    distance: number,
    heading: number,
  ) => { lat: () => number; lng: () => number } | MapLatLng;
};

export type PanelPolygon = {
  path: MapLatLng[];
  fillColor: string;
};

export function panelPolygons(
  insights: BuildingInsights,
  panelCount: number,
  spherical: SphericalLibrary,
): PanelPolygon[] {
  if (panelCount <= 0) return [];

  const potential = insights.solarPotential;
  const panels = panelsForCount(insights, panelCount);
  if (panels.length === 0) return [];

  const palette = createPalette(panelsPalette).map(rgbToColor);
  const energies = potential.solarPanels?.map((panel) => panel.yearlyEnergyDcKwh) ?? [];
  const minEnergy = energies.length ? Math.min(...energies) : 0;
  const maxEnergy = energies.length ? Math.max(...energies) : 1;

  return panels.map((panel) => {
    const colorIndex = Math.round(normalize(panel.yearlyEnergyDcKwh, maxEnergy, minEnergy) * 255);
    return {
      path: panelRectanglePath(
        panel,
        potential.panelWidthMeters,
        potential.panelHeightMeters,
        panelAzimuthDegrees(insights, panel),
        spherical,
      ),
      fillColor: palette[colorIndex] ?? "#1A237E",
    };
  });
}
