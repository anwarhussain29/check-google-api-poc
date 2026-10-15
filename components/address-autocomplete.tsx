"use client";

import { useEffect, useRef, useState } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";

type Coords = { lat: number; lng: number } | null;

export function AddressAutocomplete({
  id,
  placeholder,
}: {
  id?: string;
  placeholder?: string;
}) {
  const places = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<Coords>(null);

  // The legacy widget attaches DOM listeners that can't be removed, so bind it only once per input.
  useEffect(() => {
    const input = inputRef.current;
    if (!places || !input || autocompleteRef.current) return;

    const autocomplete = new places.Autocomplete(input, {
      fields: ["formatted_address", "geometry"],
      types: ["address"],
    });
    autocompleteRef.current = autocomplete;

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const location = place.geometry?.location;
      setAddress(place.formatted_address ?? input.value);
      setCoords(location ? { lat: location.lat(), lng: location.lng() } : null);
    });
  }, [places]);

  return (
    <>
      <Input
        ref={inputRef}
        id={id}
        name="address"
        required
        autoComplete="off"
        placeholder={placeholder}
        value={address}
        onChange={(e) => {
          setAddress(e.target.value);
          setCoords(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && document.querySelector(".pac-container .pac-item-selected")) {
            e.preventDefault();
          }
        }}
      />
      <input type="hidden" name="lat" value={coords?.lat ?? ""} />
      <input type="hidden" name="lng" value={coords?.lng ?? ""} />
    </>
  );
}
