"use client";

import { useMemo } from "react";
import { Polygon, useMapsLibrary } from "@vis.gl/react-google-maps";
import { createPalette, normalize, rgbToColor } from "@/lib/visualize";
import { panelsPalette } from "@/lib/colors";
import {
  panelAzimuthDegrees,
  panelRectanglePath,
  panelsForCount,
  type BuildingInsights,
} from "@/lib/solar";

type Props = {
  insights: BuildingInsights;
  panelCount: number;
  visible: boolean;
};

export function SolarPanelsOverlay({ insights, panelCount, visible }: Props) {
  const geometry = useMapsLibrary("geometry");

  const polygons = useMemo(() => {
    if (!geometry?.spherical || !visible || panelCount <= 0) return [];

    const potential = insights.solarPotential;
    const panels = panelsForCount(insights, panelCount);
    if (panels.length === 0) return [];

    const palette = createPalette(panelsPalette).map(rgbToColor);
    const energies = potential.solarPanels?.map((p) => p.yearlyEnergyDcKwh) ?? [];
    const minEnergy = energies.length ? Math.min(...energies) : 0;
    const maxEnergy = energies.length ? Math.max(...energies) : 1;

    return panels.map((panel, i) => {
      const path = panelRectanglePath(
        panel,
        potential.panelWidthMeters,
        potential.panelHeightMeters,
        panelAzimuthDegrees(insights, panel),
        geometry.spherical,
      );
      const colorIndex = Math.round(
        normalize(panel.yearlyEnergyDcKwh, maxEnergy, minEnergy) * 255,
      );
      return {
        key: `${panel.center.latitude},${panel.center.longitude},${i}`,
        path,
        fillColor: palette[colorIndex] ?? "#1A237E",
      };
    });
  }, [geometry, insights, panelCount, visible]);

  if (!visible) return null;

  return (
    <>
      {polygons.map((p) => (
        <Polygon
          key={p.key}
          paths={p.path}
          strokeColor="#B0BEC5"
          strokeOpacity={0.9}
          strokeWeight={1}
          fillColor={p.fillColor}
          fillOpacity={0.9}
          clickable={false}
        />
      ))}
    </>
  );
}
