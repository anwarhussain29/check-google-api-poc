"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CodeXmlIcon,
  GaugeIcon,
  InfoIcon,
  LeafIcon,
  SolarPanelIcon,
  SquareDashedIcon,
  SunIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { savePanelSelection } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  configForPanelCount,
  extractMetrics,
  formatNumber,
  getPanelConfigs,
  productionFactors,
  type BuildingInsights,
} from "@/lib/solar";

type Props = {
  leadId: string;
  insights: BuildingInsights;
  initialPanelCount: number | null;
};

export function SolarPanelCard({ leadId, insights, initialPanelCount }: Props) {
  const metrics = extractMetrics(insights);
  const configs = useMemo(() => getPanelConfigs(insights), [insights]);

  const initialIndex = useMemo(() => {
    if (configs.length === 0) return 0;
    const config = configForPanelCount(insights, initialPanelCount ?? Infinity);
    const idx = config ? configs.indexOf(config) : -1;
    return idx >= 0 ? idx : configs.length - 1;
  }, [configs, insights, initialPanelCount]);

  const [index, setIndex] = useState(initialIndex);
  const [, startTransition] = useTransition();

  const selected = configs[index];
  const panelCount = selected?.panelsCount ?? 0;
  const energyKwh = selected?.yearlyEnergyDcKwh ?? 0;
  const maxEnergy = configs[configs.length - 1]?.yearlyEnergyDcKwh ?? 0;
  const factors = selected
    ? productionFactors(selected, insights.solarPotential.panelCapacityWatts)
    : null;

  const persist = (idx: number) => {
    const config = configs[idx];
    if (!config) return;
    startTransition(async () => {
      const result = await savePanelSelection(leadId, config.panelsCount);
      if (!result.ok) toast.error(result.error);
    });
  };

  const rows: { icon: LucideIcon; name: string; unit?: string; value: number; info: string }[] = [
    {
      icon: SunIcon,
      name: "Sunshine",
      unit: "hours/year",
      value: metrics.sunshineHoursPerYear,
      info: "Maximum sunshine hours per year received by any point on the roof.",
    },
    {
      icon: SquareDashedIcon,
      name: "Roof area",
      unit: "m2",
      value: metrics.roofAreaM2,
      info: "Total roof area detected for this building.",
    },
    {
      icon: SolarPanelIcon,
      name: "Max panel count",
      value: metrics.maxPanelCount,
      info: "Maximum number of panels that fit on the roof.",
    },
    {
      icon: LeafIcon,
      name: "CO2 savings",
      unit: "kg/MWh",
      value: metrics.co2KgPerMwh,
      info: "CO2 offset per MWh of electricity, based on the local grid's carbon intensity.",
    },
  ];

  return (
    <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-xl">
      <ul className="space-y-5">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-3">
            <row.icon className="size-5 text-blue-600" />
            <span className="flex-1">
              {row.name}
              {row.unit && <span className="text-muted-foreground"> ({row.unit})</span>}
            </span>
            <span className="tabular-nums">{formatNumber(row.value)}</span>
            <InfoTip text={row.info} />
          </li>
        ))}
      </ul>

      <hr className="my-6" />

      {configs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No panel configurations returned for this building.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Gauge
              title="Panel count"
              icon={SolarPanelIcon}
              ratio={metrics.maxPanelCount ? panelCount / metrics.maxPanelCount : 0}
              color="text-blue-600"
              track="text-blue-100"
            >
              <span className="text-blue-600">{panelCount}</span>
              <span className="text-muted-foreground">/{metrics.maxPanelCount}</span>
            </Gauge>
            <Gauge
              title="Energy Output"
              icon={LeafIcon}
              ratio={maxEnergy ? energyKwh / maxEnergy : 0}
              color="text-green-600"
              track="text-green-100"
            >
              <span className="text-green-600">{formatNumber(energyKwh)}</span>
              <span className="text-muted-foreground"> kWh</span>
            </Gauge>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <SolarPanelIcon className="size-5 text-blue-600" />
            <span className="flex-1">Panel count</span>
            <span className="tabular-nums">{panelCount}</span>
            <InfoTip text="Choose how many panels to install. Energy output is the yearly DC energy for that configuration." />
          </div>
          <Slider
            className="mt-4"
            min={0}
            max={configs.length - 1}
            step={1}
            value={[index]}
            onValueChange={(v) => setIndex(Array.isArray(v) ? v[0] : (v as number))}
            onValueCommitted={(v) => persist(Array.isArray(v) ? v[0] : (v as number))}
          />

          <ul className="mt-6 space-y-3">
            <li className="flex items-center gap-3">
              <GaugeIcon className="size-5 text-blue-600" />
              <span className="flex-1">
                Production factor <span className="text-muted-foreground">(kWh/panel/yr)</span>
              </span>
              <span className="tabular-nums">{formatNumber(factors?.kwhPerPanel)}</span>
              <InfoTip text="Yearly energy output divided by the number of panels." />
            </li>
            <li className="flex items-center gap-3">
              <GaugeIcon className="size-5 text-blue-600" />
              <span className="flex-1">
                Production factor <span className="text-muted-foreground">(kWh/kW/yr)</span>
              </span>
              <span className="tabular-nums">{formatNumber(factors?.kwhPerKw)}</span>
              <InfoTip
                text={`Yearly energy output divided by system size (panel count x ${insights.solarPotential.panelCapacityWatts} W).`}
              />
            </li>
          </ul>
        </>
      )}

      <Dialog>
        <DialogTrigger
          render={<Button variant="outline" className="mt-6 h-11 w-full rounded-xl" />}
        >
          <CodeXmlIcon />
          API Response
        </DialogTrigger>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>buildingInsights:findClosest response</DialogTitle>
          </DialogHeader>
          <pre className="max-h-[70vh] overflow-auto rounded-lg bg-muted p-4 text-xs">
            {JSON.stringify(insights, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger className="text-muted-foreground hover:text-foreground">
        <InfoIcon className="size-4" />
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

function Gauge({
  title,
  icon: Icon,
  ratio,
  color,
  track,
  children,
}: {
  title: string;
  icon: LucideIcon;
  ratio: number;
  color: string;
  track: string;
  children: React.ReactNode;
}) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75;
  const filled = arc * Math.min(Math.max(ratio, 0), 1);

  return (
    <div className="flex flex-col items-center rounded-2xl bg-muted/60 p-3">
      <span className="text-sm font-medium">{title}</span>
      <div className="relative my-2 size-24">
        <svg viewBox="0 0 80 80" className="size-full rotate-[135deg]">
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            stroke="currentColor"
            className={track}
            strokeDasharray={`${arc} ${circumference}`}
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            stroke="currentColor"
            className={`${color} transition-all duration-300`}
            strokeDasharray={`${filled} ${circumference}`}
          />
        </svg>
        <Icon className={`absolute inset-0 m-auto size-7 ${color}`} />
      </div>
      <span className="text-sm font-semibold tabular-nums">{children}</span>
    </div>
  );
}
