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
  - Recomendación: restringir la policy a `using (auth.uid() = discipulo_id)`. Quitar
    la policy `using(true)`.
  - Estado: **✅ resuelto en migración 017 (spec 035)**.

- **`profiles.email` legible — PII** (columna `email` en `001_schema_inicial.sql:34`;
  grants en `015_grant_anon_discover.sql`).
  - Riesgo: `profiles` contiene `email` y su SELECT estaba abierto: **cualquier usuario
    `authenticated` podía leer el email de TODOS** los perfiles, y `anon` el de los
    maestros (RLS `using(true)`/maestros + GRANT de tabla). Exposición de PII /
    enumeración de emails. (Corrige la afirmación previa "perfiles públicos sin email":
    era cierto en la **UI**, pero la **RLS** lo exponía vía query directa.)
  - Recomendación: RLS no filtra por columnas → quitar el SELECT de **tabla** y conceder
    solo las columnas públicas (todas menos `email`); el email propio se lee de
    `auth.users`. Requiere migración + ajustar 2 `select('*')` del frontend.
  - Estado: **✅ resuelto en migración 017 (spec 035)** (revoke/grant de columnas +
    `select('*')` de `perfil.html`/`index.html` a columnas explícitas).

## Recomendados

- **Otras columnas de `profiles`** (`constancia_score`, `ubicacion`, `apellido`) siguen
  legibles por usuarios tras ocultar el email.
  - Riesgo: datos **semipúblicos** del perfil (`ubicacion`/`apellido` se muestran en
    perfiles públicos por diseño; `constancia_score` del discípulo se oculta en UI pero
    no en BD). Menor sensibilidad que el email.
  - Recomendación: si se quiere ocultar la constancia, mover esa columna o usar una
    vista. Requiere migración dedicada.
  - Estado: **pendiente — migración futura** (no incluido en 017).

- **`discipulo_perfiles` con `SELECT using (true)`** (`004_discipulo_perfiles_y_trigger.sql:42`;
  columnas en `:15`).
  - Riesgo: `disciplina_buscada`, `nivel`, `disponibilidad`, `hashtags` legibles. Es el
    **perfil público del discípulo** (spec 027) → **público por diseño**; además `anon`
    **no** tiene grant sobre esta tabla (solo `authenticated`), así que la exposición es
    entre usuarios logueados, coherente con un perfil público. No incluye email ni datos
    privados de relaciones/mensajes.
  - Recomendación: ninguna, salvo que se decida ocultar algún campo concreto → entonces
    migración.
  - Estado: **aceptado — público por diseño** (documentado, hallazgo de Codex).

- **Funciones `SECURITY DEFINER` sin `set search_path`** (`handle_new_user` en
  `001/002/006`, trigger de `004`).
  - Riesgo: posible inyección por `search_path` en funciones con privilegios.
  - Recomendación: `alter function ... set search_path = public`. (Las funciones de
    008+ ya lo hacen.)
  - Estado: **✅ resuelto en migración 017 (spec 035)** (`alter function handle_new_user`).

- **`solicitudes` sin `check (discipulo_id <> maestro_id)`** (`001`).
  - Riesgo: la BD permite crear una solicitud hacia uno mismo. El frontend ya lo
    bloquea (spec 031), pero no hay defensa en BD.
  - Recomendación: añadir el `check` constraint.
  - Estado: **✅ resuelto en migración 017 (spec 035)**.

- **`relaciones` INSERT solo exige `auth.uid() = maestro_id`** (`003`).
  - Riesgo: un maestro autenticado podría insertar relaciones arbitrarias (con
    cualquier `discipulo_id`) sin una solicitud previa. El frontend solo lo hace al
    aceptar una solicitud válida, pero la RLS no lo garantiza.
  - Recomendación: atar el INSERT a una solicitud entre las partes y no rechazada.
  - Estado: **✅ resuelto en migración 017 (spec 035)** — `with check` exige solicitud
    con `estado in ('nueva','vista','aceptada')` y `maestro_id <> discipulo_id`.

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

## Resuelto por SQL en la migración 017 (spec 035)

Los hallazgos de BD de la 034 que requerían SQL se resolvieron en una migración
separada (`017_hardening_rls_preproduccion.sql`, spec 035), **no en la 034**:

1. **(Bloqueante)** `historial_discipulo` SELECT → restringido al dueño.
2. **(Bloqueante)** `profiles.email` (PII) → ocultado (revoke SELECT de tabla + grant
   de columnas públicas; frontend a columnas explícitas).
3. `handle_new_user` → `search_path` fijado.
4. `check (discipulo_id <> maestro_id)` en `solicitudes`.
5. INSERT de `relaciones` → atado a solicitud entre las partes y no rechazada.

**Pendiente para migración futura (no en 017):** ocultar `constancia_score` (y, si se
decide, `ubicacion`/`apellido`) de `profiles` para otros usuarios — necesita vista o
split de tabla.

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
- **Privacidad por página (UI):** los perfiles públicos no muestran email ni IDs
  internos **en la interfaz**; `perfil-discipulo` no muestra historial/solicitudes/
  mensajes (spec 027); `perfil-maestro` no permite auto-solicitud en UI (spec 031).
  (Ojo: la exposición de `email` a nivel **RLS/query directa** sí existía → bloqueante
  arriba, cerrada en la migración 017.)
- **`dona.html`:** sin enlaces desde nav/footer/components y con `noindex`.
- **Errores:** las páginas con datos remotos distinguen cargando/vacío/error y no
  muestran SQL crudo, stack traces ni términos técnicos al usuario.
- **NSFWJS:** sigue activo en la subida de avatar (`perfil-edicion`).

## Pendiente de verificar fuera del repo (Supabase Dashboard)

- **Storage `avatars`:** las policies de Storage se definen en el Dashboard, no en
  migraciones del repo. Recomendado verificar a mano que un usuario solo puede
  escribir en su carpeta `{auth.uid()}/…` y no sobrescribir avatares ajenos.
