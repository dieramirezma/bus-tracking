"use client";

import { useEffect, useState } from "react";
import type { StaticData } from "@/lib/transit";

/** Carga los JSON/GeoJSON generados por packages/gtfs (servidos desde /data). */
export function useStaticData(): { data: StaticData | null; error: boolean } {
  const [data, setData] = useState<StaticData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const get = (path: string) =>
      fetch(path).then((r) => {
        if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
        return r.json();
      });
    Promise.all([
      get("/data/trunk-routes.json"),
      get("/data/trunk-shapes.geojson"),
      get("/data/stations.geojson"),
    ])
      .then(([routes, shapes, stations]) => {
        if (!cancelled) setData({ routes, shapes, stations });
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error };
}
