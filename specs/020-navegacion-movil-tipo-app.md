# Spec 020 — Navegación móvil tipo app

**Nombre:** Crear navegación móvil tipo app para Aurea.

**Estado:** borrador

> Nota de numeración: ChatGPT entregó esta spec como "018", pero el 018 ya estaba
> ocupado por el backlog O3b (eliminar columnas `decision_*`, ya mergeado). Se
> renumera a **020** (el 016 quedó como hueco). La spec 019 (cards) menciona "spec
> 018 = barra inferior"; esa referencia se refiere a ESTA spec (la 019 ya dejó el
> `padding-bottom` necesario, así que son compatibles).

## Qué hace

Adapta la navegación móvil para que se sienta como una app: una **barra inferior
fija de tabs** en páginas autenticadas, con la nav superior simplificada en móvil
para que no compitan. No cambia rutas ni backend; reorganiza la navegación con
las páginas existentes.

## Páginas / archivos que toca

- `js/components.js`: `renderMobileTabbar()` nuevo; `renderNavAuth()` lo añade al
  final (toda página autenticada lo hereda); "Mi historia" añadido al dropdown de
  perfil (accesible en móvil, donde se ocultan los enlaces superiores).
- `js/notif.js`: `_updateBadge()` actualiza también el badge de la tabbar
  (`tab-notif-badge`) con el mismo recuento de notificaciones.
- `css/global.css`: estilos de `.mobile-tabbar`, ocultar `.nav-links` en móvil
  cuando hay tabbar, `padding-bottom` del body, `--mobile-tabbar-height`.

No crea páginas. No toca Supabase, `package.json` ni `.env`.

## Comportamiento

### Móvil autenticado
Barra inferior fija con **5 tabs**: Inicio (`discover.html`), Solicitudes,
Relaciones, Mensajes, Perfil (`perfil.html`). Cada item: icono + label corta
(no solo icono), área táctil ≥`--tap` (44px), estado activo en oro,
`env(safe-area-inset-bottom)` respetado, altura 64px + safe-area.

La nav superior se simplifica: se ocultan los enlaces principales
(`.nav-links`) **solo cuando hay tabbar**; quedan logo + campana de
notificaciones + dropdown "Mi perfil" (rol, ver/editar perfil, **Mi historia**,
añadir rol) + Salir. Así no compiten dos navegaciones.

`body:has(.mobile-tabbar)` recibe `padding-bottom` = altura tabbar + safe-area
para que el contenido final no quede tapado.

### Estado activo
Se deriva del mismo `active` que la nav superior:
`discover→Inicio`, `solicitudes→Solicitudes`, `relaciones→Relaciones`,
`mensajes→Mensajes`, `perfil`/`perfil-edicion→Perfil`.
`periodo-prueba` pasa `relaciones` → resalta Relaciones sin ser tab propio.
`historia` no es tab (se llega desde "Mi perfil").

### Badges
El badge de notificaciones (spec 013) sigue en la campana superior
(`nav-notif-badge`) y se **mirror**ea en el tab Mensajes (`tab-notif-badge`) con
el **mismo** recuento (consistente, no contradictorio). No se rompen los badges
existentes.

### Móvil público
Sin tabbar (la genera solo `renderNavAuth`). La nav superior pública
(Inicio / Cómo funciona / Entrar / Registro) se mantiene. No aparece `dona.html`.

### Desktop
Sin cambios: la tabbar está oculta (`display:none`) en ≥900px; manda la nav
superior. La experiencia de escritorio no empeora.

## Decisiones / notas

- **FAB del chat:** en móvil autenticado se oculta (chocaría con el tab Perfil,
  esquina inferior derecha). Sigue disponible en desktop.
- **`:has()`**: se usa para aplicar el padding y ocultar `.nav-links` solo cuando
  hay tabbar. Soportado en navegadores modernos; si faltara, la tabbar igual se
  ve (degradación menor: enlaces superiores visibles y posible solape al final).
- `periodo-prueba` y `mensajes`: el compositor/contenido va en flujo normal y el
  `padding-bottom` del body lo despeja; conviene QA con sesión real.

## SQL de migración

No aplica.

## Criterios de aceptación

- [x] Existe `specs/020-navegacion-movil-tipo-app.md`.
- [x] No se modifica Supabase ni se crean migraciones; no se toca `package.json`/`.env`.
- [x] En móvil autenticado hay navegación inferior fija con ≤5 items.
- [x] Los items tienen labels visibles (no solo iconos) y área táctil suficiente.
- [x] La tabbar respeta safe area y no tapa el contenido (padding del body).
- [x] El item activo se marca; perfil/perfil-edicion→Perfil, relaciones→Relaciones,
  mensajes→Mensajes, solicitudes→Solicitudes.
- [x] `periodo-prueba` no es tab principal; `historia` accesible desde "Mi perfil".
- [x] `dona.html` no aparece en la navegación móvil.
- [x] Móvil público: navegación simple, sin saturar.
- [x] Desktop mantiene la nav superior; no hay dos navegaciones compitiendo en móvil.
- [x] Los badges existentes no se rompen; el badge usa `notificaciones` (spec 013).
- [ ] Revisar en 375/430/768/desktop (QA con preview; páginas autenticadas con sesión real).
