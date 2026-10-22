"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Map, Marker, useMapsLibrary } from "@vis.gl/react-google-maps";
import {
  ChevronUpIcon,
  ImageIcon,
  LayersIcon,
  MountainSnowIcon,
  SunIcon,
} from "lucide-react";
import { toast } from "sonner";
import { SolarGroundOverlay } from "@/components/solar-ground-overlay";
import { SolarPanelCard, type OverlayControls } from "@/components/solar-panel-card";
import { SolarPanelsOverlay } from "@/components/solar-panels-overlay";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchDataLayerUrls, type Bounds } from "@/lib/geotiff";
import { renderSolarDesign, saveSolarDesign } from "@/lib/export-design";
import { panelPolygons } from "@/lib/panel-polygons";
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
  const geometry = useMapsLibrary("geometry");
  const [layerId, setLayerId] = useState<OverlayLayerId>("flux");
  const [overlay, setOverlay] = useState<OverlayControls>({
    maskRoof: true,
    showPanels: true,
    monthIndex: 2, // March — matches screenshot default vibe
    showFluxMonth: true,
  });
  const [panelCount, setPanelCount] = useState(0);
  const [yearlyEnergyKwh, setYearlyEnergyKwh] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [layers, setLayers] = useState<LoadedLayers | null>(null);
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const previewFile = useRef<File | null>(null);

  const onOverlayChange = useCallback((patch: Partial<OverlayControls>) => {
    setOverlay((prev) => ({ ...prev, ...patch }));
  }, []);

  const onPanelCountChange = useCallback((count: number) => {
    setPanelCount(count);
  }, []);

  const onEnergyChange = useCallback((energyKwh: number) => {
    setYearlyEnergyKwh(energyKwh);
  }, []);

  const onExport = useCallback(() => {
    if (!layers || loading) {
      toast.error("Solar layers are still loading");
      return;
    }

    const panels =
      overlay.showPanels && geometry?.spherical
        ? panelPolygons(insights, panelCount, geometry.spherical)
        : [];

    if (overlay.showPanels && panels.length === 0 && panelCount > 0 && !geometry?.spherical) {
      toast.error("Map geometry is still loading");
      return;
    }

    const source = renderOverlayCanvas(layers, layerId, overlay.maskRoof, overlay.monthIndex);
    setExporting(true);
    void renderSolarDesign({
      source,
      bounds: layers.bounds,
      panels,
      panelCount,
      energyKwh: yearlyEnergyKwh,
    })
      .then(async (blob) => {
        const result = await saveSolarDesign(blob);
        if (result === "preview") {
          if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
          const url = URL.createObjectURL(blob);
          previewUrlRef.current = url;
          previewFile.current = new File([blob], "solar-design.png", { type: "image/png" });
          setPreviewUrl(url);
        }
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Could not export the design");
      })
      .finally(() => setExporting(false));
  }, [
    geometry,
    insights,
    layerId,
    layers,
    loading,
    overlay.maskRoof,
    overlay.monthIndex,
    overlay.showPanels,
    panelCount,
    yearlyEnergyKwh,
  ]);

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
      <div className="flex flex-row gap-1 rounded-2xl bg-background/95 p-1.5 shadow-xl backdrop-blur md:flex-col md:gap-2 md:p-2">
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

  const controls = (
    <SolarPanelCard
      leadId={leadId}
      insights={insights}
      initialPanelCount={initialPanelCount}
      overlay={overlay}
      onOverlayChange={onOverlayChange}
      onPanelCountChange={onPanelCountChange}
      onEnergyChange={onEnergyChange}
      onExport={onExport}
      exportDisabled={loading || !layers || exporting}
    />
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

        <div
          className={cn(
            "pointer-events-auto z-30 flex flex-col bg-background shadow-xl",
            "fixed inset-x-0 bottom-0 rounded-t-3xl",
            sheetOpen ? "h-[70dvh]" : "h-14",
            "md:absolute md:inset-x-auto md:top-4 md:right-4 md:bottom-4 md:z-10 md:h-auto md:w-full md:max-w-sm md:rounded-none md:bg-transparent md:shadow-none",
          )}
        >
          <button
            type="button"
            className="flex h-14 shrink-0 items-center justify-center gap-2 md:hidden"
            onClick={() => setSheetOpen((open) => !open)}
            aria-expanded={sheetOpen}
          >
            <span className="absolute top-2 h-1 w-10 rounded-full bg-muted-foreground/40" />
            <span className="text-sm font-medium">Design</span>
            <ChevronUpIcon className={cn("size-4 transition-transform", sheetOpen && "rotate-180")} />
          </button>
          <div
            className={cn(
              "min-h-0 flex-1 flex-col",
              sheetOpen ? "flex" : "hidden md:flex",
            )}
          >
            {controls}
          </div>
        </div>
      </div>

      <Dialog
        open={previewUrl != null}
        onOpenChange={(open) => {
          if (open) return;
          if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
          previewFile.current = null;
          setPreviewUrl(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Save solar design</DialogTitle>
            <DialogDescription>
              Tap Save, or press and hold the image and choose Add to Photos.
            </DialogDescription>
          </DialogHeader>
          {previewUrl && (
            // The image stays in the page so iOS Safari can save it from a long-press.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Solar design"
              className="max-h-[60vh] w-full rounded-lg object-contain"
            />
          )}
          <Button
            type="button"
            onClick={() => {
              const file = previewFile.current;
              if (!file || !navigator.canShare?.({ files: [file] })) {
                toast.message("Press and hold the image, then choose Add to Photos.");
                return;
              }
              void navigator.share({ files: [file], title: "Solar design" }).catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "AbortError") return;
                toast.message("Press and hold the image, then choose Add to Photos.");
              });
            }}
          >
            Save
          </Button>
        </DialogContent>
      </Dialog>

      {(loading || error) && (
        <div className="absolute top-20 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-background/95 px-4 py-2 text-sm shadow-lg">
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
