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
import { routeColor } from "@/lib/transit";

const SOURCE = "vehicles";
const CIRCLE = "vehicles-circle";
const ARROW = "vehicles-arrow";
const ARROW_ICON = "vehicle-arrow";
/** Duración de la animación entre dos lecturas (los buses reportan cada ~60 s). */
const ANIMATION_MS = 1500;

type Pos = { lon: number; lat: number };

/** Triángulo blanco 32x32 como icono SDF (se colorea con icon-color y rota con icon-rotate). */
function arrowImage(): ImageData {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(size / 2, 5);
  ctx.lineTo(size - 9, size - 8);
  ctx.lineTo(size / 2, size - 13);
  ctx.lineTo(9, size - 8);
  ctx.closePath();
  ctx.fill();
  return ctx.getImageData(0, 0, size, size);
}

function ensureLayers(map: MapLibreMap) {
  if (!map.hasImage(ARROW_ICON)) map.addImage(ARROW_ICON, arrowImage(), { sdf: true });
  if (!map.getSource(SOURCE)) {
    map.addSource(SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  }
  if (!map.getLayer(CIRCLE)) {
    map.addLayer({
      id: CIRCLE,
      type: "circle",
      source: SOURCE,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3.5, 13, 6, 16, 9],
        "circle-color": ["get", "color"],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 10, 0.8, 14, 1.6],
      },
    });
  }
  if (!map.getLayer(ARROW)) {
    map.addLayer({
      id: ARROW,
      type: "symbol",
      source: SOURCE,
      minzoom: 12,
      filter: [">=", ["get", "bearing"], 0],
      layout: {
        "icon-image": ARROW_ICON,
        "icon-size": ["interpolate", ["linear"], ["zoom"], 12, 0.32, 16, 0.5],
        "icon-rotate": ["get", "bearing"],
        "icon-rotation-alignment": "map",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
      paint: { "icon-color": "#ffffff" },
    });
  }
  // Siempre por encima de trazados y estaciones.
  map.moveLayer(CIRCLE);
  map.moveLayer(ARROW);
}

function toCollection(
  vehicles: Vehicle[],
  positions: Map<string, Pos>,
  routes: TrunkRouteMap,
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: vehicles.map((v) => {
      const p = positions.get(v.id) ?? v;
      return {
        type: "Feature",
        id: Number(v.id) || undefined,
        geometry: { type: "Point", coordinates: [p.lon, p.lat] },
        properties: {
          id: v.id,
          routeId: v.routeId,
          bearing: v.bearing ?? -1,
          color: routeColor(routes[v.routeId]?.agency),
        },
      };
    }),
  };
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

interface VehiclesLayerProps {
  vehicles: Vehicle[];
  routes: TrunkRouteMap;
  selectedRouteId: string | null;
  onSelect: (vehicleId: string | null) => void;
}

export function VehiclesLayer({ vehicles, routes, selectedRouteId, onSelect }: VehiclesLayerProps) {
  const { map, isLoaded } = useMap();
  /** Posiciones dibujadas actualmente (pueden estar a mitad de animación). */
  const shown = useRef(new Map<string, Pos>());
  const frame = useRef<number | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Capas + eventos; se re-agregan tras un cambio de estilo (isLoaded vuelve a true).
  useEffect(() => {
    if (!map || !isLoaded) return;
    ensureLayers(map);
    const click = (e: MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.id;
      if (typeof id === "string") onSelectRef.current(id);
    };
    const enter = () => (map.getCanvas().style.cursor = "pointer");
    const leave = () => (map.getCanvas().style.cursor = "");
    map.on("click", CIRCLE, click);
    map.on("mouseenter", CIRCLE, enter);
    map.on("mouseleave", CIRCLE, leave);
    return () => {
      map.off("click", CIRCLE, click);
      map.off("mouseenter", CIRCLE, enter);
      map.off("mouseleave", CIRCLE, leave);
      try {
        if (map.getLayer(ARROW)) map.removeLayer(ARROW);
        if (map.getLayer(CIRCLE)) map.removeLayer(CIRCLE);
        if (map.getSource(SOURCE)) map.removeSource(SOURCE);
      } catch {
        // el estilo puede estar recargándose
      }
    };
  }, [map, isLoaded]);

  // Animación desde la posición mostrada hasta la nueva lectura.
  useEffect(() => {
    if (!map || !isLoaded) return;
    const source = map.getSource(SOURCE) as GeoJSONSource | undefined;
    if (!source) return;

    const from = new Map(shown.current);
    const to = new Map(vehicles.map((v) => [v.id, { lon: v.lon, lat: v.lat }]));
    const draw = (positions: Map<string, Pos>) => source.setData(toCollection(vehicles, positions, routes));

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
  }, [map, isLoaded, vehicles, routes]);

  // Filtro por ruta seleccionada.
  useEffect(() => {
    if (!map || !isLoaded || !map.getLayer(CIRCLE)) return;
    const hasBearing: ExpressionSpecification = [">=", ["get", "bearing"], 0];
    const byRoute: ExpressionSpecification | null = selectedRouteId
      ? ["==", ["get", "routeId"], selectedRouteId]
      : null;
    map.setFilter(CIRCLE, byRoute);
    map.setFilter(ARROW, byRoute ? ["all", hasBearing, byRoute] : hasBearing);
  }, [map, isLoaded, selectedRouteId]);

  return null;
}
