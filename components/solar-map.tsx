"use client";

import { Map, Marker } from "@vis.gl/react-google-maps";

export function SolarMap({ lat, lng }: { lat: number; lng: number }) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
        Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show the map
      </div>
    );
  }

  return (
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
    </Map>
  );
}
