---
name: bus-tracking
description: Buses troncales y duales de Bogotá en vivo, leídos como un diagrama de tránsito en esmalte.
colors:
  gold: "#d6a531"
  enamel: "#13203a"
  enamel-raised: "#1c2c4c"
  enamel-line: "rgba(242, 243, 240, 0.16)"
  porcelain: "#f2f3f0"
  slateink: "#aab4c5"
  lamp-live: "#8fd6b0"
  lamp-degraded: "#f0b45a"
  lamp-critical: "#f08f80"
  network-light: "#7d889c"
  network-dark: "#5d6b84"
  network-muted-light: "#cdd2da"
  network-muted-dark: "#262d3a"
  dark-ground: "#0e1015"
typography:
  display:
    fontFamily: "Fira Sans Condensed, Fira Sans, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.025em"
  headline:
    fontFamily: "Fira Sans, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
  title:
    fontFamily: "Fira Sans Condensed, Fira Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    letterSpacing: "0.025em"
  input:
    fontFamily: "Fira Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 500
  body:
    fontFamily: "Fira Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  body-sm:
    fontFamily: "Fira Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.375
  status:
    fontFamily: "Fira Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    fontFeature: "tnum"
  label:
    fontFamily: "Fira Sans Condensed, Fira Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    letterSpacing: "0.08em"
  station-label:
    fontFamily: "Fira Sans Condensed, Fira Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.08em"
  caption:
    fontFamily: "Fira Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.375
rounded:
  pennant: "3px"
  plate: "4px"
  sheet: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  strip-step: "76px"
  strip-pad: "28px"
components:
  search-field:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.porcelain}"
    typography: "{typography.input}"
    rounded: "{rounded.plate}"
    height: "48px"
    padding: "0 6px 0 12px"
  lang-toggle:
    textColor: "{colors.slateink}"
    typography: "{typography.label}"
    rounded: "{rounded.pennant}"
    height: "36px"
    width: "36px"
  lang-toggle-active:
    backgroundColor: "{colors.porcelain}"
    textColor: "{colors.enamel}"
  route-badge:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.enamel}"
    typography: "{typography.display}"
    rounded: "{rounded.pennant}"
    padding: "2px 10px"
  panel-plate:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.porcelain}"
    rounded: "{rounded.plate}"
    padding: "16px"
  panel-sheet-mobile:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.porcelain}"
    rounded: "{rounded.sheet}"
  list-row:
    textColor: "{colors.porcelain}"
    typography: "{typography.body}"
    padding: "12px 16px"
  list-row-hover:
    backgroundColor: "{colors.enamel-raised}"
  map-button:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.porcelain}"
    rounded: "{rounded.plate}"
    size: "40px"
  map-button-hover:
    backgroundColor: "{colors.enamel-raised}"
  edge-chip:
    backgroundColor: "{colors.enamel-raised}"
    textColor: "{colors.porcelain}"
    rounded: "{rounded.pennant}"
    height: "28px"
    padding: "0 6px"
  pennant-troncal:
    backgroundColor: "{colors.porcelain}"
    textColor: "{colors.enamel}"
    rounded: "{rounded.pennant}"
    height: "16px"
    width: "26px"
  pennant-dual:
    backgroundColor: "{colors.enamel}"
    textColor: "{colors.porcelain}"
    rounded: "{rounded.pennant}"
    height: "16px"
    width: "26px"
  pennant-focused:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.enamel}"
    rounded: "{rounded.pennant}"
    height: "16px"
    width: "26px"
---

# Design System: bus-tracking

## Overview

**Creative North Star: "Diagrama de tránsito en esmalte"**

La interfaz es un rótulo esmaltado sobre la ciudad. La carcasa (buscador, panel, botones del mapa, banda de la tira) es esmalte azul medianoche con texto de porcelana y filetes finos, como una placa de señalética de andén; el mapa corre a sangre por debajo. La ruta elegida no se lee como una lista de datos sino como un diagrama: una tira lineal con sus estaciones en orden, rótulos a 45° y cada bus ubicado entre ellas. Es formal y sereno, nunca juguetón ni de dashboard.

La densidad es de andén: pocas cosas, grandes y legibles al sol, operables con un pulgar. Todo el color está quieto salvo una tinta, el oro, que solo existe para la ruta que el pasajero eligió. Troncal y dual se separan por forma, no por color, y la paleta se mantiene deliberadamente fuera del código cromático de TransMilenio: el proyecto es independiente y no oficial, y no debe parecer lo contrario.

La carcasa de esmalte es la misma en modo claro y oscuro. Solo cambian con el tema del sistema el mapa base de OpenFreeMap (positron / dark) y las tintas de las capas del mapa.

**Key Characteristics:**

- Carcasa de esmalte medianoche idéntica en ambos modos; el mapa base es lo único que cambia de tema.
- Una sola tinta de línea, oro, reservada a la ruta elegida.
- Troncal = relleno, dual = anillo o contorno; nunca solo color.
- Firma: la tira de la ruta, con estaciones de porcelana, rótulos condensados a 45° y buses en banderín.
- Plano: la profundidad viene del filete de porcelana hacia adentro, no de sombras.
- Cifras tabulares en todo conteo y hora.

## Colors

Una paleta de señalética nocturna: esmalte, porcelana y pizarra en reposo, un solo oro para la ruta, y tres luces de estado que solo aparecen cuando significan algo.

### Primary

- **Oro ocre de línea** (`gold`): la única tinta de línea. Insignia del código de ruta, núcleo del trazado elegido en el mapa, línea de la tira, banderín y anillo del bus enfocado. En las superficies del navegador marca la selección de texto, el cursor de los campos y el anillo de foco.

### Tertiary

- **Luz en vivo** (`lamp-live`): punto de estado de 8 px cuando el feed está al día.
- **Luz degradada** (`lamp-degraded`): servidor despertando (con pulso) o datos desactualizados; también el icono del aviso correspondiente.
- **Luz crítica** (`lamp-critical`): sin conexión o error de datos estáticos.

### Neutral

- **Esmalte azul medianoche** (`enamel`): toda la carcasa (buscador, panel, botones del mapa, banda de la tira, atribución del mapa) y el color de tema del navegador en ambos modos. También es el borde de las estaciones de la tira y el casing del trazado elegido en modo claro.
- **Esmalte realzado** (`enamel-raised`): fila activa o en hover, botón en hover, chips de borde de la tira.
- **Filete de porcelana** (`enamel-line`): bordes de 1 px y divisores sobre esmalte.
- **Porcelana** (`porcelain`): texto principal sobre esmalte, marcas de estación, banderín troncal, opción activa del selector ES · EN.
- **Pizarra clara** (`slateink`): texto secundario, iconos en reposo, placeholder, hora del feed, conteos. Es más clara que la pizarra del contrato (#8d99ae, 5,6:1) para alcanzar 7,8:1 sobre esmalte: decisión de legibilidad en exteriores con el celular al sol.
- **Red en pizarra** (`network-light` / `network-dark`): la red troncal completa en el mapa, opaca, según el tema.
- **Red atenuada** (`network-muted-light` / `network-muted-dark`): la misma red cuando hay ruta elegida, para que el oro quede solo.
- **Suelo oscuro** (`dark-ground`): en modo oscuro, casing del trazado elegido, relleno del bus dual y halo de rótulos de estación.

### Named Rules

**The Single Ink Rule.** El oro es la ruta elegida y nada más. Ningún otro elemento puede usar oro: ni marcadores, ni alertas, ni decoración. El marcador de ubicación se cambió a porcelana y esmalte precisamente por esta regla. Las únicas excepciones son las superficies nativas del navegador que indican la elección del usuario (selección, cursor, foco).

**The Shape Not Hue Rule.** Troncal y dual se distinguen por forma: troncal relleno, dual en anillo o contorno de 2 px. Ningún tipo de bus o ruta se codifica solo con color.

**The Independent Palette Rule.** Las tintas de rutas y buses nunca usan el rojo troncal, verde, azul zonal ni naranja de TransMilenio. Las luces de estado son semánticas, viven solo como puntos de 8 px o iconos de 18 px dentro de la carcasa y nunca tiñen una ruta, un bus o una estación.

## Typography

**Display Font:** Fira Sans Condensed (con Fira Sans y sans-serif)
**Body Font:** Fira Sans (con sans-serif)

**Character:** Fira Sans es una humanista de herencia en señalética, legible al sol y en pantallas pequeñas; la condensada lleva todo lo que es código o rótulo de diagrama (códigos de ruta, estaciones, contadores de banderín, ES · EN). Ambas se sirven desde el propio sitio con `next/font` (Fira Sans 400–700, condensada 500–600).

### Hierarchy

- **Display** (`display`): el código de ruta en la insignia de oro. Solo ahí.
- **Headline** (`headline`): destino de la ruta («hacia Portal Usme») y título de la red; admite `text-wrap: balance`.
- **Title** (`title`): códigos de ruta en filas de lista y resultados del buscador.
- **Input** (`input`): texto del campo de búsqueda; 16 px para que el celular no haga zoom.
- **Body** (`body`, `body-sm`): nombres de destino en filas (truncados en una línea), conteos de la red, avisos y línea de estado de la ruta.
- **Status** (`status`): la línea de estado fija del panel (luz + estado + hora del feed).
- **Label** (`label`): en mayúsculas; encabezado de la lista de rutas con más buses y el selector ES · EN (este último a 0,05em).
- **Station label** (`station-label`): en mayúsculas, rotado 45°, tope de 132 px truncado, porcelana al 85 % que sube a 100 % en hover.
- **Caption** (`caption`): atribución y la nota de proyecto independiente.

### Named Rules

**The Tabular Figures Rule.** Toda cifra que cambia en vivo (conteos de buses, horas, antigüedad de reportes, contadores de banderín y chips) va en cifras tabulares para no bailar entre lecturas.

**The Condensed Is Signage Rule.** La condensada es para lo que se leería en un rótulo o un diagrama: códigos, estaciones, contadores. La prosa y los destinos van en Fira Sans normal.

## Layout

Mapa a sangre (`100dvh`) con la carcasa flotando encima. Un solo punto de corte en 768 px.

**Móvil (primero, 390 px):** buscador arriba, a 16 px de los lados y a `max(12px, safe-area-inset-top)` del borde; botones del mapa a la derecha, 76 px desde arriba. Abajo, el panel como hoja de borde a borde, con esquinas superiores de 12 px, alto máximo de 46 dvh, desplazamiento interno y respeto del `safe-area-inset-bottom`. La tira de la ruta vive dentro del panel y la atribución del mapa se muestra al pie del panel (la de MapLibre se oculta porque el panel la taparía).

**Escritorio:** columna izquierda de 380 px a 16 px del borde (buscador arriba, panel debajo a 76 px, alto máximo `100dvh − 92px`, esquinas de 4 px). Con ruta elegida, la tira sale del panel a una banda ancha al pie del mapa (de 412 px a 72 px de los bordes laterales, 44 px sobre el borde inferior). El encuadre del mapa reserva el espacio de buscador, panel y banda para que nada tape la ruta.

**Ritmo:** base de 4 px. Paneles con 16 px de margen interno; filas de 12 px verticales; línea de estado de 10 px; separaciones de 8 y 12 px entre icono y texto. En la tira, 76 px entre estaciones y 28 px de margen lateral; la línea va a 56 px del borde superior y el alto se ajusta al rótulo más largo.

**Movimiento:** los buses del mapa se deslizan 1,5 s con salida cúbica hacia cada nueva lectura, y los de la tira siguen el mismo ritmo; los encuadres de cámara duran de 700 a 900 ms. Con `prefers-reduced-motion` los buses saltan sin animación.

## Elevation & Depth

Plano. Las placas de esmalte se apoyan sobre el mapa sin sombra; su peso viene del contraste del esmalte contra el mapa claro y de un filete de porcelana al 20 % dibujado 5 px hacia adentro del borde, como un rótulo esmaltado. Sobre esmalte, el estado se expresa por tono (`enamel-raised`), no por elevación.

### Shadow Vocabulary

- **Marcador de ubicación** (`box-shadow: 0 1px 3px rgba(19,32,58,0.4)`): solo el disco «usted está aquí» sobre el mapa, para despegarlo de las calles. No se usa en la carcasa.

### Named Rules

**The Inset Fillet Rule.** Toda placa mayor de esmalte (buscador, panel, banda de la tira) lleva el filete interior de porcelana; ninguna lleva sombra.

## Shapes

Esquinas pequeñas y firmes, de señalética: 4 px para placas y botones, 3 px para piezas internas (insignia, banderines, chips, selector, botones dentro de placas) y 12 px solo para las esquinas superiores de la hoja móvil. Los círculos completos son de las marcas del diagrama: estaciones, buses del mapa, luces de estado. Bordes de 1 px en `enamel-line`. La geometría del diagrama es ortogonal y a 45°: la tira es horizontal, los rótulos de estación van a 45°.

## Components

### Buttons

Sobrios, de esmalte, con iconos SVG de trazo 1,75.

- **Shape:** placa de 40 × 40 px con esquinas de 4 px (zoom unido en un bloque vertical; ubicar separado 8 px).
- **Primary:** esmalte con icono de porcelana y borde `enamel-line`.
- **Hover / Focus:** fondo `enamel-raised`; foco visible con contorno de oro de 2 px a 2 px de distancia (global). Deshabilitado al 50 %.
- **Icon ghost:** cerrar ruta y borrar búsqueda son icono `slateink` sin fondo que pasa a porcelana (y `enamel-raised` en el panel) en hover; área táctil de 36–40 px.

### Chips

- **Selector ES · EN:** segmentado de 36 px de alto con borde `enamel-line` y esquinas de 3 px; la opción activa es porcelana con texto esmalte, la otra `slateink`.
- **Chips de borde de la tira:** `enamel-raised` con borde `enamel-line`, 28 px de alto, condensada 14 px semibold tabular; muestran un mini banderín y cuántos buses quedan fuera de vista hacia ese lado, y al tocarlos desplazan la tira.

### Cards / Containers

- **Corner Style:** 4 px (12 px arriba en la hoja móvil).
- **Background:** `enamel`.
- **Shadow Strategy:** ninguna; filete interior (ver Elevation & Depth).
- **Border:** 1 px `enamel-line` en el buscador; divisores `enamel-line` entre línea de estado, aviso, contenido y atribución.
- **Internal Padding:** 16 px.
- **Scroll:** barra fina de porcelana al 28 % sobre fondo transparente.

### Inputs / Fields

- **Style:** el buscador es una placa de esmalte de 48 px con lupa `slateink`, texto porcelana y placeholder `slateink`; contiene el botón de borrar y el selector ES · EN.
- **Focus:** cursor de oro; contorno de oro solo en foco por teclado.
- **Lista de resultados:** placa de esmalte 4 px debajo del campo, alto máximo 52 dvh; filas en rejilla código · destino · conteo, la activa en `enamel-raised`. Sin coincidencias: una línea `slateink`.

### Navigation

No hay navegación por páginas: el buscador es la acción primaria y la lista de rutas con más buses (seis filas: código condensado, destino truncado, conteo tabular) funciona como acceso directo. Una ruta se cierra con la X del panel.

### Línea de estado y avisos

- **Línea de estado:** siempre en el mismo lugar, arriba del panel: luz de 8 px, estado en texto y, a la derecha, hora del feed en `slateink` tabular.
- **Avisos:** franja debajo, con icono de 18 px teñido por la luz que corresponde y texto de 14 px; solo existen cuando hay algo que decir (despertando, desactualizado, sin conexión, error de datos).

### La tira de la ruta (firma)

El diagrama lineal de la ruta elegida, de origen a destino.

- **Línea:** oro, 4 px, extremos redondos.
- **Estaciones:** disco de porcelana de 14 px con borde de esmalte de 3 px; en transbordos (8 o más rutas) y extremos, 18 px con anillo exterior de porcelana de 2 px. Rótulo condensado en mayúsculas a 45°. Tocar una estación lleva el mapa a ella.
- **Buses:** banderín de 26 × 16 px, esquinas de 3 px, con punta hacia el destino y un mástil de 1 px hasta la línea. Troncal relleno de porcelana; dual en esmalte con contorno de porcelana de 2 px; enfocado en oro. Dos filas; si no caben (34 px por bus), se agrupan y el banderín muestra la cantidad.
- **Antigüedad:** opacidad 1 hasta 90 s, 0,7 hasta 180 s, 0,45 después; el mismo umbral que en el mapa.
- **Arranque:** al elegir ruta, la tira se desplaza al tramo con más buses.

### Capas del mapa

`components/ui/map.tsx` es mapcn (tercero); el mundo solo lo usa a través de capas propias.

- **Trazados:** red opaca en pizarra (la transparencia se acumularía en corredores compartidos). La ruta elegida va encima en dos capas: casing de esmalte (suelo oscuro en modo oscuro) y núcleo de oro.
- **Buses:** círculos que crecen con el zoom. Modo claro: troncal relleno de esmalte con borde de porcelana; dual relleno de porcelana con anillo de esmalte de 2,2. Modo oscuro: invertido. Bus enfocado con anillo de oro de 3 px. Flechas de rumbo desde zoom 12,5. Misma atenuación por antigüedad que la tira.
- **Estaciones:** puntos de porcelana con borde de esmalte (invertido en oscuro) desde zoom 11,5; las de la ruta elegida crecen y adelantan sus nombres a zoom 12. Nombres en mayúsculas espaciadas; usan la fuente del servidor de glifos del mapa base (Noto Sans), no Fira.
- **Ubicación:** área de precisión de esmalte al 12 % con disco de porcelana, borde de esmalte y punto central de esmalte: una forma que ningún bus usa y sin oro.
- **Atribución:** placa de esmalte de 4 px, texto `slateink` de 11 px, enlaces subrayados.

## Do's and Don'ts

### Do:

- **Do** reservar `gold` a la ruta elegida: insignia, núcleo del trazado, línea de la tira y bus enfocado.
- **Do** distinguir troncal y dual por forma (relleno frente a anillo o contorno de 2 px) en el mapa y en la tira.
- **Do** mantener la carcasa en `enamel` en ambos modos y dejar que solo el mapa base y las tintas de capa cambien de tema.
- **Do** usar `slateink` (7,8:1 sobre esmalte) para todo texto secundario; legibilidad al sol antes que sutileza.
- **Do** dar a cada placa mayor de esmalte el filete interior de porcelana en lugar de sombra.
- **Do** escribir toda cifra en vivo con cifras tabulares y mostrar la antigüedad del dato (atenuación 1 / 0,7 / 0,45 a 90 s y 180 s).
- **Do** usar la condensada en mayúsculas espaciadas (0,08em) para rótulos de estación y etiquetas de lista.

### Don't:

- **Don't** usar oro para nada que no sea la ruta elegida (marcadores, alertas, acentos, hover).
- **Don't** codificar rutas o buses con el rojo, verde, azul o naranja de TransMilenio, ni con su logo o marca.
- **Don't** distinguir troncal y dual solo por color.
- **Don't** volver al arreglo por defecto de la categoría: píldora de búsqueda blanca flotante y hoja inferior gris con chips.
- **Don't** usar las luces de estado fuera de la línea de estado y los avisos.
- **Don't** dibujar la red con transparencia; se acumula en los corredores compartidos.
- **Don't** añadir sombras a la carcasa.
