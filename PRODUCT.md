# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pasajeros de TransMilenio en movimiento. Abren la web sobre todo en el celular, antes de salir o mientras esperan en la estación o el paradero, para ver dónde vienen los buses de la ruta que les sirve. Uso breve, con una mano, a menudo en exteriores y con conexión móvil variable.

## Product Purpose

Mostrar en un mapa la posición en tiempo real de los buses troncales y duales de TransMilenio, junto con sus rutas y estaciones. El éxito es que el pasajero encuentre su ruta y vea sus buses en pocos segundos, sin instalar nada ni aprender la interfaz.

## Positioning

Una página web, sin instalación ni cuenta, que muestra toda la red troncal en vivo a partir de los datos abiertos oficiales (GTFS / GTFS Realtime) publicados por TRANSMILENIO S.A. Es un proyecto independiente y no oficial.

## Operating Context

- Se consulta desde el navegador del celular en trayectos reales: en casa antes de salir, caminando hacia la estación o en la plataforma.
- La web es estática (Cloudflare Pages, dominio `bus-tracking.dieramirezma.dev`) y consulta un API propio (Render, plan free) cada 15 s.
- Tras 15 minutos sin visitas el API se duerme; la primera carga después tarda cerca de un minuto y la interfaz debe explicarlo.

## Capabilities and Constraints

- **Qué hay:** posición de cada bus troncal y dual (agencias 1 y 6 del GTFS), su ruta (código corto y nombre largo), la etiqueta del bus, el rumbo calculado entre lecturas y la antigüedad del último reporte; trazados de las 144 rutas y las 143 estaciones troncales.
- **Ritmo de los datos:** el feed se regenera cada ~26 s, pero cada bus reporta cada ~60 s; los buses avanzan a saltos y la web los anima entre lecturas.
- **Qué no hay:** tiempos de llegada (ETA) confiables. El feed no trae tiempos por parada y desde el 10-nov-2026 sus `stop_id` y `trip_id` no son confiables, así que la web no debe prometer "llega en X min". Tampoco hay buses zonales/SITP ni TransMiCable.
- **Datos estáticos:** rutas, trazados y estaciones se regeneran a diario desde `GTFS.zip`; los `route_id` son IDs internos que pueden cambiar.
- **Estados que la interfaz debe cubrir:** cargando, servidor despertando (cold start), en vivo, datos desactualizados (feed sin actualizar > 5 min) y sin conexión.
- **Atribución obligatoria:** datos © TRANSMILENIO S.A.; mapa © OpenFreeMap, OpenMapTiles y colaboradores de OpenStreetMap.
- **Idiomas:** español e inglés (confirmado). Hoy la interfaz solo está en español.
- **Abierto:** el nombre público del producto (hoy el repo es `bus-tracking` y la interfaz dice "TransMilenio en vivo").

## Brand Commitments

- Proyecto independiente y no oficial: nunca debe parecer un producto de TransMilenio. Sin su logo, su marca ni elementos que sugieran respaldo oficial; el nombre "TransMilenio" solo se usa de forma descriptiva.
- Interfaz bilingüe español / inglés.

## Evidence on Hand

- Datos en vivo reales del API (`/vehicles`, `/health`) y datos estáticos en `apps/web/public/data/`.
- No hay usuarios medidos, testimonios, métricas de uso ni prensa; no se deben inventar.

## Product Principles

1. **La ruta primero.** El camino más corto es: abrir → elegir mi ruta → ver mis buses. Todo lo demás es secundario.
2. **Honesto con los datos.** Mostrar qué tan reciente es cada posición y cuándo el feed falla; nunca simular precisión que el feed no tiene (sin ETA inventados).
3. **Hecho para el andén.** Legible en exteriores, operable con una mano y tolerante a conexiones lentas y al arranque en frío del servidor.
4. **Independiente y transparente.** Deja claro que es un proyecto personal con datos abiertos y da crédito a sus fuentes.
