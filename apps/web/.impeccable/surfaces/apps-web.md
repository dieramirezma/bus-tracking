---
version: 1
slug: "apps-web"
primary_target: "apps/web"
related_targets: []
---

# Surface: mapa en vivo (apps/web)

## Scope

Mode: Operate. La única pantalla de la web: mapa en vivo de buses troncales y duales con buscador de ruta. Mobile-first (390 px), también escritorio.

## Audience, task, constraints

- Pasajero en movimiento, celular en una mano, a menudo en exteriores. Tarea: encontrar su ruta y ver dónde vienen sus buses en segundos.
- Se conservan: mapa base OpenFreeMap (positron claro / dark oscuro) y modo claro/oscuro según el sistema.
- La paleta de buses y trazados se separa de los colores de TransMilenio (nada de rojo troncal, verde, azul zonal ni naranja).
- Se siente mal si parece app oficial, dashboard SaaS genérico, juguetón o frío/técnico. Indicación del usuario: formal y serio.
- Interfaz bilingüe español / inglés. Sin ETA: el feed no trae tiempos por parada.

## Direction contract

THESIS: La ruta elegida se lee como diagrama de tránsito: una tira lineal con sus estaciones en orden y cada bus ubicado entre ellas. Rechaza el arreglo por defecto de la categoría (píldora de búsqueda flotante blanca + hoja inferior gris con chips, al estilo Google Maps/Uber).

OWN-WORLD: Esmalte azul medianoche (#13203a) como carcasa en ambos modos: barra de búsqueda y panel de ruta. Porcelana (#f2f3f0) para texto y marcas de estación; pizarra (#8d99ae) para lo secundario; una sola tinta de línea, oro ocre (#d6a531), reservada a la ruta elegida. Filetes finos de porcelana, esquinas de 4 px, rótulos de estación en Fira Sans Condensed en versalitas espaciadas, cifras tabulares. Líneas del diagrama a 0°, 45° y 90°. Buses: troncal relleno, dual en anillo; nunca se distinguen solo por color.

STORY: El pasajero abre, ve la red viva y un buscador listo; escribe su ruta o la elige, y entiende de inmediato cuántos buses hay y entre qué estaciones van, y qué tan reciente es cada dato.

FIRST VIEWPORT: Móvil 390×844. Arriba, barra de esmalte de 48 px a 16 px de los bordes: campo «Busca tu ruta» con lupa y selector ES · EN. Centro: mapa a sangre con la red en pizarra y los buses. Abajo, panel de esmalte con esquinas superiores de 12 px: sin ruta, estado de la red («En vivo · 412 buses troncales», hora del feed) y las rutas con más buses como accesos; con ruta, la insignia oro del código, destino y sentido, la tira de la ruta (firma) y la línea de estado. La acción primaria es el campo de búsqueda.

FORM: Diagrama de tránsito en esmalte (retador que ganó la segunda mano; mi lista: 1 plancha del IGAC, 2 gris bogotano y cerros, 3 información modernista suiza, 4 billetes de la República — asignado —, 5 ladrillo de Salmona, 6 Estación de la Sabana, 7 papel sellado). Firma: la tira de la ruta, que se desplaza con los buses y lleva al mapa al tocar una estación. seed:86b763aedac7a31f

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Nombre público del producto (sigue abierto en PRODUCT.md); la interfaz usa «bus-tracking · Bogotá» sin invocar marca oficial.
