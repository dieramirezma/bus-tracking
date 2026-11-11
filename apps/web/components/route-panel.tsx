"use client";

import { Clock3, Hourglass, WifiOff, X, TriangleAlert } from "lucide-react";
import type { TrunkRoute, Vehicle } from "@bus/shared";
import type { VehiclesState } from "@/hooks/use-vehicles";
import { bogotaTime, useLang } from "@/lib/i18n";
import { displayName, type Station } from "@/lib/transit";
import { RouteStrip, type StripBus } from "@/components/route-strip";
import { cn } from "@/lib/utils";

const LAMP: Record<VehiclesState["status"], string> = {
  loading: "bg-slateink",
  waking: "bg-lamp-degraded animate-pulse",
  ok: "bg-lamp-live",
  stale: "bg-lamp-degraded",
  error: "bg-lamp-critical",
};

interface RoutePanelProps {
  state: VehiclesState;
  staticError: boolean;
  nowS: number;
  route: TrunkRoute | null;
  routeBuses: StripBus[];
  path: Station[];
  busiest: { route: TrunkRoute; count: number }[];
  totalBuses: number;
  activeRoutes: number;
  focusedVehicle: Vehicle | null;
  onSelectRoute: (id: string | null) => void;
  onStation: (s: Station) => void;
  onBus: (v: Vehicle) => void;
  className?: string;
}

export function RoutePanel(props: RoutePanelProps) {
  const {
    state,
    staticError,
    nowS,
    route,
    routeBuses,
    path,
    busiest,
    totalBuses,
    activeRoutes,
    focusedVehicle,
  } = props;
  const { t } = useLang();
  const feedTs = state.data?.feedTimestamp ?? null;

  return (
    <section
      aria-label={route ? `${route.shortName} · ${route.longName}` : t.networkTitle}
      className={cn("bg-enamel text-porcelain enamel-scroll enamel-plate overflow-y-auto", props.className)}
    >
      {/* Línea de estado: siempre en el mismo lugar */}
      <div className="border-enamel-line flex items-center justify-between gap-3 border-b px-4 py-2.5 text-[13px]">
        <span className="flex items-center gap-2" role="status">
          <span aria-hidden className={cn("size-2 rounded-full", LAMP[state.status])} />
          <span className="font-medium">{t.status[state.status]}</span>
        </span>
        {feedTs && <span className="tabular text-slateink">{t.updatedAt(bogotaTime(feedTs))}</span>}
      </div>

      <Notice state={state} staticError={staticError} nowS={nowS} />

      {route ? (
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <span className="bg-gold text-enamel font-condensed shrink-0 rounded-[3px] px-2.5 py-0.5 text-[26px] leading-tight font-semibold tracking-wide">
              {route.shortName}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 className="text-[20px] leading-tight font-semibold text-balance">
                {t.towards(displayName(route.longName))}
              </h2>
              <p className="text-slateink mt-0.5 text-[14px]">{t.agency[route.agency]}</p>
            </div>
            <button
              type="button"
              onClick={() => props.onSelectRoute(null)}
              aria-label={t.allRoutes}
              title={t.allRoutes}
              className="text-slateink hover:text-porcelain hover:bg-enamel-raised -mt-1 -mr-2 grid size-10 shrink-0 place-items-center rounded-[4px] transition-colors"
            >
              <X className="size-5" strokeWidth={1.75} />
            </button>
          </div>

          <div className="mt-4 md:hidden">
            {path.length >= 2 ? (
              <RouteStrip
                code={route.shortName}
                path={path}
                buses={routeBuses}
                agency={route.agency}
                focusedId={focusedVehicle?.id ?? null}
                nowS={nowS}
                onStation={props.onStation}
                onBus={props.onBus}
              />
            ) : (
              <p className="text-slateink text-[14px]">{t.noStrip}</p>
            )}
          </div>

          <p className="text-slateink tabular mt-1 text-[14px] md:mt-3">
            {focusedVehicle ? (
              <span className="text-porcelain">
                {t.focusedBus(focusedVehicle.label, t.ago(nowS - focusedVehicle.timestamp))}
              </span>
            ) : routeBuses.length > 0 ? (
              t.routeStatus(
                routeBuses.length,
                t.ago(nowS - Math.max(...routeBuses.map((b) => b.vehicle.timestamp))),
              )
            ) : state.data ? (
              t.noBuses
            ) : null}
          </p>
        </div>
      ) : (
        <div className="px-4 pt-4 pb-4">
          <h2 className="text-[20px] leading-tight font-semibold">{t.networkTitle}</h2>
          <p className="tabular text-slateink mt-1 text-[15px]">
            {state.data ? t.networkCount(totalBuses, activeRoutes) : "—"}
          </p>

          {busiest.length > 0 && (
            <>
              <h3 className="font-condensed text-slateink mt-5 text-[13px] font-semibold tracking-[0.08em] uppercase">
                {t.busiest}
              </h3>
              <ul className="border-enamel-line mt-2 border-t">
                {busiest.map(({ route: r, count }) => (
                  <li key={r.id} className="border-enamel-line border-b">
                    <button
                      type="button"
                      onClick={() => props.onSelectRoute(r.id)}
                      className="hover:bg-enamel-raised -mx-4 grid w-[calc(100%+2rem)] grid-cols-[4.25rem_1fr_auto] items-baseline gap-3 px-4 py-3 text-left transition-colors"
                    >
                      <span className="font-condensed text-[18px] font-semibold tracking-wide">
                        {r.shortName}
                      </span>
                      <span className="truncate text-[15px]">{displayName(r.longName)}</span>
                      <span className="tabular text-slateink text-[14px]">{t.busesShort(count)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="text-slateink mt-4 text-[12px] leading-snug">{t.independent}</p>
        </div>
      )}
      <Attribution />
    </section>
  );
}

/**
 * En el celular el panel tapa la atribución de MapLibre, así que se muestra aquí (obligatoria para
 * OpenFreeMap/OpenStreetMap y los datos de TRANSMILENIO S.A.). En escritorio se ve la del mapa.
 */
function Attribution() {
  const link = "underline underline-offset-2 hover:text-porcelain";
  return (
    <p className="text-slateink border-enamel-line border-t px-4 py-2.5 text-[12px] leading-snug md:hidden">
      ©{" "}
      <a className={link} href="https://openfreemap.org" target="_blank" rel="noreferrer">
        OpenFreeMap
      </a>{" "}
      ·{" "}
      <a className={link} href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">
        OpenMapTiles
      </a>{" "}
      ·{" "}
      <a className={link} href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
        OpenStreetMap
      </a>{" "}
      · © TRANSMILENIO S.A.
    </p>
  );
}

function Notice({ state, staticError, nowS }: { state: VehiclesState; staticError: boolean; nowS: number }) {
  const { t } = useLang();
  let icon: React.ReactNode = null;
  let text: string | null = null;
  if (staticError) {
    icon = <TriangleAlert className="text-lamp-critical size-[18px]" strokeWidth={1.75} />;
    text = t.notice.staticError;
  } else if (state.status === "waking") {
    icon = <Hourglass className="text-lamp-degraded size-[18px]" strokeWidth={1.75} />;
    text = t.notice.waking;
  } else if (state.status === "error") {
    icon = <WifiOff className="text-lamp-critical size-[18px]" strokeWidth={1.75} />;
    text = t.notice.error;
  } else if (state.status === "stale" && state.data?.feedTimestamp) {
    icon = <Clock3 className="text-lamp-degraded size-[18px]" strokeWidth={1.75} />;
    text = t.notice.stale(t.ago(nowS - state.data.feedTimestamp));
  }
  if (!text) return null;
  return (
    <div
      role="alert"
      className="border-enamel-line flex items-start gap-2.5 border-b px-4 py-3 text-[14px] leading-snug"
    >
      <span aria-hidden className="mt-px shrink-0">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}
