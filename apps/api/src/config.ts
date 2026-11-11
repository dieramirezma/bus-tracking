/** CORS_ORIGIN: lista separada por comas; las entradas entre barras (/.../) se interpretan como regex. */
export function parseOrigins(raw: string): (string | RegExp)[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.length > 2 && s.startsWith("/") && s.endsWith("/") ? new RegExp(s.slice(1, -1)) : s));
}

/**
 * TRUST_PROXY para Fastify: vacío → false (local), "true" → confiar en toda la cadena,
 * número → saltos de proxy de confianza, otro texto → lista de IPs/CIDR separada por comas.
 * Detrás del proxy de Render es necesario para que el rate limit vea la IP real del cliente.
 */
export function parseTrustProxy(
  raw: string | undefined,
): boolean | string[] | ((address: string, hop: number) => boolean) {
  const value = raw?.trim();
  if (!value || value === "false") return false;
  if (value === "true") return true;
  if (/^\d+$/.test(value)) {
    // Equivale a trustProxy numérico de Fastify (confiar en los primeros n saltos),
    // expresado como función porque los tipos de Fastify no aceptan number.
    const hops = Number(value);
    return (_address, hop) => hop < hops;
  }
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Clave del rate limit. Si CLIENT_IP_HEADER está definido (p. ej. "cf-connecting-ip" cuando hay
 * Cloudflare delante, que sobrescribe ese header con la IP real del visitante) se usa ese header;
 * si no viene, se usa la IP del request. Solo debe activarse detrás de un proxy que controle el header,
 * porque si el cliente pudiera enviarlo directamente podría falsearlo.
 */
export function clientKey(
  headers: Record<string, string | string[] | undefined>,
  ip: string,
  headerName: string | null,
): string {
  if (headerName) {
    const raw = headers[headerName];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (value) return value;
  }
  return ip;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  clientIpHeader: process.env.CLIENT_IP_HEADER?.trim().toLowerCase() || null,
  baseUrl: (process.env.TRANSMI_RT_BASE ?? "https://gtfs.transmilenio.gov.co").replace(/\/$/, ""),
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 30_000),
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN ?? "http://localhost:3000"),
};
