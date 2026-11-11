"use client";

import { useEffect, useRef, useState } from "react";
import type { VehiclesResponse } from "@bus/shared";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
const POLL_MS = 15_000;
/** Si la primera respuesta tarda más que esto, asumimos que Render está despertando el servicio. */
const WAKING_AFTER_MS = 4_000;
/** Un cold start de Render free puede tardar ~1 min. */
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_BACKOFF_MS = 60_000;

export type VehiclesStatus = "loading" | "waking" | "ok" | "stale" | "error";

export interface VehiclesState {
  data: VehiclesResponse | null;
  status: VehiclesStatus;
  /** Epoch ms de la última respuesta exitosa del API. */
  lastOkAt: number | null;
}

export function useVehicles(): VehiclesState {
  const [state, setState] = useState<VehiclesState>({ data: null, status: "loading", lastOkAt: null });
  const failures = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    const schedule = (ms: number) => {
      clearTimeout(timer);
      // No consultar con la pestaña oculta: ahorra horas del plan free de Render.
      if (!document.hidden) timer = setTimeout(load, ms);
    };

    async function load() {
      controller?.abort();
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), REQUEST_TIMEOUT_MS);
      const waking = setTimeout(() => {
        if (!cancelled) setState((s) => (s.data ? s : { ...s, status: "waking" }));
      }, WAKING_AFTER_MS);
      try {
        const res = await fetch(`${API_URL}/vehicles`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as VehiclesResponse;
        if (cancelled) return;
        failures.current = 0;
        setState({ data, status: data.stale ? "stale" : "ok", lastOkAt: Date.now() });
        schedule(POLL_MS);
      } catch {
        if (cancelled) return;
        failures.current += 1;
        setState((s) => ({ ...s, status: s.data ? "stale" : "error" }));
        schedule(Math.min(POLL_MS * 2 ** (failures.current - 1), MAX_BACKOFF_MS));
      } finally {
        clearTimeout(timeout);
        clearTimeout(waking);
      }
    }

    const onVisibility = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        void load();
      } else {
        clearTimeout(timer);
      }
    };

    void load();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return state;
}
