# Spec 019 — Cards de descubrimiento de maestros

**Nombre:** Crear cards de descubrimiento de maestros.

**Estado:** borrador

## Qué hace

Rediseña la presentación de maestros en `discover.html` mediante cards visuales,
claras y responsive, usando datos existentes. Inspiración tipo Tinder en
tarjetas grandes, foco en la persona y jerarquía fuerte, pero **sin swipe, sin
likes/descartes, sin matching ni ranking opaco** y sin lenguaje de cursos.

No cambia backend ni crea matching. Solo lee datos ya disponibles.

## Páginas / archivos que toca

- `aurea-prototipo/aurea/discover.html` (la página de exploración): nuevas cards,
  estados (carga/vacío/error), CTAs y CSS de card alineado a la spec 017.

No crea páginas nuevas. No toca `components.js`, `categorias.js`, `package.json`
ni `.env`.

## Tablas de Supabase (solo lectura)

- `maestro_perfiles` (`id, disciplina, categoria, subcategoria, hashtags,
  acepta_solicitudes, reputacion`)
- `profiles` (vía join: `nombre, apellido, avatar_color, avatar_url, frase`)

No modifica tablas, columnas, RLS, triggers, Storage ni migraciones.

## Estructura de la card

Cuando el dato existe, la card muestra: avatar (imagen o placeholder con
iniciales), nombre, categoría › subcategoría, disciplina, frase breve (3 líneas
máx., `-webkit-line-clamp`), hasta 3 hashtags, reputación (★) y señal de
disponibilidad (acepta solicitudes / lista de espera).

Jerarquía: avatar → nombre → categoría → disciplina/frase → señales → acción.
Los hashtags no dominan sobre la presentación humana.

CTAs:
- **Ver perfil** (primario) → `perfil-maestro.html?id={id}`.
- **Solicitar aprendizaje** (secundario, opcional): solo si el usuario está
  autenticado y su rol es `discipulo` o `ambos` (`_puedeSolicitar`). También
  lleva al perfil del maestro (donde está el flujo real de solicitud).

Toda la card es clickable → mismo destino. Los botones internos hacen
`event.stopPropagation()` para no duplicar navegación.

## Contenido y seguridad

- Todo el contenido de usuario se renderiza escapado (`escHtml`), y el color del
  avatar pasa por `safeColor()` (specs 015). No se renderiza HTML de usuario.
- No se muestran cards sin nombre visible (`mapMaestro` devuelve `null`).
- Si falta avatar → placeholder con iniciales. Si falta frase → no se muestra el
  bloque (no se inventa). Si falta o es `Otra` la categoría → no se muestra el
  bloque de categoría (sin bloque roto).
- No se muestran historial privado, relaciones no consolidadas, métricas
  sensibles ni contacto privado.

## Responsive (sobre el sistema de la spec 017)

- Móvil (≤599): 1 card por fila, ancho completo; el panel de filtros (no
  funcional) se oculta para que las cards sean protagonistas; sin scroll
  horizontal.
- Tablet (600–899): 2 cards por fila (el layout de 2 columnas colapsa por 017).
- Desktop: 2 cards (≥900) y 3 cards (≥1280) por fila, dentro del sistema visual.
- Las cards no se deforman; los botones tienen altura táctil (`--tap`) y no se
  salen de la card. Padding inferior amplio para que la última card no quede
  tapada por el botón flotante del chat.

## Estados

- **Carga:** "Cargando maestros…".
- **Vacío** (distinto de error): `renderEmptyState` con "Todavía no hay maestros
  disponibles" + CTA "Completar perfil" (`perfil-edicion.html`) si hay sesión, o
  "Crear cuenta" (`registro.html`) si no.
- **Error:** "No hemos podido cargar los maestros ahora mismo." (sin volcar el
  error técnico de Supabase; se loguea en consola). El error **no** se confunde
  con ausencia de maestros.

Se elimina el array `DEMO` de maestros ficticios (lección 9 de CLAUDE.md: nada de
datos demo en producción).

## Orden

Se mantiene el orden existente: por `reputacion` descendente (`nullsFirst:false`).
No se inventa ranking nuevo. Se conserva la paginación real (12 por página; sin
controles si hay una sola página).

## Fuera de alcance

Swipe, likes/descartes, matching, algoritmo de recomendación, overlays
complejos. Los filtros del lateral siguen siendo no funcionales (preexistentes);
arreglarlos no entra en esta spec (se ocultan en móvil por claridad).

## SQL de migración

No aplica.

## Criterios de aceptación

- [x] Existe `specs/019-cards-descubrimiento-maestros.md`.
- [x] No se modifica Supabase ni se crean migraciones.
- [x] No se toca `package.json` ni `.env`.
- [x] Card visual clara para maestros.
- [x] Muestra nombre si existe; avatar o placeholder consistente.
- [x] Muestra categoría si existe; subcategorías/hashtags si existen.
- [x] Muestra frase/descripción si existe; reputación si existe.
- [x] No muestra bloques vacíos; no renderiza HTML de usuario.
- [x] Enlaza a `perfil-maestro.html?id={id}`.
- [x] Móvil: 1 card por fila; sin scroll horizontal.
- [x] Desktop: grid legible (2–3 por fila); las cards no se deforman.
- [x] Los textos no se solapan; los botones no se salen de la card.
- [x] La última card no queda tapada por el FAB del chat (padding inferior).
- [x] Estados de carga, vacío y error.
- [x] CTA "Solicitar aprendizaje" solo para discípulo/ambos autenticado.
- [x] Sin swipe, sin matching, sin likes/descartes.
- [x] Sin lenguaje de cursos ni clases sueltas.
- [ ] UI revisada en 375/430/768/1024/1440 px (QA con preview).
