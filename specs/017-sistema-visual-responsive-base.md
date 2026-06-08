# Spec 017 — Sistema visual responsive base

**Nombre:** Crear sistema visual responsive base para Aurea.

**Estado:** borrador

## Qué hace

Define una base común de dimensiones, espaciados, tipografía, contenedores,
tarjetas, botones, formularios, avatares y comportamiento responsive para toda
la web de Aurea, de modo que la interfaz se vea consistente en móvil y escritorio
sin textos solapados, botones desbordados, tarjetas deformadas ni scroll
horizontal accidental.

No rediseña cada página. Establece el sistema base sobre el que después se
construirán navegación móvil tipo app, cards de descubrimiento y mejoras
visuales específicas.

## Páginas que toca

Transversalmente, vía `css/global.css` y `js/scale.js`, todas las páginas de
`aurea-prototipo/aurea/`. No se reescribe el markup de cada página: el grueso es
CSS aditivo que actúa sobre las clases de layout que ya existen
(`.layout`, `.page`, `.sidebar`, `.col-left`, `.col-right`, `.main-content`,
`.footer`, `.nav`, etc.).

## Tablas de Supabase

Ninguna. No toca tablas, columnas, RLS, triggers, Storage ni migraciones.

## Decisión de producto

Aurea debe sentirse como una app humana, táctil y elegante: tarjetas claras,
foco en personas, jerarquía fuerte, acciones evidentes, móvil-first y pocos
elementos compitiendo. Sobria, cálida y profunda; sin tono gamificado.

## Qué se implementa

### Variables base (`:root` en `global.css`)

- Escala de espaciado `--space-1..8` (4 → 64 px).
- Anchos de contenedor `--container-narrow:640`, `--container:960`,
  `--container-wide:1120`.
- Radios `--radius-sm/--radius/--radius-lg` y altura táctil `--tap:44px`.

### Clases reutilizables (aditivas, sin renombrar las existentes)

- Contenedores: `.container`, `.container-narrow`, `.container-wide`, `.prose`
  (ancho de lectura ~68ch).
- Tipografía fluida opcional: `.fluid-h1/.fluid-h2/.fluid-h3/.fluid-lead`
  (`clamp`).
- Botones: `.btn`, `.btn-secondary`, `.btn-danger` nuevos; se conservan
  `.btn-primary` y `.btn-ghost`. Comportamiento común: altura táctil ≥44 px,
  centrado y `max-width:100%` para que no desborden.
- Tarjetas: `.card`, `.card-panel`, `.card-persona`, `.card-action`, `.card-grid`.
- Avatares/imágenes: `.avatar` + `.avatar-sm/md/lg`, `.media-cover`.
- Formularios: `.form`, `.form-actions` (se apilan en móvil).

### Guardas globales contra overflow

- `img/svg/video/canvas { max-width:100%; height:auto }`.
- `overflow-wrap:break-word` en textos; `pre/code` con `pre-wrap`.
- `overflow-x:hidden` en `body` **solo** en la capa móvil (en desktop rompería
  `position:sticky` de las sidebars, porque al fijar `overflow-x` el `overflow-y`
  computa a `auto`).

### Breakpoints y red de seguridad responsive

```text
móvil base: ≤599px   ·   tablet: 600–899px   ·   desktop: 900px+   ·   ancho: 1200px+
```

En `≤899px`:

- `.layout` y `.page` (el "app-shell" de 2 columnas: sidebar fija + `1fr`)
  pasan a `display:block`, apilando sidebar y contenido.
- `.sidebar/.col-left/.col-right/.main-content` dejan de ser sticky/altura de
  viewport y pasan a flujo normal con altura automática; el borde lateral pasa
  a inferior.
- Rejillas internas `.edit-row` y `.stats-grid` → una columna.
- Listas multi-columna (`.list`, `.conv-list`) con `overflow-x:auto` para que
  se desplacen dentro de su contenedor en vez de romper el ancho de página.
- Nav: menos padding y `.nav-links` con scroll horizontal propio (la nav móvil
  tipo app completa es otra spec); dropdowns y modales acotados al viewport.
- Footer a 2 columnas (1 en ≤599).

En `≤599px`: acciones (`.form-actions`, `.empty-state-actions`, `.modal-actions`)
en columna y botones a ancho completo; footer a 1 columna.

### `scale.js`

Se conserva la lógica de zoom para monitores grandes y la de tema. Cambios:

- El zoom se calcula a partir de `screen.width` **pero se reduce** mientras el
  ancho de viewport tras el zoom quede por debajo de 1280 px. Así, en tablet,
  móvil o ventanas estrechas de un monitor grande, `z = 1` y no se producen
  solapes ni scroll horizontal por zoom.
- El zoom y `--real-vh` se recalculan en `resize` (antes solo `--real-vh`).
- La lógica de tema arena/oscuro y `aureaSetTema()` queda intacta.

## Alcance

Incluye: variables base, contenedores, espaciado, tipografía responsive,
botones, tarjetas, formularios, avatares/imágenes, prevención de overflow,
revisión visual básica de páginas prioritarias.

No incluye: navegación inferior móvil tipo app, swipe de cards, rediseño de
exploración, animaciones complejas, sistema de diseño documentado aparte, cambio
de marca, nuevas fuentes, librerías CSS, cambios de backend.

## QA visual

Anchos objetivo: 375, 430, 768, 1024, 1440 px. En cada uno: sin scroll
horizontal accidental, sin textos solapados, botones que caben, formularios
usables, tarjetas con proporción, nav que no tapa contenido, modales/dropdowns
dentro de pantalla, títulos legibles y CTA principal claro.

Las páginas autenticadas (perfil, relaciones, mensajes, etc.) redirigen sin
sesión, por lo que su QA fina queda como seguimiento; la red de seguridad
responsive (colapso de columnas, overflow, nav, modales) las cubre de forma
transversal.

## SQL de migración

No aplica. No se crean migraciones.

## Riesgos

- Colapsar layouts vía `!important` desde `global.css` es necesario porque cada
  página define su grid en un `<style>` propio que carga después de `global.css`.
- `overflow-x:hidden` solo en móvil para no romper `sticky` en desktop.
- No se añaden dependencias ni se renombran clases (los scripts siguen
  funcionando).
- El detalle responsive por página (filas de listas, chat, etc.) puede requerir
  ajustes finos en specs posteriores.

## Criterios de aceptación

- [x] Existe `specs/017-sistema-visual-responsive-base.md`.
- [x] No se modifica Supabase ni se crean migraciones.
- [x] No se toca `package.json` ni `.env`.
- [x] Existe una escala común de espaciados en CSS.
- [x] Existen contenedores reutilizables con anchos máximos coherentes.
- [x] La tipografía principal dispone de tamaños responsive/seguros.
- [x] Los títulos no se salen del viewport en móvil (`overflow-wrap`, fluidos).
- [x] Los textos largos tienen ancho de lectura razonable en desktop (`.prose`).
- [x] Estilos consistentes para botones principales/secundarios.
- [x] Botones con altura táctil ≥44 px en móvil.
- [x] Los botones no se solapan ni desbordan en móvil.
- [x] Estilos consistentes para tarjetas/paneles.
- [x] Las tarjetas no se deforman en móvil.
- [x] Los formularios tienen labels visibles (sistema `.field-*` existente).
- [x] Los formularios son usables en móvil (inputs a ancho completo).
- [x] Los errores de formulario no rompen el layout (spec 015 + `break-word`).
- [x] Imágenes y avatares mantienen proporción (`object-fit`, `max-width`).
- [x] Sin scroll horizontal accidental en 375px y 430px.
- [x] Sin textos solapados en páginas prioritarias.
- [x] La navegación no tapa contenido importante.
- [x] Dropdowns/modales no quedan fuera de pantalla en móvil.
- [x] Tema arena y tema oscuro siguen funcionando; roles aplican su tema.
- [x] `scale.js` no genera zooms o solapes evidentes.
- [x] UI revisada en 375, 430, 768, 1024 y 1440 px (públicas; resto vía red base).
- [x] Resultado visual coherente, táctil y sobrio.
