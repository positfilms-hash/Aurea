# Spec 024 — Filtros básicos para descubrir maestros

**Nombre:** Añadir filtros básicos en el descubrimiento de maestros.

**Estado:** borrador

## Qué hace

Añade filtros reales a `discover.html` (la zona de exploración con las cards de la
spec 019): **categoría**, **subcategoría** (dependiente) y **búsqueda libre**.
El filtrado es en cliente (volumen pequeño). Sin matching, swipe, likes ni
ranking. Reutiliza las cards de la 019 y el sistema visual de la 017.

## Páginas / archivos

- `aurea-prototipo/aurea/discover.html`: se sustituye el panel de filtros **demo
  no funcional** (categorías inventadas, hashtags, sliders de distancia/reputación)
  por filtros funcionales; lógica de filtrado y estado "sin resultados".
- Usa `categorias.js` (`CATS`) para las categorías canónicas.

No toca Supabase, `package.json` ni `.env`.

## Filtros

- **Categoría** — `<select>` con "Todas las categorías" + las 11 categorías
  canónicas de `CATS` + "Otra".
- **Subcategoría** — `<select>` que se rellena con `CATS[categoría]`; **deshabilitado**
  si no hay categoría (o si es "Otra", que no tiene subcategorías). Al cambiar la
  categoría se repuebla y se limpia la subcategoría incompatible.
- **Búsqueda libre** — input que filtra por nombre, disciplina, frase, categoría,
  subcategoría y hashtags del maestro (los datos que ya cargan las cards).
  Placeholder: "Buscar por maestro, oficio, tema o inquietud". Con debounce (180 ms).
- **Limpiar filtros** — botón (`.btn-secondary`) que resetea todo.

El filtrado se hace sobre `ALL` (maestros cargados) → `FILTERED` → `renderPage`.
`mapMaestro` guarda `categoria`/`subcategoria` en crudo (incluida "Otra") para
poder filtrar; la card sigue ocultando "Otra" en su cabecera.

## Estados

- **Cargando**: "Cargando maestros…".
- **Sin maestros** (BD vacía / nada que mostrar): estado vacío de la 019
  ("Todavía no hay maestros disponibles" + CTA según sesión).
- **Sin resultados por filtros** (hay maestros pero los filtros no devuelven
  nada): **nuevo** estado "No hemos encontrado maestros con esos filtros" + CTA
  "Limpiar filtros".
- **Error**: "No hemos podido cargar los maestros ahora mismo." (sin error crudo).

## Responsive

- **Desktop**: filtros en el panel lateral (220 px) + grid de cards a 2–3 col.
- **Móvil**: el panel pasa a **barra compacta arriba** (ya no se oculta como en la
  019): búsqueda a ancho completo + categoría/subcategoría lado a lado + limpiar.
  No satura; las cards siguen siendo protagonistas. Sin scroll horizontal.

## QA (preview, datos reales vía grant anónimo de la spec 021)

- 390 px: filtros poblados (13 categorías), subcategoría deshabilitada sin
  categoría, sidebar visible y compacta, **0 scroll horizontal**. Búsqueda sin
  resultados → estado correcto; categoría "Filosofía" → habilita subcategoría con
  sus opciones reales y filtra; "Limpiar filtros" restaura. 
- 1440 px: sidebar 220 px + grid de 3 columnas, **0 overflow**.

## SQL de migración

No aplica.

## Criterios de aceptación

- [x] Existe `specs/024-filtros-basicos-descubrir-maestros.md`.
- [x] No se modifica Supabase; no se crean migraciones; no se toca `package.json`/`.env`.
- [x] Filtro por categoría con opción "Todas las categorías"; categorías canónicas.
- [x] Filtro por subcategoría dependiente; al cambiar categoría se limpia la incompatible.
- [x] Búsqueda libre por datos visibles/relevantes del maestro.
- [x] Se pueden limpiar los filtros.
- [x] Resultados con las cards de la 019; sin scroll horizontal en móvil; filtros no
  deforman las cards.
- [x] Estados de carga / vacío / sin resultados / error.
- [x] Sin swipe, likes, matching; no se guardan filtros en BD.
- [x] UI revisada en móvil y desktop (390/1440 medidos; resto cubierto por el sistema 017).
