# Bus tracking · TransMilenio en tiempo real

Mapa en vivo de los buses **troncales y duales** de TransMilenio (Bogotá), con sus trazados y estaciones, a partir de los datos abiertos GTFS / GTFS Realtime que publica TRANSMILENIO S.A.

**En vivo:** [bus-tracking.dieramirezma.dev](https://bus-tracking.dieramirezma.dev) · API: [`/health`](https://bus-tracking-api-o6pd.onrender.com/health)

| Capa     | Tecnología                                                  |
| -------- | ----------------------------------------------------------- |
| Frontend | Next.js 16 (`output: "export"`) en Cloudflare Pages         |
| Mapa     | mapcn + MapLibre GL, tiles OpenFreeMap (positron / dark)    |
| Backend  | Fastify 5 + TypeScript en Render (plan free)                |
| Datos    | GTFS Realtime (`positions.pb`) + GTFS estático (`GTFS.zip`) |
| DNS      | Cloudflare                                                  |

## Arquitectura

```
gtfs.transmilenio.gov.co/positions.pb ──cada 30 s──► apps/api (Fastify, Render)
                                                      decodifica → filtra troncales → calcula rumbo → caché
                                                      GET /vehicles · GET /health
Cloudflare Pages (apps/web) ──cada 15 s──► apps/api
  trazados y estaciones: /data/*.geojson estáticos (generados por packages/gtfs)
GitHub Action diaria: regenera los datos estáticos y hace commit → redeploy automático
```

¿Por qué un backend? El feed no envía cabeceras CORS y responde con `Cross-Origin-Resource-Policy: same-origin`, así que el navegador no puede leerlo directamente. Además el API reduce ~180 KB de protobuf con 4.000+ vehículos a ~20 KB gzip con solo los troncales.

## Estructura

```
apps/api         Fastify: poller GTFS-RT, /vehicles, /health
apps/web         Next.js estático con el mapa
packages/shared  Tipos compartidos (paquete interno, sin build)
packages/gtfs    Preprocesador del GTFS estático → JSON/GeoJSON livianos
```

## Desarrollo local

Requisitos: Node 22+, pnpm 10 (`corepack enable`).

```bash
pnpm install
cp .env.example apps/api/.env          # opcional, los valores por defecto sirven
pnpm --filter @bus/api dev             # http://localhost:3001/vehicles
pnpm --filter @bus/web dev             # http://localhost:3000
```

Otros comandos: `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm format`.

## Datos

- **Tiempo real**: `https://gtfs.transmilenio.gov.co/positions.pb` (también `tripupdates.pb` y `alerts.pb`; índice en `/manifest.json`). El encabezado se regenera cada ~26 s; cada bus reporta cada ~60 s. El feed **no** trae `bearing` ni `speed`: el API calcula el rumbo con posiciones consecutivas.
- **Estático**: `https://gtfs.transmilenio.gov.co/GTFS.zip` (~121 MB, diario). Troncal = `agency_id` 1 (Troncal) y 6 (Dual).
- **Regenerar datos**: `pnpm data` (descarga el ZIP) o `pnpm data -- ruta/GTFS.zip`. Escribe `apps/api/data/routes.json` y `apps/web/public/data/*`. Si el API detecta `route_id` que no están en el GTFS, los lista en `/health.unknownRouteIds`.
- **Atribución**: datos © TRANSMILENIO S.A.; mapa © OpenFreeMap, OpenMapTiles, colaboradores de OpenStreetMap.

## Despliegue

### API en Render

Desplegado en `https://bus-tracking-api-o6pd.onrender.com` desde el Blueprint (`render.yaml`): New → Blueprint → seleccionar este repo. Las variables viven en `render.yaml`; si se editan en el dashboard, la siguiente sincronización del Blueprint las sobrescribe.

| Variable           | Valor en producción                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `CORS_ORIGIN`      | dominio propio + `*.bus-tracking-1e8.pages.dev` (regex entre barras) + `localhost:3000`         |
| `CLIENT_IP_HEADER` | `cf-connecting-ip`: clave del rate limit (120 req/min por cliente)                              |
| `TRUST_PROXY`      | `true`: respaldo si no llega `CF-Connecting-IP`, y para que los logs muestren la IP del cliente |

- Render tiene Cloudflare delante (respuestas con `Server: cloudflare` y `CF-RAY`). Cloudflare sobrescribe `CF-Connecting-IP` con la IP real del visitante, así que un `X-Forwarded-For` falso no sirve para saltarse el rate limit. Si Render dejara de usar Cloudflare, hay que vaciar `CLIENT_IP_HEADER`.
- Plan free: el servicio se duerme tras 15 min sin tráfico; el primer acceso tarda ~1 min y la web muestra "Despertando el servidor…".

### Web en Cloudflare Pages

Proyecto `bus-tracking-1e8` (`https://bus-tracking-1e8.pages.dev`).

- Framework preset: _None_. Root directory: `/` (raíz del repo; con `apps/web` no encuentra el workspace).
- Build command: `pnpm turbo run build --filter=@bus/web`
- Build output directory: `apps/web/out`
- Variables: `NODE_VERSION=22`, `NEXT_PUBLIC_API_URL=https://bus-tracking-api-o6pd.onrender.com`. La URL del API se incrusta al compilar: si cambia, hay que volver a desplegar.

### Dominio en Cloudflare DNS

- Web: `bus-tracking.dieramirezma.dev` como _Custom domain_ del proyecto de Pages.
- Si se cambia o agrega un dominio, añadirlo a `CORS_ORIGIN` en `render.yaml`.
- Opcional, API con dominio propio: Render → Settings → Custom domain `api.<dominio>`; en Cloudflare crear `CNAME api → bus-tracking-api-o6pd.onrender.com` en modo **DNS only** (nube gris) hasta que Render emita el certificado. Después actualizar `NEXT_PUBLIC_API_URL` en Pages y redesplegar.

### Refresco diario de datos

`.github/workflows/refresh-gtfs.yml` corre a las 05:00 (Bogotá), regenera los datos y hace commit si cambiaron; Render (por `buildFilter`) y Pages redespliegan solos. Se puede lanzar a mano desde la pestaña _Actions_.
