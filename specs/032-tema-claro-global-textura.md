# Spec 032 — Tema claro global con textura sutil

**Nombre:** Aplicar tema claro (fondo papel, texto oscuro) en toda la web y eliminar el oscuro.

**Estado:** borrador

## Qué hace

Hace que Aurea use **fondo claro cálido tipo papel y texto oscuro** en toda la web,
de forma consistente, **eliminando por completo el tema oscuro** (era el punto 2 de
la 031, que se separó a esta spec). Añade una **textura de papel muy sutil**. No
toca Supabase, `package.json` ni `.env`.

## Decisión de producto

Se elimina la regla anterior (maestro→oscuro, discípulo→arena). El tema es **único
y claro** para todos. Se aprovecha la paleta clara que ya existía como
`html.theme-arena` (vista discípulo), ahora promovida a base global.

## Implementación (`css/global.css`)

- **`:root`** pasa a la **paleta clara**: `--night #F5EDE0` (crema), texto
  `--text-primary #2A1608`, dorado oscurecido `--gold #7A4F2A`, bordes `#C8A870`,
  verde/rojo en variantes para fondo claro. (Antes el `:root` era oscuro con un
  override `.theme-arena`.)
- Se **elimina el bloque `html.theme-arena`** y sus reglas (`body`, scrollbar): ya
  es redundante. `scale.js`/`aureaSetTema` pueden seguir alternando esa clase, pero
  **ya no tiene efecto visual** (no hay CSS que la apunte) → no hay tema oscuro
  posible. Sin parpadeo: la paleta clara está en `:root`, no depende de JS.
- **Textura:** `body` recibe un `background-image` con ruido SVG inline
  (`feTurbulence`, grayscale, `opacity 0.035`), teselado y casi imperceptible. Sin
  recursos externos, sin dependencias. Solo afecta al fondo de página: las cards e
  inputs tienen su propio fondo y lo tapan.

## Limpieza de literales oscuros (varias páginas)

Quedaban colores oscuros hardcodeados (no usaban variables) que en página clara se
veían como chips/barras oscuras. Convertidos a equivalentes claros manteniendo la
semántica de color:

- Badges de estado verde `#1A2A12` → `#E2EFD3` (verde claro); morado `#1A1830` →
  `#E7E4F5` (morado claro); texto verde `#3B6D11` → `#2A5A08` (más oscuro, contraste).
  Afecta a `historia.html`, `mensajes.html`, `periodo-prueba.html`, y los badges
  globales `.badge-aceptada`/`.badge-prueba`/`.badge-nueva` en `global.css`.
- Cajas de éxito `#1A2A12` → `#E2EFD3` en `contacto.html`, `perfil-maestro.html`,
  `registro.html`.
- `.edit-bar` de `perfil-edicion.html` (`#2A1A08`) → `var(--night-soft)` (clara).

Se **conserva oscuro** a propósito: el scrim translúcido de modales
(`.overlay #1C1410CC`, es un atenuado de fondo, no una superficie de tema) y un
`fill` de icono SVG (oscuro sobre claro = legible).

## Verificación de contraste (preview, ratios WCAG)

- Texto cuerpo / fondo: **14.85** · título de card: **13.23** · texto de card:
  **5.33** · enlace de nav: **6.07** · número de paso (dorado sobre tan): **4.69**.
  Todo ≥ AA.
- Botones dorados (`.btn-primary`): gradiente marrón-dorado + texto crema →
  legible (no es crema sobre crema). `.btn-ghost`: texto marrón sobre crema.
- Páginas comprobadas claras y legibles: index, login, como-funciona, discover
  (cards), privacidad. body `#F5EDE0`, sin clase de tema, textura presente.

## Checks

- `npm.cmd run build`: OK.
- `git diff --check`: limpio.
- No hay script de test configurado.
- Sin errores de consola.

## Riesgos

- Cambia el aspecto de **toda** la web (decisión de producto aprobada). Conviene una
  pasada visual humana, sobre todo en páginas **autenticadas** (mensajes, periodo de
  prueba, historia, perfil, ajustes) que no se ven en preview anónimo: los badges de
  estado y la barra de edición ahora son claros.
- `scale.js`/`aureaSetTema` y el selector de "Tema" en ajustes quedan como código
  inerte (alternan una clase sin efecto). Se pueden limpiar en una spec futura.
- La textura es muy sutil (opacidad 0.035); si se quiere más/menos papel, ajustar
  esa opacidad o el `baseFrequency`.

## SQL de migración

No aplica.

## Criterios de aceptación

- [x] Existe `specs/032-tema-claro-global-textura.md`.
- [x] No se modifica Supabase; no migraciones; no `package.json`/`.env`.
- [x] La web usa fondo claro y letras oscuras de forma consistente.
- [x] No quedan páginas principales en tema oscuro obligatorio; el oscuro se elimina como tema.
- [x] Existe textura sutil tipo papel, de baja opacidad, que no dificulta la lectura.
- [x] Formularios y cards mantienen contraste suficiente (ratios ≥ AA verificados).
- [x] UI revisada en desktop/móvil (públicas medidas; autenticadas pendientes de pasada humana).
