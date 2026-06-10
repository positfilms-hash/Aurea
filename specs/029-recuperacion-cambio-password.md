# Spec 029 — Recuperación de acceso y cambio de contraseña

**Nombre:** Añadir recuperación de contraseña y cambio de contraseña.

**Estado:** borrador

## Qué hace

Permite recuperar el acceso si se olvidó la contraseña (enlace por email) y
cambiar la contraseña desde los ajustes de cuenta estando autenticado. Se apoya
**solo en Supabase Auth**; no crea backend, tablas ni migraciones. El flujo de
recuperación **no revela si un email existe**.

No toca Supabase (tablas/RLS/triggers/Storage/migraciones), `package.json` ni
`.env`.

## Archivos

- **`aurea-prototipo/aurea/recuperar-password.html`** (nuevo): solicitar enlace de
  recuperación.
- **`aurea-prototipo/aurea/actualizar-password.html`** (nuevo): fijar nueva
  contraseña desde el enlace.
- **`aurea-prototipo/aurea/login.html`**: enlace "¿Has olvidado tu contraseña?".
- **`aurea-prototipo/aurea/perfil.html`**: card "Seguridad" en ajustes (spec 028)
  con cambio de contraseña inline (separada de la "Zona peligrosa").
- **`aurea-prototipo/aurea/js/auth.js`**: helpers `enviarRecuperacion(email, redirectTo)`
  y `actualizarPassword(nueva)`.

**`vite.config.js` no se toca:** auto-descubre todos los `.html` de la carpeta
(`readdirSync`), así que las páginas nuevas entran al build solas.

## Flujo técnico (verificado en el proyecto)

- Cliente anon estándar en `supabase.js` con `detectSessionInUrl` por defecto.
- **Recuperar:** `supabase.auth.resetPasswordForEmail(email, { redirectTo })` con
  `redirectTo = ${location.origin}/actualizar-password.html` (funciona en dev y
  prod). No distingue email inexistente → mensaje neutral siempre en éxito; error
  genérico solo en fallo técnico/límite de envíos.
- **Actualizar:** al abrir el enlace, el SDK procesa el token del hash y establece
  una sesión de recuperación (evento de auth). La página espera ese evento /
  sondea `getSession()` ~2s; si hay sesión muestra el formulario, si no (o si el
  hash trae `error`) muestra "enlace inválido o caducado". Al guardar usa
  `supabase.auth.updateUser({ password })` y luego `signOut()` para entrar limpio.
- **Ajustes:** `updateUser({ password })` con la sesión normal; la sesión se
  **mantiene** tras el cambio (se indica en la UI: "Tu sesión sigue activa.").

## Validaciones

- Email: obligatorio, formato básico (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), `trim`.
- Contraseña: obligatoria, mínimo **8 caracteres**, debe coincidir con la
  confirmación. Campos `type="password"` (ocultos por defecto). Sin medidor de
  fuerza. Botones se deshabilitan durante el envío (sin doble submit).

## Seguridad

- No revela si un email existe (mensaje neutral).
- No se imprime ni se loggea ningún token ni enlace (solo `console.warn` genéricos).
- No se guarda nada en `localStorage` manualmente; la sesión la gestiona el SDK.
- No se usa `service_role` ni se toca `.env`.
- El cambio de contraseña exige sesión válida (normal o de recuperación):
  `updateUser` falla sin sesión.
- Errores de Supabase nunca se muestran crudos.

## Configuración manual requerida en Supabase Dashboard (¡importante!)

Para que el enlace del email funcione, hay que **añadir la Redirect URL** en
**Authentication → URL Configuration → Redirect URLs**:

- `https://aureacatena.com/actualizar-password.html` (producción)
- `http://localhost:5173/actualizar-password.html` (desarrollo, opcional)

Y confirmar que el **Site URL** es `https://aureacatena.com`. Sin esto, el enlace
de recuperación puede fallar o redirigir mal. (No se toca `.env` ni claves.)

## Responsive

Páginas nuevas centradas (patrón de `login.html`), `max-width:380px`; revisadas a
375 px sin scroll horizontal. La card de ajustes hereda el sistema 017/028.

## Checks

- `npm.cmd run build`: OK (ambas páginas nuevas se compilan; el aviso de
  `scale.js` "without type=module" es el habitual de todas las páginas, no un error).
- `git diff --check`: limpio (solo aviso LF→CRLF de Windows).
- No hay script de test configurado.
- Preview: login muestra el enlace; recuperar valida email y muestra mensaje
  neutral sin revelar existencia (probado con email `@example.com`);
  actualizar sin token → "enlace inválido" + "Solicitar nuevo enlace"; validaciones
  de longitud/coincidencia OK; móvil 375 px sin overflow; sin errores de consola.
  El formulario de actualizar con token real y la card de ajustes (con sesión) se
  revisan con login / enviando un email real.

## SQL de migración

No aplica.

## Criterios de aceptación

- [x] Existe `specs/029-recuperacion-cambio-password.md`.
- [x] No se modifica Supabase; no se crean migraciones; no se toca `package.json`/`.env`.
- [x] `login.html` incluye acceso claro a recuperación de contraseña.
- [x] Flujo para solicitar enlace; valida email básico; mensaje no revela si el email existe.
- [x] Flujo para fijar nueva contraseña desde enlace válido; mínimo 8 y confirmación que coincide.
- [x] No se muestran errores técnicos crudos; no se loggean tokens ni enlaces.
- [x] Enlace inválido/caducado → mensaje claro + CTA "Solicitar nuevo enlace".
- [x] En ajustes (spec 028) hay bloque "Seguridad" para cambiar contraseña, separado de "Eliminar cuenta".
- [x] El cambio de contraseña requiere sesión válida o flujo de recuperación válido.
- [x] Estado loading durante el envío; se evita doble envío; confirmación tras éxito.
- [x] UI a 375 px verificada; resto cubierto por el sistema 017.
- [x] `npm.cmd run build` y `git diff --check` pasan.
- [x] Configuración manual de Redirect URL en Supabase documentada (ver arriba y riesgos).
