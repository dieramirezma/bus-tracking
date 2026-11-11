"use client";

import { useEffect, useMemo } from "react";
import type { ExpressionSpecification, GeoJSONSource } from "maplibre-gl";
import { useMap } from "@/components/ui/map";
import { INK, type StationsCollection } from "@/lib/transit";

const SOURCE = "stations";
const DOT = "stations-dot";
const ROUTE_DOT = "stations-route-dot";
const LABEL = "stations-label";

/**
 * Estaciones como marcas de porcelana del diagrama. Sin ruta elegida: punto desde zoom 11.5 y nombre
 * desde 14. Con ruta: sus estaciones crecen, llevan anillo y su nombre aparece antes (zoom 12).
 */
export function StationsLayer({
  data,
  routeStationIds,
}: {
  data: StationsCollection;
  routeStationIds: string[];
}) {
  const { map, isLoaded, resolvedTheme } = useMap();
  const dark = resolvedTheme === "dark";

  const inRoute = useMemo<ExpressionSpecification>(
    () => ["in", ["get", "id"], ["literal", routeStationIds]],
    [routeStationIds],
  );

  useEffect(() => {
    if (!map || !isLoaded) return;
    if (!map.getSource(SOURCE)) map.addSource(SOURCE, { type: "geojson", data });
    const fill = dark ? INK.enamel : INK.porcelain;
    const stroke = dark ? INK.porcelain : INK.enamel;
    if (!map.getLayer(DOT)) {
      map.addLayer({
        id: DOT,
        type: "circle",
        source: SOURCE,
        minzoom: 11.5,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 11.5, 2, 15, 4],
          "circle-color": fill,
          "circle-stroke-color": stroke,
          "circle-stroke-width": 1,
          "circle-opacity": 0.9,
          "circle-stroke-opacity": 0.6,
        },
      });
    }
    if (!map.getLayer(ROUTE_DOT)) {
      map.addLayer({
        id: ROUTE_DOT,
        type: "circle",
        source: SOURCE,
        filter: ["==", ["get", "id"], "__none__"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3.5, 14, 6.5, 17, 9],
          "circle-color": fill,
          "circle-stroke-color": stroke,
          "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 10, 1.5, 14, 2.5],
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
          "text-field": ["upcase", ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-letter-spacing": 0.06,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-max-width": 9,
          "text-optional": true,
        },
        paint: {
          "text-color": dark ? INK.porcelain : INK.enamel,
          "text-halo-color": dark ? INK.darkGround : "#ffffff",
          "text-halo-width": 1.4,
        },
      });
    }
    return () => {
      try {
        for (const id of [LABEL, ROUTE_DOT, DOT]) if (map.getLayer(id)) map.removeLayer(id);
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

  // Ruta elegida: resalta sus estaciones y adelanta sus nombres.
  useEffect(() => {
    if (!map || !isLoaded || !map.getLayer(ROUTE_DOT)) return;
    const has = routeStationIds.length > 0;
    map.setFilter(ROUTE_DOT, has ? inRoute : ["==", ["get", "id"], "__none__"]);
    map.setFilter(LABEL, has ? inRoute : null);
    map.setLayerZoomRange(LABEL, has ? 12 : 14, 24);
  }, [map, isLoaded, inRoute, routeStationIds.length]);

  return null;
}
