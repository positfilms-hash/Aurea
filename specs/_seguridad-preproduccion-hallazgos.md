# Hallazgos de seguridad preproducción (spec 034)

Revisión pragmática de preproducción. Cada hallazgo: zona · riesgo · recomendación ·
estado. Los que requieren tocar Supabase **no** se corrigen aquí (regla de la 034):
se documentan para una migración/spec separada.

## Bloqueantes

- **`historial_discipulo` con `SELECT using (true)`** (`001_schema_inicial.sql:441`).
  - Riesgo: el historial privado de un discípulo (sus relaciones con **otros**
    maestros: disciplina, duración, estado completada/cancelada, nombre del maestro)
    es **legible por cualquier usuario autenticado** mediante query directa. La spec
    027 lo retiró de la UI por privado, pero la RLS lo expone igualmente.
  - Recomendación: restringir la policy a `using (auth.uid() = discipulo_id)` (y, si
    aplica, a los maestros con relación activa). Quitar la policy `using(true)`.
  - Estado: **pendiente — requiere migración** (ver sección final). No se toca en 034.

## Recomendados

- **`profiles` con `SELECT using (true)`** (`001:323`) + grant anon (spec 021).
  - Riesgo: `constancia_score`, `ubicacion` y `apellido` de **todos** los usuarios
    (incluidos discípulos) son legibles por cualquiera. La spec 027 oculta la
    constancia del discípulo en UI, pero el dato es accesible por query.
  - Recomendación: exponer solo columnas públicas (vista/política por columnas) o
    separar datos sensibles. Requiere migración.
  - Estado: **pendiente — requiere migración**.

- **Funciones `SECURITY DEFINER` sin `set search_path`** (`handle_new_user` en
  `001/002/006`, trigger de `004`).
  - Riesgo: posible inyección por `search_path` en funciones con privilegios.
  - Recomendación: `create or replace ... language plpgsql security definer set
    search_path = public`. (Las funciones de 008+ ya lo hacen.)
  - Estado: **pendiente — requiere migración**.

- **`solicitudes` sin `check (discipulo_id <> maestro_id)`** (`001`).
  - Riesgo: la BD permite crear una solicitud hacia uno mismo. El frontend ya lo
    bloquea (spec 031), pero no hay defensa en BD.
  - Recomendación: añadir el `check` constraint. Requiere migración.
  - Estado: **pendiente — requiere migración**.

- **`relaciones` INSERT solo exige `auth.uid() = maestro_id`** (`003`).
  - Riesgo: un maestro autenticado podría insertar relaciones arbitrarias (con
    cualquier `discipulo_id`) sin una solicitud aceptada previa. El frontend solo lo
    hace al aceptar una solicitud válida, pero la RLS no lo garantiza.
  - Recomendación: atar el INSERT a una solicitud aceptada (trigger/`with check` más
    estricto). Requiere migración.
  - Estado: **pendiente — requiere migración**.

- **Datos demo estáticos en `perfil.html`** (nombre "Rafael Montoya", ubicación
  "Madrid…", stats 4.9/12/3, constancia 82, hashtags y disponibilidad inventados).
  - Riesgo: *flash* de datos ficticios como reales antes de que el JS los rellene
    (§13.8). El JS sí rellena todas esas secciones al cargar.
  - Estado: **✅ corregido en 034** — neutralizados a placeholders ("Cargando…", "—",
    vacío). El JS sigue rellenándolos.

- **Badge "✦ Verificado por Aurea" estático y siempre visible en `perfil.html`.**
  - Riesgo: afirmaba verificación para **todos** los usuarios (falso); ningún JS lo
    gateaba.
  - Estado: **✅ corregido en 034** — ocultado por defecto (`display:none`).
    Recomendación futura: si la verificación es real, gatear por `profiles.verified`.

## Menores

- **`perfil-maestro.html` modal con nombre demo "Rafael Montoya"** (título estático
  antes de que el JS ponga el nombre real).
  - Estado: **✅ corregido en 034** → "Solicitar al maestro".

- **`contacto.html`: `console.error('EmailJS error:', err)`** loguea el objeto de
  error de EmailJS. No contiene tokens ni datos personales sensibles (status/text),
  por lo que es **aceptable** como log de depuración. Revisado, sin cambio.

- **`localStorage`**: claves usadas `aurea-rol`, `aurea-tema`, `aurea-chat-corner`,
  `aurea-rol-ts` (timestamp de caché de rol). Todas no sensibles. Sin tokens,
  mensajes ni datos privados. OK.

## Requieren spec/migración separada

Resumen de lo que NO se toca en 034 y necesita SQL (proponer una mini-spec con
migración numerada, idempotente, revisada a mano):

1. **(Bloqueante)** Restringir `historial_discipulo` SELECT a su dueño.
2. Restringir lectura pública de columnas sensibles de `profiles`.
3. Añadir `set search_path = public` a las funciones `SECURITY DEFINER` tempranas.
4. `check (discipulo_id <> maestro_id)` en `solicitudes`.
5. Endurecer el INSERT de `relaciones` (ligarlo a solicitud aceptada).

## Revisado y correcto (sin hallazgos)

- **Secretos:** sin `service_role` ni claves privadas en frontend; `.env` no
  versionado; `.gitignore` cubre `.env*`; solo `VITE_SUPABASE_URL`/`ANON_KEY` (anon
  key pública, correcto) y claves **públicas** de EmailJS (por diseño, §17).
- **Auth:** las 7 páginas autenticadas (`perfil`, `perfil-edicion`, `solicitudes`,
  `relaciones`, `periodo-prueba`, `mensajes`, `historia`) usan `requireAuth()`.
- **RLS de tablas privadas** (excepto historial): `solicitudes`, `relaciones`,
  `sesiones_prueba`, `mensajes`, `decisiones_consolidacion`, `resultados_consolidacion`,
  `notificaciones` restringidas a participantes/propietario (`auth.uid() = ...`).
- **XSS:** el contenido de usuario (nombres, frase, bio, mensajes, reseñas,
  solicitudes, hashtags) se renderiza con `escHtml()`/`textContent` y los colores con
  `safeColor()`. Revisados `mensajes`, perfiles, `discover`, `historia`.
- **Privacidad por página:** perfiles públicos no muestran email ni IDs internos;
  `perfil-discipulo` no muestra historial/solicitudes/mensajes (spec 027);
  `perfil-maestro` no permite auto-solicitud en UI (spec 031).
- **`dona.html`:** sin enlaces desde nav/footer/components y con `noindex`.
- **Errores:** las páginas con datos remotos distinguen cargando/vacío/error y no
  muestran SQL crudo, stack traces ni términos técnicos al usuario.
- **NSFWJS:** sigue activo en la subida de avatar (`perfil-edicion`).

## Pendiente de verificar fuera del repo (Supabase Dashboard)

- **Storage `avatars`:** las policies de Storage se definen en el Dashboard, no en
  migraciones del repo. Recomendado verificar a mano que un usuario solo puede
  escribir en su carpeta `{auth.uid()}/…` y no sobrescribir avatares ajenos.
