"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MapRef } from "@/components/ui/map";
import { Map, MapControls, MapPopup } from "@/components/ui/map";
import { RouteShapes } from "@/components/layers/route-shapes";
import { StationsLayer } from "@/components/layers/stations-layer";
import { VehiclesLayer } from "@/components/layers/vehicles-layer";
import { StatusPanel } from "@/components/status-panel";
import { StatusBanner } from "@/components/status-banner";
import { useStaticData } from "@/hooks/use-static-data";
import { useVehicles } from "@/hooks/use-vehicles";
import { useNow } from "@/hooks/use-now";
import { BOGOTA_CENTER, MAP_STYLES, formatAgo, routeBounds, routeColor } from "@/lib/transit";

export default function BusMap() {
  const mapRef = useRef<MapRef>(null);
  const { data: staticData, error: staticError } = useStaticData();
  const vehiclesState = useVehicles();
  const now = useNow();
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const vehicles = useMemo(() => vehiclesState.data?.vehicles ?? [], [vehiclesState.data]);
  const routes = useMemo(() => staticData?.routes ?? {}, [staticData]);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;

  // Encuadra la ruta elegida.
  useEffect(() => {
    if (!selectedRouteId || !staticData) return;
    const bounds = routeBounds(staticData.shapes, selectedRouteId);
    if (bounds) mapRef.current?.fitBounds(bounds, { padding: 64, maxZoom: 14, duration: 800 });
  }, [selectedRouteId, staticData]);

  // Cierra el popup si el bus desaparece o queda fuera del filtro.
  useEffect(() => {
    if (!selectedVehicleId) return;
    const v = vehicles.find((x) => x.id === selectedVehicleId);
    if (!v || (selectedRouteId && v.routeId !== selectedRouteId)) setSelectedVehicleId(null);
  }, [vehicles, selectedVehicleId, selectedRouteId]);

  const selectedRoute = selectedVehicle ? routes[selectedVehicle.routeId] : undefined;

  return (
    <div className="relative h-dvh w-full">
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
        attributionControl={{ compact: true, customAttribution: "Datos: TRANSMILENIO S.A." }}
      >
        {staticData && (
          <>
            <RouteShapes shapes={staticData.shapes} selectedRouteId={selectedRouteId} />
            <StationsLayer data={staticData.stations} />
          </>
        )}
        <VehiclesLayer
          vehicles={vehicles}
          routes={routes}
          selectedRouteId={selectedRouteId}
          onSelect={setSelectedVehicleId}
        />
        {selectedVehicle && (
          <MapPopup
            key={selectedVehicle.id}
            longitude={selectedVehicle.lon}
            latitude={selectedVehicle.lat}
            onClose={() => setSelectedVehicleId(null)}
            closeButton
          >
            <div className="flex min-w-44 flex-col gap-1.5 pr-5">
              <div className="flex items-center gap-2">
                <span
                  className="rounded px-1.5 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: routeColor(selectedRoute?.agency) }}
                >
                  {selectedRoute?.shortName ?? "?"}
                </span>
                <span className="text-sm font-medium leading-tight">
                  {selectedRoute?.longName ?? "Ruta desconocida"}
                </span>
              </div>
              <div className="text-muted-foreground flex justify-between gap-4 text-xs tabular-nums">
                <span>Bus {selectedVehicle.label}</span>
                <span>{formatAgo(now / 1000 - selectedVehicle.timestamp)}</span>
              </div>
            </div>
          </MapPopup>
        )}
        <MapControls position="bottom-right" showLocate showCompass />
      </Map>

      <StatusPanel
        state={vehiclesState}
        routes={routes}
        vehicles={vehicles}
        now={now}
        selectedRouteId={selectedRouteId}
        onSelectRoute={(id) => {
          setSelectedRouteId(id);
          setSelectedVehicleId(null);
        }}
        notice={<StatusBanner state={vehiclesState} staticError={staticError} now={now} />}
      />
    </div>
  );
}
