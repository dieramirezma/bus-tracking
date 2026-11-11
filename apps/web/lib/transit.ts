import type { TrunkRouteMap } from "@bus/shared";
import type * as GeoJSON from "geojson";

export const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

export const BOGOTA_CENTER: [number, number] = [-74.0817, 4.6533];

/** El GTFS usa #ff0000 (troncal) y #00ff00 (dual); se reemplazan por tonos legibles sobre el mapa. */
export const COLORS = {
  troncal: "#d7192d",
  dual: "#1f9d55",
};

export type ShapeProps = { shapeId: string; routes: string; color: string };
export type StationProps = { id: string; name: string; routeCount: number };
export type ShapesCollection = GeoJSON.FeatureCollection<GeoJSON.LineString, ShapeProps>;
export type StationsCollection = GeoJSON.FeatureCollection<GeoJSON.Point, StationProps>;

export interface StaticData {
  routes: TrunkRouteMap;
  shapes: ShapesCollection;
  stations: StationsCollection;
}

export function routeColor(agency: "troncal" | "dual" | undefined): string {
  return agency === "dual" ? COLORS.dual : COLORS.troncal;
}

/** Bounding box [[minLon, minLat], [maxLon, maxLat]] de los trazados de una ruta. */
export function routeBounds(
  shapes: ShapesCollection,
  routeId: string,
): [[number, number], [number, number]] | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const f of shapes.features) {
    if (!f.properties.routes.includes(`,${routeId},`)) continue;
    for (const [x, y] of f.geometry.coordinates) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return Number.isFinite(minX)
    ? [
        [minX, minY],
        [maxX, maxY],
      ]
    : null;
}

export function formatAgo(seconds: number): string {
  if (seconds < 60) return `hace ${Math.max(0, Math.round(seconds))} s`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `hace ${m} min`;
  return `hace ${Math.round(m / 60)} h`;
}
