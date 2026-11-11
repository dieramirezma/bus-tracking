"use client";

import dynamic from "next/dynamic";

// MapLibre necesita WebGL/window: el mapa se renderiza solo en el navegador.
const BusMap = dynamic(() => import("@/components/bus-map"), {
  ssr: false,
  loading: () => (
    <div className="bg-muted text-muted-foreground flex h-dvh w-full items-center justify-center text-sm">
      Cargando mapa…
    </div>
  ),
});

export function MapClient() {
  return <BusMap />;
}
