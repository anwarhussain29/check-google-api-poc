"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Map, Marker } from "@vis.gl/react-google-maps";
import {
  ImageIcon,
  LayersIcon,
  MountainSnowIcon,
  SunIcon,
} from "lucide-react";
import { SolarGroundOverlay } from "@/components/solar-ground-overlay";
import { SolarPanelCard, type OverlayControls } from "@/components/solar-panel-card";
import { SolarPanelsOverlay } from "@/components/solar-panels-overlay";
import { Button } from "@/components/ui/button";
import { fetchDataLayerUrls, type Bounds } from "@/lib/geotiff";
import {
  loadSolarLayers,
  renderOverlayCanvas,
  type LoadedLayers,
  type OverlayLayerId,
} from "@/lib/solar-layers";
import { dataLayersRadiusMeters, type BuildingInsights } from "@/lib/solar";
import { cn } from "@/lib/utils";

type Props = {
  leadId: string;
  lat: number;
  lng: number;
  insights: BuildingInsights;
  initialPanelCount: number | null;
};

const LAYER_BUTTONS: { id: OverlayLayerId; label: string; icon: typeof SunIcon }[] = [
  { id: "flux", label: "Flux", icon: SunIcon },
  { id: "dsm", label: "DSM", icon: MountainSnowIcon },
  { id: "rgb", label: "RGB", icon: ImageIcon },
];

export function SolarViewer({ leadId, lat, lng, insights, initialPanelCount }: Props) {
  const [layerId, setLayerId] = useState<OverlayLayerId>("flux");
  const [overlay, setOverlay] = useState<OverlayControls>({
    maskRoof: true,
    showPanels: true,
    monthIndex: 2, // March — matches screenshot default vibe
    showFluxMonth: true,
  });
  const [panelCount, setPanelCount] = useState(0);
  const [layers, setLayers] = useState<LoadedLayers | null>(null);
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onOverlayChange = useCallback((patch: Partial<OverlayControls>) => {
    setOverlay((prev) => ({ ...prev, ...patch }));
  }, []);

  const onPanelCountChange = useCallback((count: number) => {
    setPanelCount(count);
  }, []);

  useEffect(() => {
    onOverlayChange({ showFluxMonth: layerId === "flux" });
  }, [layerId, onOverlayChange]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const radius = dataLayersRadiusMeters(insights);
        const urls = await fetchDataLayerUrls(lat, lng, radius);
        const loaded = await loadSolarLayers(urls);
        if (cancelled) return;
        setLayers(loaded);
        setBounds(loaded.bounds);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load solar layers");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [insights, lat, lng]);

  useEffect(() => {
    if (!layers) {
      setOverlayUrl(null);
      return;
    }

    const canvas = renderOverlayCanvas(
      layers,
      layerId,
      overlay.maskRoof,
      overlay.monthIndex,
    );
    const url = canvas.toDataURL("image/png");
    setOverlayUrl(url);
  }, [layers, layerId, overlay.maskRoof, overlay.monthIndex]);

  const hasKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  const layerSwitcher = useMemo(
    () => (
      <div className="flex flex-col gap-2 rounded-2xl bg-background/95 p-2 shadow-xl backdrop-blur">
        {LAYER_BUTTONS.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            type="button"
            variant={layerId === id ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-auto w-14 flex-col gap-1 px-2 py-2 text-[10px] font-semibold uppercase tracking-wide",
              layerId === id && "shadow-sm",
            )}
            onClick={() => setLayerId(id)}
            title={label}
          >
            <Icon className="size-5" />
            {label}
          </Button>
        ))}
      </div>
    ),
    [layerId],
  );

  if (!hasKey) {
    return (
      <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
        Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show the map
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Map
        key={`${lat},${lng}`}
        defaultCenter={{ lat, lng }}
        defaultZoom={20}
        defaultTilt={0}
        mapTypeId="satellite"
        gestureHandling="greedy"
        streetViewControl={false}
        fullscreenControl={false}
        mapTypeControl={false}
        className="h-full w-full"
      >
        <Marker position={{ lat, lng }} />
        <SolarGroundOverlay imageUrl={overlayUrl} bounds={bounds} opacity={0.85} />
        <SolarPanelsOverlay
          insights={insights}
          panelCount={panelCount}
          visible={overlay.showPanels}
        />
      </Map>

      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto absolute top-4 left-4 z-10">{layerSwitcher}</div>
        <div className="pointer-events-auto absolute top-4 right-4 bottom-4 z-10 flex w-full max-w-sm flex-col">
          <SolarPanelCard
            leadId={leadId}
            insights={insights}
            initialPanelCount={initialPanelCount}
            overlay={overlay}
            onOverlayChange={onOverlayChange}
            onPanelCountChange={onPanelCountChange}
          />
        </div>
      </div>

      {(loading || error) && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-background/95 px-4 py-2 text-sm shadow-lg">
          <LayersIcon className="size-4 text-muted-foreground" />
          {loading ? (
            <span className="text-muted-foreground">Loading solar layers…</span>
          ) : (
            <span className="text-red-600">{error}</span>
          )}
        </div>
      )}
    </div>
  );
}
