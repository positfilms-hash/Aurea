# Spec 016 — Auditoría responsive de páginas críticas

**Nombre:** Auditar y corregir responsive en páginas críticas.

**Estado:** borrador

> Nota de numeración: ChatGPT entregó esta spec con el criterio "Existe
> specs/020-…", pero 020 ya es la navegación móvil. Se usa el **016** (hueco que
> había quedado libre), por decisión del humano.

## Qué hace

Audita las páginas principales una por una y corrige problemas visuales reales
en móvil/tablet/escritorio. **No crea sistema visual nuevo**: aplica y verifica
lo de las specs 017 (sistema base), 020 (nav móvil) y 019 (cards). Es pulido + QA.

## Viewports de prueba

`360, 375, 430, 768, 1024, 1440 px`.

Metodología: las páginas **públicas** se miden de verdad (preview + iframe a
ancho fijo, comparando `scrollWidth` con el viewport y detectando elementos cuyo
borde derecho supera el ancho). Las **autenticadas** redirigen sin sesión, por lo
que su QA visual requiere sesión (ver "Pendiente").

## Hallazgos y correcciones (esta entrega)

Páginas públicas auditadas a 360–1440px:

- **`index.html`** — la tira de stats (`.stats-strip`, flex con `gap:60px` +
  `padding:40px 80px` sin wrap) y `.divider-quote` (`white-space:nowrap`)
  desbordaban en móvil (scrollW 467 a 360px). **Corregido:** `flex-wrap` en la
  tira + bloque `@media(max-width:599px)` que reduce padding/gap, deja que los
  stats envuelvan (2×2) y permite que el quote haga wrap. Ahora 0 desbordes.
- **`privacidad.html`** — `.content` tenía `padding:56px 160px` fijo → en móvil el
  texto quedaba en una columna de ~40px (inusable, aunque sin scroll horizontal).
  **Corregido:** `padding` con `clamp()` (mantiene el ancho de lectura en desktop
  y reduce los laterales en móvil). `max-width:860px` se conserva.
- **`login.html`, `registro.html`, `contacto.html`, `como-funciona.html`,
  `logout.html`, `dona.html`** — sin desbordes a 360px; correctas.

Todas las correcciones son CSS, reutilizan variables del sistema 017 (`--space-*`)
y no usan `!important` ni valores mágicos nuevos.

## Pendiente — páginas autenticadas

`perfil`, `perfil-edicion`, `perfil-maestro`, `perfil-discipulo`, `solicitudes`,
`relaciones`, `periodo-prueba`, `mensajes`, `historia` redirigen a login sin
sesión, así que **no se pueden cargar en el preview** para QA visual. Puntos de
riesgo ya conocidos (de specs anteriores) a revisar con sesión real:

- `solicitudes`/`relaciones`: filas de lista con grid rígido
  (`4px 44px 1fr 110px 110px 1fr`) — hoy 017 las deja con scroll-x interno; se
  busca que **apilen** en móvil.
- `periodo-prueba`/`mensajes`: que el **input/compositor** no quede tapado por la
  barra inferior (tabbar) ni por el teclado.
- `perfil-edicion`: formulario largo usable; selector categoría/subcategoría.
- `perfil`: que la tabbar no tape la última card; estados vacíos (spec 014).

Estas correcciones se harán cuando se pueda auditar con sesión (credenciales de
prueba) o las verifique el humano.

## SQL de migración

No aplica.

## Criterios de aceptación

- [x] Existe `specs/016-auditoria-responsive-paginas-criticas.md`.
- [x] No se modifica Supabase ni se crean migraciones; no se toca `package.json`/`.env`.
- [x] Páginas **públicas** revisadas en 360/375/430/768/1024/1440 px.
- [x] Sin scroll horizontal accidental en páginas públicas (index y privacidad
  corregidas; resto limpias).
- [x] Textos largos con ancho de lectura razonable en desktop (privacidad).
- [x] Correcciones reutilizan clases/variables comunes; sin librerías; sin
  `!important` injustificado.
- [ ] Páginas **autenticadas** revisadas en los viewports (pendiente: requiere
  sesión de prueba o verificación del humano).
