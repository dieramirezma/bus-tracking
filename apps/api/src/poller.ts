import gtfs from "gtfs-realtime-bindings";
import type { TrunkRouteMap, Vehicle, VehiclesResponse } from "@bus/shared";
import routesData from "../data/routes.json" with { type: "json" };

const TRUNK_IDS = new Set(Object.keys(routesData.trunk as TrunkRouteMap));
const NON_TRUNK_IDS = new Set<string>(routesData.nonTrunk);

/** Vehículos sin reporte por más de esto se descartan (seg). */
const MAX_VEHICLE_AGE_S = 5 * 60;
/** Si el header del feed es más viejo que esto, el feed se considera desactualizado (seg). */
const MAX_FEED_AGE_S = 5 * 60;
/** Movimiento mínimo (grados ≈ 15 m) para recalcular el rumbo; evita ruido GPS con el bus detenido. */
const MIN_MOVE_DEG = 0.00013;

export interface PollerOptions {
  baseUrl: string;
  intervalMs: number;
  log: { info: (m: string) => void; warn: (m: string) => void };
}

export function bearingBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export interface DecodeResult {
  vehicles: Vehicle[];
  feedTimestamp: number | null;
  /** route_id presentes en el feed que no están en el GTFS estático (ni troncal ni no troncal). */
  unknownRouteIds: string[];
}

export function decodeVehicles(
  buf: Uint8Array,
  prev: Map<string, Vehicle>,
  nowS = Date.now() / 1000,
): DecodeResult {
  const feed = gtfs.transit_realtime.FeedMessage.decode(buf);
  const feedTimestamp = feed.header.timestamp ? Number(feed.header.timestamp) : null;
  const vehicles: Vehicle[] = [];
  const unknown = new Set<string>();
  for (const e of feed.entity) {
    const v = e.vehicle;
    const routeId = v?.trip?.routeId;
    const pos = v?.position;
    if (!v || !routeId || !pos) continue;
    if (!TRUNK_IDS.has(routeId)) {
      if (!NON_TRUNK_IDS.has(routeId)) unknown.add(routeId);
      continue;
    }
    const ts = v.timestamp ? Number(v.timestamp) : (feedTimestamp ?? 0);
    if (nowS - ts > MAX_VEHICLE_AGE_S) continue;

    const id = v.vehicle?.id || e.id;
    const before = prev.get(id);
    // protobufjs expone los campos opcionales ausentes con su valor por defecto (bearing = 0),
    // así que solo se usa el bearing del feed si viene explícitamente en el mensaje.
    let bearing: number | null = Object.hasOwn(pos, "bearing") ? pos.bearing! : (before?.bearing ?? null);
    if (before && Math.hypot(pos.latitude - before.lat, pos.longitude - before.lon) > MIN_MOVE_DEG) {
      bearing = bearingBetween(before.lat, before.lon, pos.latitude, pos.longitude);
    }
    vehicles.push({
      id,
      label: v.vehicle?.label || id,
      routeId,
      lat: pos.latitude,
      lon: pos.longitude,
      bearing: bearing === null ? null : Math.round(bearing) % 360,
      timestamp: ts,
    });
  }
  return { vehicles, feedTimestamp, unknownRouteIds: [...unknown].sort() };
}

export class Poller {
  private state: VehiclesResponse = {
    fetchedAt: 0,
    feedTimestamp: null,
    stale: true,
    count: 0,
    vehicles: [],
  };
  private prev = new Map<string, Vehicle>();
  private timer: NodeJS.Timeout | null = null;
  private inflight: Promise<void> | null = null;
  lastError: string | null = null;
  unknownRouteIds: string[] = [];

  constructor(private opts: PollerOptions) {}

  get snapshot(): VehiclesResponse {
    return this.state;
  }

  /** Devuelve el snapshot; en arranque en frío espera (hasta timeoutMs) a la primera lectura. */
  async ready(timeoutMs = 10_000): Promise<VehiclesResponse> {
    if (this.state.fetchedAt === 0 && this.inflight) {
      await Promise.race([this.inflight, new Promise((r) => setTimeout(r, timeoutMs))]);
    }
    return this.state;
  }

  start() {
    void this.tick();
    this.timer = setInterval(() => void this.tick(), this.opts.intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }

  tick(): Promise<void> {
    // Evita solapar consultas si el upstream está lento.
    this.inflight ??= this.poll().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async poll() {
    try {
      const res = await fetch(`${this.opts.baseUrl}/positions.pb`, {
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`upstream HTTP ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      const { vehicles, feedTimestamp, unknownRouteIds } = decodeVehicles(buf, this.prev);
      this.prev = new Map(vehicles.map((v) => [v.id, v]));
      const feedAge = feedTimestamp ? Date.now() / 1000 - feedTimestamp : Infinity;
      this.state = {
        fetchedAt: Date.now(),
        feedTimestamp,
        stale: feedAge > MAX_FEED_AGE_S,
        count: vehicles.length,
        vehicles,
      };
      if (unknownRouteIds.length && unknownRouteIds.join() !== this.unknownRouteIds.join()) {
        this.opts.log.warn(
          `${unknownRouteIds.length} route_id no están en el GTFS estático; regenerar datos (pnpm --filter @bus/gtfs build:data)`,
        );
      }
      this.unknownRouteIds = unknownRouteIds;
      this.lastError = null;
    } catch (err) {
      // Conserva el último snapshot pero lo marca como desactualizado.
      this.lastError = err instanceof Error ? err.message : String(err);
      this.opts.log.warn(`poll failed: ${this.lastError}`);
      this.state = { ...this.state, stale: true };
    }
  }
}
