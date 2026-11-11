"use client";

import type { VehiclesState } from "@/hooks/use-vehicles";
import { formatAgo } from "@/lib/transit";

interface StatusBannerProps {
  state: VehiclesState;
  staticError: boolean;
  now: number;
}

/** Avisos de conexión: arranque en frío de Render, feed sin actualizar o API caída. */
export function StatusBanner({ state, staticError, now }: StatusBannerProps) {
  let message: string | null = null;

  if (staticError) {
    message = "No se pudieron cargar las rutas y estaciones. Recarga la página.";
  } else if (state.status === "waking") {
    message = "Despertando el servidor… la primera carga puede tardar hasta un minuto.";
  } else if (state.status === "error") {
    message = "No hay conexión con el servidor. Reintentando…";
  } else if (state.status === "stale") {
    const feedTs = state.data?.feedTimestamp;
    message = feedTs
      ? `Datos desactualizados: la última posición recibida fue ${formatAgo(now / 1000 - feedTs)}.`
      : "Datos desactualizados. Reintentando…";
  }

  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-md border border-amber-500/40 bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-950 dark:bg-amber-950/60 dark:text-amber-50"
    >
      {message}
    </div>
  );
}
