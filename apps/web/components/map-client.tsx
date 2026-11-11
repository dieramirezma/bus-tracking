"use client";

import dynamic from "next/dynamic";
import { LangProvider } from "@/lib/i18n";

// MapLibre necesita WebGL/window: el mapa se renderiza solo en el navegador.
const BusMap = dynamic(() => import("@/components/bus-map"), {
  ssr: false,
  loading: () => (
    <div className="bg-enamel text-slateink flex h-dvh w-full items-center justify-center text-[15px]">
      Cargando mapa · Loading map
    </div>
  ),
});

export function MapClient() {
  return (
    <LangProvider>
      <BusMap />
    </LangProvider>
  );
}
