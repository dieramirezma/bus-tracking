/** Tipos compartidos entre apps/api y apps/web (paquete interno, sin build). */

export interface Vehicle {
  id: string;
  label: string;
  routeId: string;
  lat: number;
  lon: number;
  /** Grados 0–359 calculados entre posiciones consecutivas; null si aún no se conoce. */
  bearing: number | null;
  /** Epoch en segundos del último reporte del vehículo. */
  timestamp: number;
}

export interface VehiclesResponse {
  /** Epoch en ms de la última consulta exitosa del API al feed (0 = aún no hay datos). */
  fetchedAt: number;
  /** Epoch en segundos del header del feed GTFS-RT. */
  feedTimestamp: number | null;
  stale: boolean;
  count: number;
  vehicles: Vehicle[];
}

export interface TrunkRoute {
  id: string;
  shortName: string;
  longName: string;
  color: string;
  agency: "troncal" | "dual";
  /** IDs de estación (stations.geojson) en el orden del recorrido, de origen a destino. */
  stations: string[];
}

export type TrunkRouteMap = Record<string, TrunkRoute>;
