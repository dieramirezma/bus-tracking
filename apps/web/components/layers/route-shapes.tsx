"use client";

import { useMemo } from "react";
import type { ExpressionSpecification, LineLayerSpecification } from "maplibre-gl";
import { MapGeoJSON, useMap } from "@/components/ui/map";
import { COLORS, type ShapesCollection } from "@/lib/transit";

type LinePaint = NonNullable<LineLayerSpecification["paint"]>;

const routeColorExpr: ExpressionSpecification = [
  "match",
  ["get", "color"],
  "#00ff00",
  COLORS.dual,
  COLORS.troncal,
];

const EMPTY: ShapesCollection = { type: "FeatureCollection", features: [] };

/**
 * Trazados troncales. Muchas rutas comparten corredor, así que la transparencia se acumula:
 * en vez de atenuar con opacidad, la red pasa a gris opaco y la ruta elegida se dibuja encima
 * en una segunda capa (siempre montada para conservar el orden de capas).
 */
export function RouteShapes({
  shapes,
  selectedRouteId,
}: {
  shapes: ShapesCollection;
  selectedRouteId: string | null;
}) {
  const { resolvedTheme } = useMap();
  const muted = resolvedTheme === "dark" ? "#3f3f46" : "#cfcfcf";

  const basePaint = useMemo<LinePaint>(
    () => ({
      "line-color": selectedRouteId ? muted : routeColorExpr,
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.2, 14, 3, 17, 5],
      "line-opacity": selectedRouteId ? 1 : 0.75,
    }),
    [selectedRouteId, muted],
  );

  const selectedPaint = useMemo<LinePaint>(
    () => ({
      "line-color": routeColorExpr,
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2.5, 14, 5, 17, 8],
      "line-opacity": 1,
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
      <MapGeoJSON id="trunk-shapes" data={shapes} fillPaint={false} linePaint={basePaint} />
      <MapGeoJSON
        id="trunk-shapes-selected"
        data={selectedShapes}
        fillPaint={false}
        linePaint={selectedPaint}
      />
    </>
  );
}
