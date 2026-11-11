"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Vehicle } from "@bus/shared";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { AGE_FADE_S, stationShort, type Station } from "@/lib/transit";
import { cn } from "@/lib/utils";

/** Separación entre estaciones en la tira (px) y margen lateral. */
const STEP = 76;
const PAD = 28;
/** Altura de la línea dentro de la tira. */
const LINE_Y = 56;
/** Ancho dibujado de un bus: cuerpo de 26 px + punta de 7 px + 1 px de aire. */
const CROWD = 34;
const ROWS = 2;

export interface StripBus {
  vehicle: Vehicle;
  /** Índice fraccionario sobre la secuencia de estaciones. */
  t: number;
}

interface Placed {
  x: number;
  row: number;
  members: StripBus[];
}

interface RouteStripProps {
  code: string;
  path: Station[];
  buses: StripBus[];
  agency: "troncal" | "dual";
  focusedId: string | null;
  nowS: number;
  onStation: (station: Station) => void;
  onBus: (vehicle: Vehicle) => void;
}

/**
 * Cada bus va en la primera fila con espacio libre; si ninguna fila tiene espacio, se suma al
 * último grupo de la fila más cercana y ese grupo muestra cuántos buses lleva.
 */
function place(buses: StripBus[]): Placed[] {
  const sorted = [...buses].sort((a, b) => a.t - b.t);
  const out: Placed[] = [];
  const last: (Placed | null)[] = Array(ROWS).fill(null);
  for (const b of sorted) {
    const x = PAD + b.t * STEP;
    const free = last.findIndex((p) => !p || x - p.x >= CROWD);
    if (free >= 0) {
      const p = { x, row: free, members: [b] };
      out.push(p);
      last[free] = p;
    } else {
      const nearest = last.reduce((a, p) => (p!.x > a!.x ? p : a))!;
      nearest.members.push(b);
    }
  }
  return out;
}

export function RouteStrip({
  code,
  path,
  buses,
  agency,
  focusedId,
  nowS,
  onStation,
  onBus,
}: RouteStripProps) {
  const { t } = useLang();
  const scroller = useRef<HTMLDivElement>(null);
  const width = PAD * 2 + (path.length - 1) * STEP;
  const placed = useMemo(() => place(buses), [buses]);
  // Altura justa para el rótulo más largo (12 px condensada en mayúsculas ≈ 7.4 px por carácter, tope 132 px).
  const height = useMemo(() => {
    const longest = Math.max(0, ...path.map((s) => stationShort(s.name).length));
    const labelW = Math.min(132, longest * 7.4);
    return Math.ceil(LINE_Y + 18 + labelW * Math.SQRT1_2 + 10);
  }, [path]);

  // Ventana visible de la tira, para contar los buses que quedan fuera a cada lado.
  const [view, setView] = useState({ left: 0, width: 0 });
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => setView({ left: el.scrollLeft, width: el.clientWidth });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Al cambiar de ruta, la tira arranca en el tramo con más buses.
  useEffect(() => {
    const el = scroller.current;
    if (!el || placed.length === 0) return;
    const w = el.clientWidth;
    let bestLeft = 0;
    let bestCount = -1;
    for (const p of placed) {
      const left = Math.max(0, p.x - w * 0.15);
      const count = placed
        .filter((o) => o.x >= left && o.x <= left + w - 16)
        .reduce((n, o) => n + o.members.length, 0);
      if (count > bestCount) {
        bestCount = count;
        bestLeft = left;
      }
    }
    el.scrollTo({ left: bestLeft, behavior: "auto" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, path.length, placed.length > 0]);

  const count = (ps: Placed[]) => ps.reduce((n, p) => n + p.members.length, 0);
  const hiddenBefore = view.width ? count(placed.filter((p) => p.x < view.left + 4)) : 0;
  const hiddenAfter = view.width ? count(placed.filter((p) => p.x > view.left + view.width - 4)) : 0;
  // La franja de avisos de borde solo existe si la tira no cabe entera (estable por ruta, sin saltos al desplazar).
  const overflows = view.width > 0 && width > view.width;
  const page = (dir: -1 | 1) =>
    scroller.current?.scrollBy({ left: dir * view.width * 0.8, behavior: "smooth" });

  const nameAt = (i: number) => path[Math.max(0, Math.min(path.length - 1, i))]?.name ?? "";
  const describe = (b: StripBus) => {
    const age = t.ago(nowS - b.vehicle.timestamp);
    const from = nameAt(Math.floor(b.t));
    const to = nameAt(Math.ceil(b.t));
    return from === to ? t.busAt(b.vehicle.label, from, age) : t.busBetween(b.vehicle.label, from, to, age);
  };

  return (
    <div className={cn("relative", overflows && "pt-8")}>
      {hiddenBefore > 0 && (
        <EdgeChip side="left" label={t.busesBefore(hiddenBefore)} onClick={() => page(-1)} agency={agency}>
          <ChevronLeft aria-hidden className="size-4" strokeWidth={2} />
          {hiddenBefore}
        </EdgeChip>
      )}
      {hiddenAfter > 0 && (
        <EdgeChip side="right" label={t.busesAfter(hiddenAfter)} onClick={() => page(1)} agency={agency}>
          {hiddenAfter}
          <ChevronRight aria-hidden className="size-4" strokeWidth={2} />
        </EdgeChip>
      )}
      <div
        ref={scroller}
        className="enamel-scroll -mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2"
        role="group"
        aria-label={t.stripLabel(code, path.length, buses.length)}
      >
        <div className="relative" style={{ width, height }}>
          {/* Línea de la ruta */}
          <div
            aria-hidden
            className="bg-gold absolute h-1 rounded-full"
            style={{ left: PAD, width: width - PAD * 2, top: LINE_Y - 2 }}
          />

          {/* Estaciones: anillo en transbordos y extremos; nombre corto a 45° como en un diagrama */}
          {path.map((s, i) => {
            const interchange = s.routeCount >= 8 || i === 0 || i === path.length - 1;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onStation(s)}
                aria-label={t.station(s.name)}
                title={s.name}
                className="group absolute"
                style={{ left: PAD + i * STEP - 16, top: LINE_Y - 16, width: 32, height: 116 }}
              >
                <span
                  aria-hidden
                  className={cn(
                    "bg-porcelain border-enamel absolute left-1/2 -translate-x-1/2 rounded-full transition-transform group-hover:scale-110",
                    interchange
                      ? "outline-porcelain size-[18px] border-[3px] outline-2"
                      : "size-[14px] border-[3px]",
                  )}
                  style={{ top: interchange ? 7 : 9 }}
                />
                <span
                  aria-hidden
                  className="font-condensed text-porcelain/85 group-hover:text-porcelain absolute top-[34px] left-[12px] max-w-[132px] origin-top-left rotate-45 truncate text-left text-[12px] font-medium tracking-[0.08em] whitespace-nowrap uppercase"
                >
                  {stationShort(s.name)}
                </span>
              </button>
            );
          })}

          {/* Buses (o grupos de buses que no caben por separado) */}
          {placed.map((p) => {
            const lead = p.members[0];
            const newest = Math.max(...p.members.map((m) => m.vehicle.timestamp));
            const age = nowS - newest;
            const fade = age < AGE_FADE_S[0] ? 1 : age < AGE_FADE_S[1] ? 0.7 : 0.45;
            const focused = p.members.some((m) => m.vehicle.id === focusedId);
            const top = p.row === 0 ? 20 : 0;
            const n = p.members.length;
            return (
              <button
                key={lead.vehicle.id}
                type="button"
                onClick={() => onBus(lead.vehicle)}
                aria-label={p.members.map(describe).join(". ")}
                aria-pressed={focused}
                className="strip-bus absolute"
                style={{ left: p.x - 13, top, width: 26, height: LINE_Y - top - 4, opacity: fade }}
              >
                <Pennant agency={agency} focused={focused} count={n > 1 ? n : undefined} />
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-1/2 w-px -translate-x-1/2",
                    focused ? "bg-gold" : "bg-porcelain/60",
                  )}
                  style={{ top: 16, bottom: 0 }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** El bus de la tira: banderín con punta hacia el destino (la tira va de origen a destino). */
function Pennant({
  agency,
  focused = false,
  count,
  small = false,
}: {
  agency: "troncal" | "dual";
  focused?: boolean;
  count?: number;
  small?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "font-condensed tabular grid place-items-center rounded-[3px] leading-none font-semibold",
        small ? "relative h-2.5 w-4" : "absolute top-0 left-0 h-4 w-[26px] text-[12px]",
        agency === "dual" ? "border-2" : "border",
        focused
          ? "bg-gold border-gold text-enamel"
          : agency === "dual"
            ? "border-porcelain bg-enamel text-porcelain"
            : "bg-porcelain border-porcelain text-enamel",
      )}
    >
      {count}
      <span
        className={cn(
          "absolute top-1/2 -translate-y-1/2 border-y-transparent",
          small ? "-right-[5px] border-y-[3px] border-l-[4px]" : "-right-[7px] border-y-[5px] border-l-[6px]",
          focused ? "border-l-gold" : "border-l-porcelain",
        )}
      />
    </span>
  );
}

/** Aviso en el borde de la tira: cuántos buses quedan fuera de vista hacia ese lado. */
function EdgeChip({
  side,
  label,
  onClick,
  agency,
  children,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
  agency: "troncal" | "dual";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "bg-enamel-raised text-porcelain border-enamel-line tabular font-condensed absolute top-0 z-10 flex h-7 items-center gap-1.5 rounded-[3px] border px-1.5 text-[14px] font-semibold",
        side === "left" ? "-left-1" : "-right-1",
      )}
    >
      {side === "right" && <Pennant agency={agency} small />}
      {children}
      {side === "left" && <Pennant agency={agency} small />}
    </button>
  );
}
