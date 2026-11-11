"use client";

import { useEffect, useRef } from "react";
import type {
  ExpressionSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
  MapLayerMouseEvent,
} from "maplibre-gl";
import type * as GeoJSON from "geojson";
import type { TrunkRouteMap, Vehicle } from "@bus/shared";
import { useMap } from "@/components/ui/map";
import { AGE_FADE_S, INK } from "@/lib/transit";

const SOURCE = "vehicles";
const FOCUS = "vehicles-focus";
const DOT = "vehicles-dot";
const ARROW = "vehicles-arrow";
const ARROW_ICON = "vehicle-arrow";
/** Los buses reportan cada ~60 s: se deslizan 1,5 s hacia la nueva lectura. */
const ANIMATION_MS = 1500;

type Pos = { lon: number; lat: number };

/** Punta de flecha 32×32 como icono SDF (se colorea y rota por bus). */
function arrowImage(): ImageData {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(16, 6);
  ctx.lineTo(24, 22);
  ctx.lineTo(16, 18);
  ctx.lineTo(8, 22);
  ctx.closePath();
  ctx.fill();
  return ctx.getImageData(0, 0, size, size);
}

function ensureLayers(map: MapLibreMap, dark: boolean) {
  if (!map.hasImage(ARROW_ICON)) map.addImage(ARROW_ICON, arrowImage(), { sdf: true });
  if (!map.getSource(SOURCE)) {
    map.addSource(SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  }
  const isDual: ExpressionSpecification = ["==", ["get", "agency"], "dual"];
  // Troncal: relleno pleno. Dual: anillo. En oscuro se invierte la porcelana.
  const fill: ExpressionSpecification = dark
    ? ["case", isDual, INK.darkGround, INK.porcelain]
    : ["case", isDual, INK.porcelain, INK.enamel];
  const ring: ExpressionSpecification = dark
    ? ["case", isDual, INK.porcelain, INK.enamel]
    : ["case", isDual, INK.enamel, INK.porcelain];
  const arrow: ExpressionSpecification = dark
    ? ["case", isDual, INK.porcelain, INK.enamel]
    : ["case", isDual, INK.enamel, INK.porcelain];

  if (!map.getLayer(FOCUS)) {
    map.addLayer({
      id: FOCUS,
      type: "circle",
      source: SOURCE,
      filter: ["==", ["get", "id"], "__none__"],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 9, 13, 12, 16, 15],
        "circle-color": "rgba(0,0,0,0)",
        "circle-stroke-color": INK.gold,
        "circle-stroke-width": 3,
      },
    });
  }
  if (!map.getLayer(DOT)) {
    map.addLayer({
      id: DOT,
      type: "circle",
      source: SOURCE,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 4, 13, 6.5, 16, 9],
        "circle-color": fill,
        "circle-stroke-color": ring,
        "circle-stroke-width": ["case", isDual, 2.2, 1.4],
        "circle-opacity": ["get", "fade"],
        "circle-stroke-opacity": ["get", "fade"],
      },
    });
  }
  if (!map.getLayer(ARROW)) {
    map.addLayer({
      id: ARROW,
      type: "symbol",
      source: SOURCE,
      minzoom: 12.5,
      filter: [">=", ["get", "bearing"], 0],
      layout: {
        "icon-image": ARROW_ICON,
        "icon-size": ["interpolate", ["linear"], ["zoom"], 12.5, 0.32, 16, 0.5],
        "icon-rotate": ["get", "bearing"],
        "icon-rotation-alignment": "map",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
      paint: { "icon-color": arrow, "icon-opacity": ["get", "fade"] },
    });
  }
  for (const id of [FOCUS, DOT, ARROW]) map.moveLayer(id);
}

function fadeFor(ageS: number): number {
  if (ageS < AGE_FADE_S[0]) return 1;
  if (ageS < AGE_FADE_S[1]) return 0.7;
  return 0.45;
}

function toCollection(
  vehicles: Vehicle[],
  positions: Map<string, Pos>,
  routes: TrunkRouteMap,
  nowS: number,
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: vehicles.map((v) => {
      const p = positions.get(v.id) ?? v;
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lon, p.lat] },
        properties: {
          id: v.id,
          routeId: v.routeId,
          agency: routes[v.routeId]?.agency ?? "troncal",
          bearing: v.bearing ?? -1,
          fade: fadeFor(nowS - v.timestamp),
        },
      };
    }),
  };
}

const ease = (t: number) => 1 - (1 - t) ** 3;

interface VehiclesLayerProps {
  vehicles: Vehicle[];
  routes: TrunkRouteMap;
  selectedRouteId: string | null;
  focusedVehicleId: string | null;
  onSelect: (vehicleId: string, routeId: string) => void;
}

export function VehiclesLayer({
  vehicles,
  routes,
  selectedRouteId,
  focusedVehicleId,
  onSelect,
}: VehiclesLayerProps) {
  const { map, isLoaded, resolvedTheme } = useMap();
  const dark = resolvedTheme === "dark";
  /** Posiciones dibujadas en este momento (pueden ir a mitad de animación). */
  const shown = useRef(new Map<string, Pos>());
  const frame = useRef<number | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Capas + eventos; se vuelven a agregar cuando mapcn recarga el estilo (cambio de tema).
  useEffect(() => {
    if (!map || !isLoaded) return;
    ensureLayers(map, dark);
    const click = (e: MapLayerMouseEvent) => {
      const props = e.features?.[0]?.properties;
      if (typeof props?.id === "string" && typeof props?.routeId === "string") {
        onSelectRef.current(props.id, props.routeId);
      }
    };
    const enter = () => (map.getCanvas().style.cursor = "pointer");
    const leave = () => (map.getCanvas().style.cursor = "");
    map.on("click", DOT, click);
    map.on("mouseenter", DOT, enter);
    map.on("mouseleave", DOT, leave);
    return () => {
      map.off("click", DOT, click);
      map.off("mouseenter", DOT, enter);
      map.off("mouseleave", DOT, leave);
      try {
        for (const id of [ARROW, DOT, FOCUS]) if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(SOURCE)) map.removeSource(SOURCE);
      } catch {
        // el estilo puede estar recargándose
      }
    };
  }, [map, isLoaded, dark]);

  // Desliza cada bus desde la posición dibujada hasta la nueva lectura.
  useEffect(() => {
    if (!map || !isLoaded) return;
    const source = map.getSource(SOURCE) as GeoJSONSource | undefined;
    if (!source) return;
    const nowS = Date.now() / 1000;
    const from = new Map(shown.current);
    const to = new Map(vehicles.map((v) => [v.id, { lon: v.lon, lat: v.lat }]));
    const draw = (positions: Map<string, Pos>) =>
      source.setData(toCollection(vehicles, positions, routes, nowS));

    if (frame.current) cancelAnimationFrame(frame.current);
    const moving = vehicles.some((v) => {
      const a = from.get(v.id);
      return a && (a.lon !== v.lon || a.lat !== v.lat);
    });
    if (!moving || document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shown.current = to;
      draw(to);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const t = ease(Math.min(1, (now - start) / ANIMATION_MS));
      const current = new Map<string, Pos>();
      for (const [id, target] of to) {
        const a = from.get(id) ?? target;
        current.set(id, { lon: a.lon + (target.lon - a.lon) * t, lat: a.lat + (target.lat - a.lat) * t });
      }
      shown.current = current;
      draw(current);
      frame.current = t < 1 ? requestAnimationFrame(step) : null;
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [map, isLoaded, vehicles, routes, dark]);

  // Filtro por ruta elegida y anillo de oro del bus enfocado.
  useEffect(() => {
    if (!map || !isLoaded || !map.getLayer(DOT)) return;
    const hasBearing: ExpressionSpecification = [">=", ["get", "bearing"], 0];
    const byRoute: ExpressionSpecification | null = selectedRouteId
      ? ["==", ["get", "routeId"], selectedRouteId]
      : null;
    map.setFilter(DOT, byRoute);
    map.setFilter(ARROW, byRoute ? ["all", hasBearing, byRoute] : hasBearing);
    map.setFilter(FOCUS, ["==", ["get", "id"], focusedVehicleId ?? "__none__"]);
  }, [map, isLoaded, selectedRouteId, focusedVehicleId, dark]);

  return null;
}
