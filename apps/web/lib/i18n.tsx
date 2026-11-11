"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "es" | "en";

const dict = {
  es: {
    searchLabel: "Buscar ruta",
    searchPlaceholder: "Ruta o destino",
    clearSearch: "Borrar búsqueda",
    noMatch: (q: string) => `Ninguna ruta coincide con «${q}»`,
    langLabel: "Idioma",
    status: {
      loading: "Conectando",
      waking: "Despertando el servidor",
      ok: "En vivo",
      stale: "Datos desactualizados",
      error: "Sin conexión",
    },
    notice: {
      waking: "La primera carga puede tardar hasta un minuto.",
      error: "Reintentando…",
      stale: (ago: string) => `La última posición llegó ${ago}.`,
      staticError: "No se pudieron cargar las rutas y estaciones. Recarga la página.",
    },
    networkTitle: "Red troncal en vivo",
    networkCount: (buses: number, routes: number) => `${buses} buses en ${routes} rutas`,
    busiest: "Rutas con más buses",
    busesShort: (n: number) => (n === 1 ? "1 bus" : `${n} buses`),
    agency: { troncal: "Troncal", dual: "Dual" },
    towards: (dest: string) => `hacia ${dest}`,
    onRoute: (n: number) => (n === 1 ? "1 bus en la ruta" : `${n} buses en la ruta`),
    noBuses: "Ningún bus de esta ruta está reportando ahora.",
    allRoutes: "Ver todas las rutas",
    stripLabel: (code: string, stations: number, buses: number) =>
      `Recorrido de ${code}: ${stations} estaciones, ${buses} buses`,
    noStrip: "Esta ruta no tiene estaciones troncales para dibujar su recorrido.",
    busesBefore: (n: number) => (n === 1 ? "1 bus más atrás" : `${n} buses más atrás`),
    busesAfter: (n: number) => (n === 1 ? "1 bus más adelante" : `${n} buses más adelante`),
    station: (name: string) => `Estación ${name}`,
    busBetween: (label: string, from: string, to: string, ago: string) =>
      `Bus ${label}, entre ${from} y ${to}, reportó ${ago}`,
    busAt: (label: string, at: string, ago: string) => `Bus ${label}, en ${at}, reportó ${ago}`,
    focusedBus: (label: string, ago: string) => `Bus ${label} · reportó ${ago}`,
    ago: (s: number) => (s < 60 ? `hace ${Math.max(0, Math.round(s))} s` : `hace ${Math.round(s / 60)} min`),
    updatedAt: (time: string) => `Datos de las ${time}`,
    routeStatus: (n: number, ago: string) => `${n === 1 ? "1 bus" : `${n} buses`} · último reporte ${ago}`,
    zoomIn: "Acercar",
    zoomOut: "Alejar",
    locate: "Mi ubicación",
    independent: "Proyecto independiente con datos abiertos de TRANSMILENIO S.A.",
    loadingMap: "Cargando mapa…",
  },
  en: {
    searchLabel: "Search route",
    searchPlaceholder: "Route or destination",
    clearSearch: "Clear search",
    noMatch: (q: string) => `No route matches “${q}”`,
    langLabel: "Language",
    status: {
      loading: "Connecting",
      waking: "Waking the server",
      ok: "Live",
      stale: "Data out of date",
      error: "Offline",
    },
    notice: {
      waking: "The first load can take up to a minute.",
      error: "Retrying…",
      stale: (ago: string) => `The last position arrived ${ago}.`,
      staticError: "Routes and stations failed to load. Reload the page.",
    },
    networkTitle: "Trunk network, live",
    networkCount: (buses: number, routes: number) => `${buses} buses on ${routes} routes`,
    busiest: "Busiest routes now",
    busesShort: (n: number) => (n === 1 ? "1 bus" : `${n} buses`),
    agency: { troncal: "Trunk", dual: "Dual" },
    towards: (dest: string) => `towards ${dest}`,
    onRoute: (n: number) => (n === 1 ? "1 bus on this route" : `${n} buses on this route`),
    noBuses: "No bus on this route is reporting right now.",
    allRoutes: "All routes",
    stripLabel: (code: string, stations: number, buses: number) =>
      `${code} line: ${stations} stations, ${buses} buses`,
    noStrip: "This route has no trunk stations to draw its line.",
    busesBefore: (n: number) => (n === 1 ? "1 more bus behind" : `${n} more buses behind`),
    busesAfter: (n: number) => (n === 1 ? "1 more bus ahead" : `${n} more buses ahead`),
    station: (name: string) => `${name} station`,
    busBetween: (label: string, from: string, to: string, ago: string) =>
      `Bus ${label}, between ${from} and ${to}, reported ${ago}`,
    busAt: (label: string, at: string, ago: string) => `Bus ${label}, at ${at}, reported ${ago}`,
    focusedBus: (label: string, ago: string) => `Bus ${label} · reported ${ago}`,
    ago: (s: number) => (s < 60 ? `${Math.max(0, Math.round(s))} s ago` : `${Math.round(s / 60)} min ago`),
    updatedAt: (time: string) => `Data at ${time}`,
    routeStatus: (n: number, ago: string) => `${n === 1 ? "1 bus" : `${n} buses`} · latest report ${ago}`,
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    locate: "My location",
    independent: "Independent project using open data from TRANSMILENIO S.A.",
    loadingMap: "Loading map…",
  },
} as const;

export type Dict = (typeof dict)[Lang];

const LangContext = createContext<{ lang: Lang; t: Dict; setLang: (l: Lang) => void } | null>(null);
const STORAGE_KEY = "bus-tracking:lang";

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "es" || saved === "en") return saved;
  } catch {
    // almacenamiento bloqueado: se usa el idioma del navegador
  }
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    setLangState(initialLang());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // sin persistencia; el cambio sigue aplicando en esta sesión
    }
  }, []);

  const value = useMemo(() => ({ lang, t: dict[lang] as Dict, setLang }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang debe usarse dentro de LangProvider");
  return ctx;
}

/** Hora local de Bogotá en formato 24 h (HH:MM). */
export function bogotaTime(epochS: number): string {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Bogota",
  }).format(new Date(epochS * 1000));
}
