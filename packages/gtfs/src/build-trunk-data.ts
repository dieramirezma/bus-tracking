/**
 * Preprocesa el GTFS estático de TransMilenio y emite datos livianos para troncales:
 *  - apps/api/data/trunk-routes.json        (route_id -> metadatos; lo usa el API para filtrar buses)
 *  - apps/web/public/data/trunk-routes.json (mismos metadatos para el front)
 *  - apps/web/public/data/trunk-shapes.geojson
 *  - apps/web/public/data/stations.geojson
 *
 * Uso: pnpm --filter @bus/gtfs build:data [ruta/a/GTFS.zip]
 * Sin argumento descarga https://gtfs.transmilenio.gov.co/GTFS.zip a un directorio temporal.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import unzipper from "unzipper";

const GTFS_URL = process.env.GTFS_URL ?? "https://gtfs.transmilenio.gov.co/GTFS.zip";
// agency_id 1 = Transmilenio-Troncal, 6 = Transmilenio-Dual
const TRUNK_AGENCIES = new Set(["1", "6"]);
const ROOT = path.resolve(import.meta.dirname, "../../..");

type Row = Record<string, string>;

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

async function* rows(zip: unzipper.CentralDirectory, name: string): AsyncGenerator<Row> {
  const entry = zip.files.find((f) => f.path === name);
  if (!entry) throw new Error(`${name} no está en el GTFS`);
  const rl = readline.createInterface({ input: entry.stream(), crlfDelay: Infinity });
  let header: string[] | null = null;
  for await (const raw of rl) {
    const line = raw.replace(/^﻿/, "");
    if (!line) continue;
    const cols = splitCsv(line);
    if (!header) {
      header = cols;
      continue;
    }
    const r: Row = {};
    header.forEach((h, i) => (r[h] = cols[i] ?? ""));
    yield r;
  }
}

async function ensureZip(arg?: string): Promise<string> {
  if (arg) return path.resolve(arg);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tm-gtfs-"));
  const file = path.join(dir, "GTFS.zip");
  console.log(`Descargando ${GTFS_URL} ...`);
  const res = await fetch(GTFS_URL);
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} al descargar GTFS`);
  await pipeline(Readable.fromWeb(res.body as never), fs.createWriteStream(file));
  return file;
}

type Pt = [number, number];

/** Distancia perpendicular de p al segmento a-b (en grados; a 4.6° de latitud la distorsión es despreciable). */
function segDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Douglas-Peucker iterativo (~4 m de tolerancia) + redondeo a 5 decimales (~1 m). */
function simplify(coords: Pt[], tolerance = 0.000036): Pt[] {
  if (coords.length <= 2) return coords.map(round);
  const keep = new Uint8Array(coords.length);
  keep[0] = keep[coords.length - 1] = 1;
  const stack: [number, number][] = [[0, coords.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
    let maxD = 0;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = segDist(coords[i], coords[s], coords[e]);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (idx !== -1 && maxD > tolerance) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return coords.filter((_, i) => keep[i]).map(round);
}

function round(c: Pt): Pt {
  return [Math.round(c[0] * 1e5) / 1e5, Math.round(c[1] * 1e5) / 1e5];
}

async function main() {
  const zipPath = await ensureZip(process.argv.slice(2).find((a) => a !== "--"));
  const zip = await unzipper.Open.file(zipPath);

  // 1. routes
  const routes = new Map<
    string,
    { id: string; shortName: string; longName: string; color: string; agency: string; stations: string[] }
  >();
  // route_id de todas las rutas no troncales: el API los usa para distinguir
  // "no troncal conocido" de "desconocido" (señal de que el GTFS quedó desactualizado).
  const nonTrunk: string[] = [];
  for await (const r of rows(zip, "routes.txt")) {
    if (!TRUNK_AGENCIES.has(r.agency_id)) {
      nonTrunk.push(r.route_id);
      continue;
    }
    routes.set(r.route_id, {
      id: r.route_id,
      shortName: r.route_short_name,
      longName: r.route_long_name,
      color: `#${r.route_color || "ff0000"}`,
      agency: r.agency_id === "6" ? "dual" : "troncal",
      stations: [],
    });
  }
  console.log(`Rutas troncales/duales: ${routes.size}`);

  // 2. trips -> shapes por ruta, y set de trips troncales
  const tripToRoute = new Map<string, string>();
  const shapeRoutes = new Map<string, Set<string>>();
  const routeTrips = new Map<string, { tripId: string; shapeId: string }[]>();
  for await (const t of rows(zip, "trips.txt")) {
    if (!routes.has(t.route_id)) continue;
    tripToRoute.set(t.trip_id, t.route_id);
    if (!routeTrips.has(t.route_id)) routeTrips.set(t.route_id, []);
    routeTrips.get(t.route_id)!.push({ tripId: t.trip_id, shapeId: t.shape_id });
    if (t.shape_id) {
      if (!shapeRoutes.has(t.shape_id)) shapeRoutes.set(t.shape_id, new Set());
      shapeRoutes.get(t.shape_id)!.add(t.route_id);
    }
  }
  console.log(`Trips: ${tripToRoute.size}, shapes: ${shapeRoutes.size}`);

  // 3. shapes
  const pts = new Map<string, { seq: number; c: [number, number] }[]>();
  for await (const s of rows(zip, "shapes.txt")) {
    if (!shapeRoutes.has(s.shape_id)) continue;
    if (!pts.has(s.shape_id)) pts.set(s.shape_id, []);
    pts.get(s.shape_id)!.push({
      seq: Number(s.shape_pt_sequence),
      c: [Number(s.shape_pt_lon), Number(s.shape_pt_lat)],
    });
  }
  const shapeFeatures = [...pts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([shapeId, list]) => {
      list.sort((a, b) => a.seq - b.seq);
      const routeIds = [...shapeRoutes.get(shapeId)!].sort();
      return {
        type: "Feature" as const,
        // `routes` como ",id1,id2," permite filtrar en MapLibre con ["in", ",id,", ["get", "routes"]]
        // (MapLibre serializa a string los arrays en propiedades de GeoJSON).
        properties: { shapeId, routes: `,${routeIds.join(",")},`, color: routes.get(routeIds[0])!.color },
        geometry: { type: "LineString" as const, coordinates: simplify(list.map((p) => p.c)) },
      };
    });

  // Viaje representativo por ruta: el primero que recorre su trazado más largo.
  // Sus paradas, en orden, dan la secuencia de estaciones de la ruta (la tira del front).
  const repTripRoute = new Map<string, string>();
  for (const [routeId, trips] of routeTrips) {
    let best: { tripId: string; shapeId: string } | null = null;
    for (const t of trips) {
      if (!best || (pts.get(t.shapeId)?.length ?? 0) > (pts.get(best.shapeId)?.length ?? 0)) best = t;
    }
    if (best) repTripRoute.set(best.tripId, routeId);
  }
  const repStops = new Map<string, { seq: number; stopId: string }[]>();

  // 4. stop_times (578 MB) -> stops usados por rutas troncales
  const usedStops = new Set<string>();
  const stopRoutes = new Map<string, Set<string>>();
  for await (const st of rows(zip, "stop_times.txt")) {
    const routeId = tripToRoute.get(st.trip_id);
    if (!routeId) continue;
    const repRoute = repTripRoute.get(st.trip_id);
    if (repRoute) {
      if (!repStops.has(repRoute)) repStops.set(repRoute, []);
      repStops.get(repRoute)!.push({ seq: Number(st.stop_sequence), stopId: st.stop_id });
    }
    usedStops.add(st.stop_id);
    if (!stopRoutes.has(st.stop_id)) stopRoutes.set(st.stop_id, new Set());
    stopRoutes.get(st.stop_id)!.add(routeId);
  }

  // 5. stops -> estaciones. Solo se conservan estaciones reales (location_type=1);
  //    las paradas de calle que usan las rutas duales (location_type=0 sin padre) se descartan.
  const stops = new Map<string, Row>();
  for await (const s of rows(zip, "stops.txt")) stops.set(s.stop_id, s);
  const stations = new Map<string, { name: string; lat: number; lon: number; routes: Set<string> }>();
  for (const id of [...usedStops].sort()) {
    const s = stops.get(id);
    if (!s) continue;
    const parent = s.parent_station && stops.get(s.parent_station) ? stops.get(s.parent_station)! : s;
    if (parent.location_type !== "1") continue;
    const key = parent.stop_id;
    if (!stations.has(key)) {
      stations.set(key, {
        name: parent.stop_name,
        lat: Number(parent.stop_lat),
        lon: Number(parent.stop_lon),
        routes: new Set(),
      });
    }
    for (const r of stopRoutes.get(id)!) stations.get(key)!.routes.add(r);
  }
  const stationFeatures = [...stations.entries()].map(([id, s]) => ({
    type: "Feature" as const,
    properties: { id, name: s.name.replace(/\s+/g, " ").trim(), routeCount: s.routes.size },
    geometry: {
      type: "Point" as const,
      coordinates: [Math.round(s.lon * 1e5) / 1e5, Math.round(s.lat * 1e5) / 1e5],
    },
  }));

  // Secuencia de estaciones por ruta (solo estaciones troncales, sin repetir consecutivas).
  for (const [routeId, list] of repStops) {
    list.sort((a, b) => a.seq - b.seq);
    const seq: string[] = [];
    for (const { stopId } of list) {
      const s = stops.get(stopId);
      if (!s) continue;
      const parent = s.parent_station && stops.get(s.parent_station) ? stops.get(s.parent_station)! : s;
      if (parent.location_type !== "1" || !stations.has(parent.stop_id)) continue;
      if (seq[seq.length - 1] !== parent.stop_id) seq.push(parent.stop_id);
    }
    routes.get(routeId)!.stations = seq;
  }
  const withStrip = [...routes.values()].filter((r) => r.stations.length >= 2).length;
  console.log(`Rutas con secuencia de estaciones: ${withStrip}/${routes.size}`);

  // 6. escribir
  const routeMap = Object.fromEntries(routes);
  const write = (rel: string, data: unknown) => {
    const p = path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(data));
    console.log(`${rel}  ${(fs.statSync(p).size / 1024).toFixed(0)} KB`);
  };
  fs.rmSync(path.join(ROOT, "apps/api/data/trunk-routes.json"), { force: true });
  write("apps/api/data/routes.json", { trunk: routeMap, nonTrunk: nonTrunk.sort() });
  write("apps/web/public/data/trunk-routes.json", routeMap);
  write("apps/web/public/data/trunk-shapes.geojson", { type: "FeatureCollection", features: shapeFeatures });
  write("apps/web/public/data/stations.geojson", { type: "FeatureCollection", features: stationFeatures });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
