# Spec 034 — Revisión de seguridad preproducción

**Nombre:** Revisión de seguridad preproducción.

**Estado:** borrador

## Qué hace

Auditoría pragmática de preproducción de Aurea: secretos, rutas/guards de Auth, RLS
desde migraciones, exposición de datos privados, XSS (`innerHTML`), datos demo,
errores visibles, `localStorage`, Storage/avatares, `dona.html` y build/config. No es
un pentest profesional ni abre features. No modifica Supabase: los hallazgos que
requieren SQL se **documentan** para una migración/spec separada.

Hallazgos completos en **`specs/_seguridad-preproduccion-hallazgos.md`**.

## Resumen de la auditoría

- **Secretos:** ✅ sin `service_role` ni claves privadas en frontend; `.env` no
  versionado; `.gitignore` cubre `.env*`. Anon key y claves EmailJS son públicas por
  diseño.
- **Auth:** ✅ las 7 páginas autenticadas usan `requireAuth()`.
- **RLS:** las tablas privadas están restringidas a participantes salvo
  **`historial_discipulo` (`using(true)`)** → fuga de historial privado
  (**bloqueante, requiere migración**). Otros: `profiles using(true)` expone columnas
  sensibles; `SECURITY DEFINER` tempranas sin `search_path`; `solicitudes` sin
  `check(discipulo<>maestro)`; INSERT de `relaciones` poco atado. Todos requieren
  migración → documentados, **no** tocados aquí.
- **XSS:** ✅ contenido de usuario escapado con `escHtml()`/`textContent`/`safeColor()`.
- **Privacidad:** ✅ perfiles públicos sin email/IDs; discípulo sin datos privados.
- **`localStorage`:** ✅ solo claves no sensibles (`aurea-rol`, `aurea-tema`,
  `aurea-chat-corner`, `aurea-rol-ts`).
- **`dona.html`:** ✅ no enlazada + `noindex`.

## Correcciones aplicadas en esta spec (sin tocar BD)

- **`perfil.html`:** se neutraliza el **demo estático** (nombre "Rafael Montoya",
  ubicación, stats 4.9/12/3, constancia 82, hashtags y disponibilidad inventados) a
  placeholders ("Cargando…", "—", vacío). El JS ya rellenaba esas secciones al
  cargar; ahora no hay *flash* de datos ficticios (§13.8).
- **`perfil.html`:** el badge **"✦ Verificado por Aurea"**, que estaba siempre visible
  (falso para todos), se oculta por defecto (`display:none`).
- **`perfil-maestro.html`:** el título del modal de solicitud deja de mostrar el
  nombre demo "Rafael Montoya" → "Solicitar al maestro" (el JS pone el nombre real).

## Pendiente para migración/spec separada (NO en 034)

1. **(Bloqueante)** `historial_discipulo`: restringir SELECT a `auth.uid() = discipulo_id`.
2. `profiles`: limitar lectura pública de `constancia_score`/`ubicacion`/`apellido`.
3. `set search_path = public` en las funciones `SECURITY DEFINER` tempranas.
4. `check (discipulo_id <> maestro_id)` en `solicitudes`.
5. Endurecer el INSERT de `relaciones` (ligarlo a una solicitud aceptada).

## Pendiente fuera del repo

- Verificar a mano en Supabase Dashboard las **policies de Storage del bucket
  `avatars`** (que cada usuario solo escriba en su carpeta `{auth.uid()}/…`).

## Checks

- `npm.cmd run build`: OK.
- `git diff --check`: limpio.
- No hay script de test configurado.
- Cambios verificados por build; `perfil.html` sigue rellenando sus secciones por JS
  (verificado en el código: `profile-name`, avatar, `stats-maestro`, `tags-*`,
  `avail-*` se actualizan al cargar).

## SQL de migración

No aplica en esta spec. Los cambios de RLS/constraints van en una migración separada.

## Criterios de aceptación

- [x] Existe `specs/034-revision-seguridad-preproduccion.md` y el informe `_seguridad-preproduccion-hallazgos.md`.
- [x] No se modifica Supabase; no migraciones; no `package.json`/`.env`.
- [x] Revisados secretos: sin `service_role`, `.env` no versionado, `.gitignore` correcto.
- [x] Páginas autenticadas requieren sesión (`requireAuth`).
- [x] Perfiles públicos sin email ni IDs internos; discípulo sin datos privados en UI.
- [x] Revisados `innerHTML`: contenido de usuario escapado.
- [x] Datos demo visibles corregidos (`perfil.html`, `perfil-maestro.html`).
- [x] No se exponen errores técnicos crudos; no se loguean tokens/sesiones.
- [x] `localStorage` sin datos sensibles.
- [x] Revisadas migraciones por RLS permisiva; lo que requiere SQL queda documentado y clasificado.
- [x] Hallazgos clasificados (bloqueante/recomendado/menor) en el informe.
- [x] `npm.cmd run build` y `git diff --check` pasan. No se fingen tests.
