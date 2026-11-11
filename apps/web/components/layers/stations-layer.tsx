"use client";

import { useEffect } from "react";
import type { GeoJSONSource } from "maplibre-gl";
import { useMap } from "@/components/ui/map";
import type { StationsCollection } from "@/lib/transit";

const SOURCE = "stations";
const CIRCLE = "stations-circle";
const LABEL = "stations-label";

/** Estaciones troncales: punto desde zoom 11 y nombre desde zoom 14. */
export function StationsLayer({ data }: { data: StationsCollection }) {
  const { map, isLoaded, resolvedTheme } = useMap();
  const dark = resolvedTheme === "dark";

  // Las capas se pierden cuando mapcn recarga el estilo (cambio de tema): se re-agregan con isLoaded.
  useEffect(() => {
    if (!map || !isLoaded) return;
    if (!map.getSource(SOURCE)) map.addSource(SOURCE, { type: "geojson", data });
    if (!map.getLayer(CIRCLE)) {
      map.addLayer({
        id: CIRCLE,
        type: "circle",
        source: SOURCE,
        minzoom: 11,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 2, 15, 5],
          "circle-color": dark ? "#e5e5e5" : "#ffffff",
          "circle-stroke-color": dark ? "#171717" : "#404040",
          "circle-stroke-width": 1.2,
        },
      });
    }
    if (!map.getLayer(LABEL)) {
      map.addLayer({
        id: LABEL,
        type: "symbol",
        source: SOURCE,
        minzoom: 14,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-offset": [0, 1.1],
          "text-anchor": "top",
          "text-optional": true,
        },
        paint: {
          "text-color": dark ? "#e5e5e5" : "#262626",
          "text-halo-color": dark ? "#0a0a0a" : "#ffffff",
          "text-halo-width": 1.2,
        },
      });
    }
    return () => {
      try {
        if (map.getLayer(LABEL)) map.removeLayer(LABEL);
        if (map.getLayer(CIRCLE)) map.removeLayer(CIRCLE);
        if (map.getSource(SOURCE)) map.removeSource(SOURCE);
      } catch {
        // el estilo puede estar recargándose
      }
    };
  }, [map, isLoaded, dark, data]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    (map.getSource(SOURCE) as GeoJSONSource | undefined)?.setData(data);
  }, [map, isLoaded, data]);

  return null;
}
