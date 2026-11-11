"use client";

import { useMemo } from "react";
import type { TrunkRouteMap, Vehicle } from "@bus/shared";
import type { VehiclesState } from "@/hooks/use-vehicles";
import { COLORS, formatAgo } from "@/lib/transit";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<VehiclesState["status"], string> = {
  loading: "Conectando",
  waking: "Despertando servidor",
  ok: "En vivo",
  stale: "Desactualizado",
  error: "Sin conexión",
};

const STATUS_DOT: Record<VehiclesState["status"], string> = {
  loading: "bg-neutral-400",
  waking: "bg-amber-500 animate-pulse",
  ok: "bg-emerald-500",
  stale: "bg-amber-500",
  error: "bg-red-500",
};

interface StatusPanelProps {
  state: VehiclesState;
  routes: TrunkRouteMap;
  vehicles: Vehicle[];
  now: number;
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string | null) => void;
  /** Aviso opcional (cold start, feed caído…) que se muestra dentro del panel. */
  notice?: React.ReactNode;
}

export function StatusPanel({
  state,
  routes,
  vehicles,
  now,
  selectedRouteId,
  onSelectRoute,
  notice,
}: StatusPanelProps) {
  const { counts, byRoute } = useMemo(() => {
    const counts = { troncal: 0, dual: 0 };
    const byRoute = new Map<string, number>();
    for (const v of vehicles) {
      const agency = routes[v.routeId]?.agency ?? "troncal";
      counts[agency] += 1;
      byRoute.set(v.routeId, (byRoute.get(v.routeId) ?? 0) + 1);
    }
    return { counts, byRoute };
  }, [vehicles, routes]);

  const options = useMemo(
    () =>
      Object.values(routes).sort(
        (a, b) =>
          a.shortName.localeCompare(b.shortName, "es", { numeric: true }) ||
          a.longName.localeCompare(b.longName, "es"),
      ),
    [routes],
  );

  const visible = selectedRouteId ? (byRoute.get(selectedRouteId) ?? 0) : vehicles.length;
  const updatedAgo =
    state.data?.feedTimestamp != null ? formatAgo(now / 1000 - state.data.feedTimestamp) : null;

  return (
    <section
      aria-label="Estado del servicio"
      className="bg-background/92 text-foreground absolute top-3 right-3 left-3 z-10 flex flex-col gap-3 rounded-xl border p-4 shadow-lg backdrop-blur sm:right-auto sm:w-80"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="size-3 rounded-[3px]" style={{ backgroundColor: COLORS.troncal }} />
          <h1 className="text-[15px] leading-none font-semibold tracking-tight">TransMilenio en vivo</h1>
        </div>
        <span className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs" role="status">
          <span aria-hidden className={cn("size-2 rounded-full", STATUS_DOT[state.status])} />
          {STATUS_LABEL[state.status]}
        </span>
      </header>

      {notice}

      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl leading-none font-semibold tabular-nums">
            {state.data ? visible.toLocaleString("es-CO") : "—"}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {selectedRouteId ? "buses en esta ruta" : "buses troncales en operación"}
          </p>
        </div>
        <dl className="text-muted-foreground grid grid-cols-[auto_auto] gap-x-2 gap-y-0.5 text-xs tabular-nums">
          <dt className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: COLORS.troncal }} />
            Troncal
          </dt>
          <dd className="text-foreground text-right">{state.data ? counts.troncal : "—"}</dd>
          <dt className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: COLORS.dual }} />
            Dual
          </dt>
          <dd className="text-foreground text-right">{state.data ? counts.dual : "—"}</dd>
        </dl>
      </div>

      <label className="flex flex-col gap-1.5 text-xs">
        <span className="text-muted-foreground">Ruta</span>
        <select
          className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
          value={selectedRouteId ?? ""}
          onChange={(e) => onSelectRoute(e.target.value || null)}
          disabled={options.length === 0}
        >
          <option value="">Todas las rutas troncales</option>
          {options.map((r) => (
            <option key={r.id} value={r.id}>
              {r.shortName} · {r.longName}
              {byRoute.get(r.id) ? ` (${byRoute.get(r.id)})` : ""}
            </option>
          ))}
        </select>
      </label>

      <p className="text-muted-foreground text-[11px] leading-snug">
        {updatedAgo ? `Feed actualizado ${updatedAgo}` : "Esperando datos…"} · Datos abiertos de TRANSMILENIO
        S.A.
      </p>
    </section>
  );
}
