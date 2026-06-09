# Spec 026 — Detalle de exploración por categoría

**Nombre:** Crear vista de exploración por categoría.

**Estado:** borrador

## Qué hace

Convierte las categorías de `discover.html` en **puertas de entrada** al
aprendizaje, no solo en filtros técnicos. Cuando hay una categoría activa, la
vista muestra una **cabecera contextual** (nombre, descripción breve, nº de
maestros y CTA para volver a todas), las **subcategorías como chips táctiles** y
las cards filtradas. La selección es **compartible por URL** (query params).

No crea matching, ranking ni swipe. **No toca Supabase** (ni tablas, columnas,
RLS, triggers, Storage o migraciones). No toca `package.json` ni `.env`.

## Páginas / archivos

- `aurea-prototipo/aurea/discover.html`: cabecera contextual de categoría, chips
  de subcategoría, sincronización con la URL y estados vacíos específicos. Se
  construye **sobre** los filtros de la spec 024 y las cards de la 019.
- `aurea-prototipo/aurea/js/categorias.js`: se añade `CAT_DESC` (mapa de
  descripciones breves por categoría, incluida `'Otra'`). Fuente única en
  frontend; no se duplican listas en el HTML.

No se crea página nueva: se resuelve con query params sobre `discover.html`, que
ya es la ruta de exploración. `perfil-maestro.html` no se modifica (las cards ya
enlazan a `perfil-maestro.html?id={id}`).

## Relación con la spec 024

La 024 tenía categoría y subcategoría como dos `<select>` en el lateral. En la
026 la **subcategoría pasa a chips** dentro de la cabecera contextual (solo
visibles cuando hay categoría activa, que es justo cuando aplican). La categoría
sigue en el `<select>` lateral y la búsqueda libre se mantiene igual. El filtrado
en cliente (`ALL → FILTERED → renderPage`) no cambia.

## Categorías y descripciones

- Categorías canónicas: las de `CATS` en `categorias.js` + `'Otra'` (esta última
  sin subcategorías). El `<select>` las lista con "Todas las categorías".
- Descripciones: `CAT_DESC` en `categorias.js` (no existían). Se usan en la
  cabecera. Incluye una entrada para `'Otra'`.

## Cabecera contextual (categoría activa)

- **Nombre** de la categoría.
- **Descripción breve** (`CAT_DESC`).
- **Contador** "N maestro(s) disponible(s)" calculado sobre `ALL` a nivel de
  categoría (respeta la búsqueda libre, ignora la subcategoría para que no
  cambie al refinar con chips). Singular/plural correctos.
- **CTA** "Ver todas las categorías" (`.btn-ghost`) → limpia la categoría.
- **Chips de subcategoría** (`.chip`/`.chip.on` ya existentes): "Todas" + las
  subcategorías de `CATS[categoría]`. `'Otra'` no muestra chips.

Oculta cuando no hay categoría activa (browsing normal de todos los maestros).

## URL y navegación

- Query params: `?categoria=<X>` y `?categoria=<X>&subcategoria=<Y>`.
- Al cargar: se leen y se validan contra `categorias.js`. Categoría inválida → se
  ignora (URL normalizada) y se muestra un aviso breve "No hemos encontrado esa
  categoría." (se oculta solo). Subcategoría inválida (o que no pertenece a la
  categoría) → se ignora.
- Al cambiar filtros: se actualiza la URL con `history.replaceState` (sin
  recargar; no ensucia el historial).
- Al cambiar de categoría se limpia la subcategoría incompatible.

## Estados

- **Cargando / sin maestros (BD vacía) / error**: como en la 024
  ("Cargando maestros…", estado vacío de la 019, "No hemos podido cargar los
  maestros ahora mismo." sin error crudo).
- **Categoría sin maestros**: "Todavía no hay maestros en esta categoría." + CTA
  "Ver todas las categorías".
- **Subcategoría sin resultados**: "No hemos encontrado maestros en esta
  subcategoría." + CTA "Ver toda la categoría" (limpia solo la subcategoría).
- **Solo búsqueda libre sin resultados** (sin categoría): "No hemos encontrado
  maestros con esos filtros." + "Limpiar filtros".

## Responsive (mobile-first)

- **Móvil (≤899)**: filtros en barra compacta arriba; cabecera compacta; chips de
  subcategoría en fila con **scroll horizontal propio** (sin scroll horizontal de
  página); cards una por fila.
- **Desktop**: sidebar 220 px + cabecera amplia + grid de cards (2–3 col).

## SQL de migración

No aplica.

## Checks

- `npm.cmd run build`: OK.
- `git diff --check`: limpio.
- No hay script de test configurado.
- Verificado en preview con datos reales (grant anónimo spec 021): cabecera con
  nombre/descripción/contador/CTA/chips; filtrado por chip; URL sincronizada;
  categoría inválida normalizada + aviso; estados "categoría sin maestros" y
  "subcategoría sin resultados" con sus CTA; 375 px y 1440 px con 0 overflow
  horizontal; sin errores en consola.

## Criterios de aceptación

- [x] Existe `specs/026-detalle-exploracion-categoria.md`.
- [x] No se modifica Supabase; no se crean migraciones; no se toca `package.json`/`.env`.
- [x] El usuario puede seleccionar una categoría; se refleja en la URL; se lee al cargar.
- [x] Categorías validadas contra `categorias.js`; una inválida no rompe la página.
- [x] Cabecera contextual con nombre y descripción breve.
- [x] Subcategorías de la categoría activa como chips; seleccionables; reflejadas en la URL.
- [x] Al cambiar categoría se limpia la subcategoría incompatible; se puede volver a "Todas".
- [x] Se puede volver a todas las categorías.
- [x] Maestros filtrados por categoría y por subcategoría.
- [x] Cards de la spec 019; enlazan a `perfil-maestro.html?id={id}`.
- [x] Estado vacío para categoría sin maestros y para subcategoría sin resultados.
- [x] Estado de error si falla la carga (sin error técnico crudo).
- [x] Sin matching, swipe ni ranking opaco.
- [x] UI a 375 / 430 / 768 / 1024 / 1440 px (375 y 1440 medidos; resto cubierto por el sistema 017).
