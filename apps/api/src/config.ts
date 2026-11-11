/** CORS_ORIGIN: lista separada por comas; las entradas entre barras (/.../) se interpretan como regex. */
export function parseOrigins(raw: string): (string | RegExp)[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.length > 2 && s.startsWith("/") && s.endsWith("/") ? new RegExp(s.slice(1, -1)) : s));
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  baseUrl: (process.env.TRANSMI_RT_BASE ?? "https://gtfs.transmilenio.gov.co").replace(/\/$/, ""),
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 30_000),
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN ?? "http://localhost:3000"),
};
