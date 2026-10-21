"use client";

import { useMemo } from "react";
import { Polygon, useMapsLibrary } from "@vis.gl/react-google-maps";
import { panelPolygons } from "@/lib/panel-polygons";
import type { BuildingInsights } from "@/lib/solar";

type Props = {
  insights: BuildingInsights;
  panelCount: number;
  visible: boolean;
};

export function SolarPanelsOverlay({ insights, panelCount, visible }: Props) {
  const geometry = useMapsLibrary("geometry");

  const polygons = useMemo(() => {
    if (!geometry?.spherical || !visible) return [];
    return panelPolygons(insights, panelCount, geometry.spherical);
  }, [geometry, insights, panelCount, visible]);

  if (!visible) return null;

  return (
    <>
      {polygons.map((polygon, index) => (
        <Polygon
          key={`${polygon.path[0]?.lat},${polygon.path[0]?.lng},${index}`}
          paths={polygon.path}
          strokeColor="#B0BEC5"
          strokeOpacity={0.9}
          strokeWeight={1}
          fillColor={polygon.fillColor}
          fillOpacity={0.9}
          clickable={false}
        />
      ))}
    </>
  );
}
