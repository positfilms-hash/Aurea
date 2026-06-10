# 028 — Zona de ajustes de cuenta y edición de perfil

## estado

implementado

## qué hace

Añade un panel "Mi cuenta" en la columna derecha de `perfil.html` con cinco bloques:
- **Perfil público**: barra de completitud calculada desde los datos reales + CTA "Editar perfil" + enlaces condicionales a perfil público de maestro/discípulo.
- **Rol y apariencia**: muestra el rol activo y el tema en uso, leídos de `localStorage`.
- **Cuenta**: email de sesión (de `session.user.email`) + estado "Conectado".
- **Sesión**: enlace a `logout.html`.
- **Zona peligrosa**: enlace a `perfil-edicion.html?tab=cuenta` (que abre directamente la pestaña de eliminación de cuenta).

El contenido de bio, trayectoria y reseñas que ya existía en `col-right` se mantiene intacto debajo del panel, separado por el gap natural del flex container.

## páginas modificadas

- `perfil.html` — añade CSS + estructura HTML (`#ajustes-section` + `#col-right-content`) + función `buildAjustesHTML()` + llamada en `init()`.
- `perfil-edicion.html` — soporte `?tab=` en URL para activar una pestaña al cargar (whitelisted a los 4 tabs válidos).
- `specs/028-zona-ajustes-cuenta-edicion-perfil.md` — este archivo.

## decisiones de implementación

- No se crea `ajustes.html` nueva. `perfil.html` actúa como panel personal.
- No se duplican formularios. Toda la edición sigue en `perfil-edicion.html`.
- Los CTAs "Ver perfil de maestro/discípulo" solo aparecen si existen los datos (`_maestro` / `_discipulo` no nulos).
- "Eliminar cuenta" solo aparece porque spec 023 ya está implementada; el flujo real vive en `perfil-edicion.html?tab=cuenta`.
- No se toca Supabase, migraciones, `package.json` ni `.env`.
- El responsive es heredado de `global.css` (spec 017): en ≤899px `.page` pasa a `display:block` y `col-right` a `height:auto`.

## SQL de migración

No aplica.

## criterios verificados

- [x] Existe `specs/028-zona-ajustes-cuenta-edicion-perfil.md`
- [x] No se modifica Supabase
- [x] No se crean migraciones
- [x] No se toca `package.json`
- [x] No se toca `.env`
- [x] `perfil.html` muestra panel claro de ajustes de cuenta
- [x] `perfil.html` incluye CTA principal "Editar perfil"
- [x] El CTA lleva a `perfil-edicion.html`
- [x] `perfil-edicion.html` sigue siendo accesible directamente
- [x] No se duplican formularios largos
- [x] Se muestran rol activo y tema
- [x] No se rompe regla discípulo → arena ni maestro → dark
- [x] Hay enlace "Ver perfil de maestro/discípulo" condicional
- [x] Hay acción clara de cerrar sesión
- [x] No se muestra cambio de email ni contraseña
- [x] Eliminar cuenta aparece en zona peligrosa (spec 023 implementada)
- [x] No se crean flujos falsos
