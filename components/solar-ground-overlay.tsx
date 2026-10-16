"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { Bounds } from "@/lib/geotiff";

type Props = {
  imageUrl: string | null;
  bounds: Bounds | null;
  opacity?: number;
};

/** Imperative GroundOverlay — not exposed as a React component by vis.gl. */
export function SolarGroundOverlay({ imageUrl, bounds, opacity = 0.85 }: Props) {
  const map = useMap();
  const overlayRef = useRef<google.maps.GroundOverlay | null>(null);

  useEffect(() => {
    if (!map) return;

    overlayRef.current?.setMap(null);
    overlayRef.current = null;

    if (!imageUrl || !bounds) return;

    const overlay = new google.maps.GroundOverlay(
      imageUrl,
      {
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west,
      },
      { opacity, clickable: false },
    );
    overlay.setMap(map);
    overlayRef.current = overlay;

    return () => {
      overlay.setMap(null);
      if (overlayRef.current === overlay) overlayRef.current = null;
    };
  }, [map, imageUrl, bounds, opacity]);

  return null;
}
