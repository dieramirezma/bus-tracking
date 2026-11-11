import type { TrunkRoute, TrunkRouteMap, Vehicle } from "@bus/shared";
import type * as GeoJSON from "geojson";

export const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/positron",
  dark: "https://tiles.openfreemap.org/styles/dark",
};

export const BOGOTA_CENTER: [number, number] = [-74.0817, 4.6533];

/**
 * Tintas del mundo «diagrama de tránsito en esmalte». No reutilizan los colores de TransMilenio:
 * la ruta elegida es oro; troncal y dual se distinguen por forma (relleno / anillo), nunca solo por color.
 */
export const INK = {
  enamel: "#13203a",
  porcelain: "#f2f3f0",
  gold: "#d6a531",
  networkLight: "#7d889c",
  networkDark: "#5d6b84",
  darkGround: "#0e1015",
};

/** Un reporte se considera envejecido a partir de estos segundos (se dibuja más tenue). */
export const AGE_FADE_S = [90, 180] as const;

export type ShapeProps = { shapeId: string; routes: string; color: string };
export type StationProps = { id: string; name: string; routeCount: number };
export type ShapesCollection = GeoJSON.FeatureCollection<GeoJSON.LineString, ShapeProps>;
export type StationsCollection = GeoJSON.FeatureCollection<GeoJSON.Point, StationProps>;

export interface StaticData {
  routes: TrunkRouteMap;
  shapes: ShapesCollection;
  stations: StationsCollection;
}

export interface Station {
  id: string;
  name: string;
  lon: number;
  lat: number;
  routeCount: number;
}

export function indexStations(stations: StationsCollection): Map<string, Station> {
  return new Map(
    stations.features.map((f) => [
      f.properties.id,
      {
        id: f.properties.id,
        name: f.properties.name,
        lon: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
        routeCount: f.properties.routeCount,
      },
    ]),
  );
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

/**
 * Posición de un bus sobre la secuencia de estaciones de su ruta, como índice fraccionario:
 * 2.4 = entre la estación 2 y la 3, al 40 %. Proyección sobre la polilínea de estaciones
 * en coordenadas planas locales (suficiente a la escala de Bogotá).
 */
export function stripPosition(vehicle: Pick<Vehicle, "lat" | "lon">, path: Station[]): number | null {
  if (path.length < 2) return null;
  const k = Math.cos((vehicle.lat * Math.PI) / 180);
  const px = vehicle.lon * k;
  const py = vehicle.lat;
  let best = { d: Infinity, t: 0 };
  for (let i = 0; i < path.length - 1; i++) {
    const ax = path[i].lon * k;
    const ay = path[i].lat;
    const bx = path[i + 1].lon * k;
    const by = path[i + 1].lat;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const u = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    const d = Math.hypot(px - (ax + u * dx), py - (ay + u * dy));
    if (d < best.d) best = { d, t: i + u };
  }
  return best.t;
}

export function routePath(route: TrunkRoute | undefined, stations: Map<string, Station>): Station[] {
  if (!route) return [];
  return route.stations.map((id) => stations.get(id)).filter((s): s is Station => Boolean(s));
}

/**
 * Nombre de destino legible a partir del `route_long_name` del GTFS, que viene abreviado y a veces
 * en mayúsculas («P.USME», «M84-KR 7-CLL 72 || C84 Av. Sub»).
 */
export function displayName(longName: string): string {
  return longName
    .replace(/\s*\|\|\s*/g, " / ")
    .replace(/\bP\.\s*/g, "Portal ")
    .replace(/\bCLL\b\.?/gi, "Calle")
    .replace(/\bKR\b\.?/gi, "Kr.")
    .replace(/\b([A-ZÁÉÍÓÚÑ]{3,})\b/g, (w) => w.charAt(0) + w.slice(1).toLowerCase())
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Nombre corto de estación para la tira: sin el patrocinio tras « - » o « – » y con abreviaturas de calle. */
export function stationShort(name: string): string {
  return name
    .split(/\s[-–]\s/)[0]
    .replace(/\bCalle\b/g, "Cl")
    .replace(/\bAvenida\b/g, "Av")
    .replace(/\bCarrera\b/g, "Cra")
    .replace(/\b(Av|Cl|Cra|Kr)\.\s*/g, "$1 ")
    .trim();
}

/** Normaliza para buscar sin tildes ni mayúsculas. */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
