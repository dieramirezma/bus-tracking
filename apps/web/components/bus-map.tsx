"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Vehicle } from "@bus/shared";
import type { MapRef } from "@/components/ui/map";
import { Map } from "@/components/ui/map";
import { RouteShapes } from "@/components/layers/route-shapes";
import { StationsLayer } from "@/components/layers/stations-layer";
import { VehiclesLayer } from "@/components/layers/vehicles-layer";
import { MapButtons } from "@/components/map-buttons";
import { RoutePanel } from "@/components/route-panel";
import { SearchBar } from "@/components/search-bar";
import { RouteStrip, type StripBus } from "@/components/route-strip";
import { useStaticData } from "@/hooks/use-static-data";
import { useVehicles } from "@/hooks/use-vehicles";
import { useNow } from "@/hooks/use-now";
import {
  BOGOTA_CENTER,
  MAP_STYLES,
  indexStations,
  routeBounds,
  routePath,
  stripPosition,
  type Station,
} from "@/lib/transit";

const BUSIEST = 6;

/** Distancia de la banda de escritorio al borde inferior (bottom-11) y aire extra sobre ella. */
const BAND_BOTTOM = 44;
const BAND_CLEARANCE = 24;
/** La franja de avisos de borde (32 px) puede aparecer un instante después de medir. */
const BAND_LATE_GROWTH = 32;

/**
 * Espacio que ocupan buscador, panel y banda, para encuadrar sin taparlos. En escritorio la banda
 * se mide en vivo: su altura depende del rótulo de estación más largo y de los avisos de borde.
 */
function framePadding(band: HTMLElement | null) {
  if (typeof window === "undefined") return 48;
  if (!window.matchMedia("(min-width: 768px)").matches) {
    return { top: 88, bottom: Math.round(window.innerHeight * 0.46), left: 32, right: 64 };
  }
  const bottom = band ? band.offsetHeight + BAND_BOTTOM + BAND_CLEARANCE + BAND_LATE_GROWTH : 48;
  return { top: 48, bottom, left: 428, right: 72 };
}

export default function BusMap() {
  const mapRef = useRef<MapRef>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const { data: staticData, error: staticError } = useStaticData();
  const vehiclesState = useVehicles();
  const nowS = useNow(1000) / 1000;
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  /** Si la ruta se eligió tocando un bus, no se reencuadra toda la ruta. */
  const skipFit = useRef(false);

  const vehicles = useMemo(() => vehiclesState.data?.vehicles ?? [], [vehiclesState.data]);
  const routes = useMemo(() => staticData?.routes ?? {}, [staticData]);
  const stations = useMemo(
    () => (staticData ? indexStations(staticData.stations) : new globalThis.Map<string, Station>()),
    [staticData],
  );

  const busCount = useMemo(() => {
    const m = new globalThis.Map<string, number>();
    for (const v of vehicles) m.set(v.routeId, (m.get(v.routeId) ?? 0) + 1);
    return m;
  }, [vehicles]);

  const busiest = useMemo(
    () =>
      [...busCount.entries()]
        .filter(([id]) => routes[id])
        .sort((a, b) => b[1] - a[1])
        .slice(0, BUSIEST)
        .map(([id, count]) => ({ route: routes[id], count })),
    [busCount, routes],
  );

  const route = selectedRouteId ? (routes[selectedRouteId] ?? null) : null;
  const path = useMemo(() => routePath(route ?? undefined, stations), [route, stations]);

  const routeBuses = useMemo<StripBus[]>(() => {
    if (!route) return [];
    return vehicles
      .filter((v) => v.routeId === route.id)
      .map((v) => ({ vehicle: v, t: stripPosition(v, path) ?? 0 }));
  }, [route, vehicles, path]);

  const focusedVehicle = vehicles.find((v) => v.id === focusedId) ?? null;

  // Encuadra la ruta elegida desde el buscador o la lista.
  useEffect(() => {
    if (!selectedRouteId || !staticData) return;
    if (skipFit.current) {
      skipFit.current = false;
      return;
    }
    const bounds = routeBounds(staticData.shapes, selectedRouteId);
    if (bounds)
      mapRef.current?.fitBounds(bounds, {
        padding: framePadding(bandRef.current),
        maxZoom: 14,
        duration: 800,
      });
  }, [selectedRouteId, staticData]);

  // El bus enfocado deja de existir o de pertenecer a la ruta: se suelta.
  useEffect(() => {
    if (focusedId && (!focusedVehicle || (selectedRouteId && focusedVehicle.routeId !== selectedRouteId))) {
      setFocusedId(null);
    }
  }, [focusedId, focusedVehicle, selectedRouteId]);

  const selectRoute = useCallback((id: string | null) => {
    setSelectedRouteId(id);
    setFocusedId(null);
  }, []);

  const focusBus = useCallback((v: Vehicle) => {
    setFocusedId(v.id);
    mapRef.current?.easeTo({
      center: [v.lon, v.lat],
      zoom: Math.max(mapRef.current.getZoom(), 14),
      padding: framePadding(bandRef.current),
      duration: 700,
    });
  }, []);

  const onMapBus = useCallback(
    (vehicleId: string, routeId: string) => {
      if (routeId !== selectedRouteId) skipFit.current = true;
      setSelectedRouteId(routeId);
      setFocusedId(vehicleId);
    },
    [selectedRouteId],
  );

  const onStation = useCallback((s: Station) => {
    mapRef.current?.flyTo({
      center: [s.lon, s.lat],
      zoom: 15,
      padding: framePadding(bandRef.current),
      duration: 800,
    });
  }, []);

  return (
    <div className="bg-enamel relative h-dvh w-full overflow-hidden">
      <Map
        ref={mapRef}
        center={BOGOTA_CENTER}
        zoom={11.2}
        minZoom={9}
        maxBounds={[
          [-74.6, 4.2],
          [-73.6, 5.1],
        ]}
        styles={MAP_STYLES}
        attributionControl={{
          compact: true,
          customAttribution: "© TRANSMILENIO S.A. · datos abiertos / open data",
        }}
      >
        {staticData && (
          <>
            <RouteShapes shapes={staticData.shapes} selectedRouteId={selectedRouteId} />
            <StationsLayer data={staticData.stations} routeStationIds={route?.stations ?? []} />
          </>
        )}
        <VehiclesLayer
          vehicles={vehicles}
          routes={routes}
          selectedRouteId={selectedRouteId}
          focusedVehicleId={focusedId}
          onSelect={onMapBus}
        />
        <MapButtons className="absolute top-[76px] right-4 z-10 md:top-auto md:right-4 md:bottom-12" />
      </Map>

      <SearchBar
        routes={routes}
        busCount={busCount}
        selectedRoute={route}
        onSelect={selectRoute}
        className="absolute top-[max(12px,env(safe-area-inset-top))] right-4 left-4 z-20 md:top-4 md:right-auto md:left-4 md:w-[380px]"
      />

      <RoutePanel
        state={vehiclesState}
        staticError={staticError}
        nowS={nowS}
        route={route}
        routeBuses={routeBuses}
        path={path}
        busiest={busiest}
        totalBuses={vehicles.length}
        activeRoutes={busCount.size}
        focusedVehicle={focusedVehicle}
        onSelectRoute={selectRoute}
        onStation={onStation}
        onBus={focusBus}
        className="absolute right-0 bottom-0 left-0 z-10 max-h-[46dvh] rounded-t-[12px] pb-[env(safe-area-inset-bottom)] md:top-[76px] md:right-auto md:bottom-auto md:left-4 md:max-h-[calc(100dvh-92px)] md:w-[380px] md:rounded-[4px]"
      />

      {/* Escritorio: la tira de la ruta ocupa una banda ancha al pie del mapa */}
      {route && path.length >= 2 && (
        <div
          ref={bandRef}
          className="bg-enamel text-porcelain enamel-plate absolute right-[72px] bottom-11 left-[412px] z-10 hidden rounded-[4px] px-4 pt-4 md:block"
        >
          <RouteStrip
            code={route.shortName}
            path={path}
            buses={routeBuses}
            agency={route.agency}
            focusedId={focusedId}
            nowS={nowS}
            onStation={onStation}
            onBus={focusBus}
          />
        </div>
      )}
    </div>
  );
}
