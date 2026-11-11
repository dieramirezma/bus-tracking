"use client";

import { useMemo } from "react";
import type { LineLayerSpecification } from "maplibre-gl";
import { MapGeoJSON, useMap } from "@/components/ui/map";
import { INK, type ShapesCollection } from "@/lib/transit";

type LinePaint = NonNullable<LineLayerSpecification["paint"]>;

const EMPTY: ShapesCollection = { type: "FeatureCollection", features: [] };

/**
 * Trazados troncales. Muchas rutas comparten corredor, así que la red se pinta opaca (la transparencia
 * se acumularía) y la ruta elegida va encima en dos capas: borde de esmalte y núcleo de oro.
 * Las tres capas están siempre montadas para conservar el orden de dibujo.
 */
export function RouteShapes({
  shapes,
  selectedRouteId,
}: {
  shapes: ShapesCollection;
  selectedRouteId: string | null;
}) {
  const { resolvedTheme } = useMap();
  const dark = resolvedTheme === "dark";

  const networkPaint = useMemo<LinePaint>(
    () => ({
      "line-color": selectedRouteId
        ? dark
          ? "#262d3a"
          : "#cdd2da"
        : dark
          ? INK.networkDark
          : INK.networkLight,
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.2, 14, 2.6, 17, 4],
      "line-opacity": 1,
    }),
    [selectedRouteId, dark],
  );

  const casingPaint = useMemo<LinePaint>(
    () => ({
      "line-color": dark ? INK.darkGround : INK.enamel,
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 5, 14, 9, 17, 13],
    }),
    [dark],
  );

  const corePaint = useMemo<LinePaint>(
    () => ({
      "line-color": INK.gold,
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2.4, 14, 4.5, 17, 7],
    }),
    [],
  );

  const selectedShapes = useMemo<ShapesCollection>(() => {
    if (!selectedRouteId) return EMPTY;
    const key = `,${selectedRouteId},`;
    return {
      type: "FeatureCollection",
      features: shapes.features.filter((f) => f.properties.routes.includes(key)),
    };
  }, [shapes, selectedRouteId]);

  return (
    <>
      <MapGeoJSON id="network" data={shapes} fillPaint={false} linePaint={networkPaint} />
      <MapGeoJSON id="route-casing" data={selectedShapes} fillPaint={false} linePaint={casingPaint} />
      <MapGeoJSON id="route-core" data={selectedShapes} fillPaint={false} linePaint={corePaint} />
    </>
  );
}
