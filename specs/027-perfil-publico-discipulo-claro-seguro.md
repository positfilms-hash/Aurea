# Spec 027 — Perfil público de discípulo más claro y seguro

**Nombre:** Mejorar el perfil público de discípulo.

**Estado:** borrador

## Qué hace

Reorganiza `perfil-discipulo.html` para que un maestro entienda quién es el
discípulo y qué quiere aprender, **sin exponer información privada** (historial
con otros maestros, reputación, solicitudes/relaciones de terceros, mensajes,
etc.). No cambia el modelo de datos: usa mejor la información pública existente.

No toca Supabase (tablas, columnas, RLS, triggers, Storage ni migraciones). No
toca `package.json` ni `.env`.

## Contexto real de la página (importante)

`perfil-discipulo.html` **no era** un perfil público suelto: es la pantalla a la
que el **maestro** llega desde `solicitudes.html` con `?id=<discipulo>&sol=<solicitud>`
para **revisar y aceptar/rechazar** una solicitud. Filtraba además datos privados.

Decisión de producto (acordada con el humano): **conservar** el flujo de revisión
de solicitud (carta de motivación + Aceptar/No aceptar) **cuando se llega con
`?sol=`** —es legítimo: esa solicitud va dirigida a ese maestro— y, a la vez,
**limpiar las fugas de privacidad** y presentar un perfil público claro.

## Cambios

- **Se eliminan del perfil** (fugas de privacidad / reputación):
  - Lectura y render de `historial_discipulo` (historial con otros maestros:
    completadas/canceladas, "quién aceptó").
  - La puntuación **"Constancia"** (`constancia_score`) y la barra asociada.
  - El stat **"Prácticas activas"**.
- **Se mantiene** (solo con `?sol=`, para el maestro que recibió la solicitud):
  carta de motivación de esa solicitud + botones Aceptar / No aceptar (y el estado
  "ya aceptaste/rechazaste" / "Entrar al chat" si hay relación con ese maestro).
- **Se reorganiza** el perfil con los campos públicos reales:
  - **Cabecera**: avatar (o inicial), nombre, rol "Discípulo", ubicación (si
    existe), categoría principal de interés (`discipulo_perfiles.categoria`, salvo
    `'Otra'`) e intereses (`hashtags`).
  - **Qué quiere aprender**: `disciplina_buscada` (+ nivel si existe). Si no hay:
    "Este discípulo aún está completando qué quiere aprender."
  - **Disponibilidad** (opcional): `disponibilidad_dias` / `horas_semanales`, solo
    si hay datos.
  - **Sobre mí**: `frase` (solo si existe).
  - Si no hay **ningún** dato público: un único mensaje "Este discípulo aún está
    completando su perfil." (no se muestran bloques ni títulos vacíos).
- **Vista propia**: si el discípulo ve su propio perfil → CTA "Editar mi perfil de
  discípulo" → `perfil-edicion.html` (sin Aceptar/rechazar).
- **Estados**: cargando, **no encontrado** ("No hemos encontrado este discípulo." +
  "Volver"), **error** amable ("No hemos podido cargar este perfil ahora mismo.",
  sin error técnico crudo). Sin `id` → vuelve a `solicitudes.html` (entrada bandeja).

## Tablas (solo lectura, sin cambios)

- Lee `profiles` (nombre, apellido, avatar_url, avatar_color, ubicacion, frase,
  rol) y `discipulo_perfiles` (disciplina_buscada, categoria, nivel,
  disponibilidad_dias, horas_semanales, hashtags).
- `solicitudes` y `relaciones` solo cuando procede (revisión de solicitud / chat
  con ese maestro); RLS limita lo legible.
- **Ya no lee** `historial_discipulo`. No lee mensajes, decisiones, notificaciones.

## Nota sobre `discipulo_perfiles` y anónimos

`discipulo_perfiles` tiene RLS `select using(true)` pero **`anon` no tiene GRANT
SELECT** (solo `authenticated`; por eso `perfil-edicion` funciona). Como la 027 no
puede tocar Supabase, **no se añade** grant: el maestro autenticado (audiencia
real) ve el perfil completo; un visitante anónimo ve una versión **degradada**
(solo campos de `profiles`: nombre, frase, ubicación) sin romperse. Si en el
futuro se quiere perfil público para no autenticados, haría falta una migración
aparte `GRANT SELECT ON discipulo_perfiles TO anon` (fuera del alcance de esta spec).

## Seguridad

Todo el texto de usuario se pinta con `textContent` o `escHtml()`; el avatar usa
`safeColor()`. No se muestran emails, IDs internos, ni lenguaje de
ranking/"rechazado/fallido/no consolidado" en el perfil.

## Responsive

`perfil-discipulo.html` no tenía media query: se añade. En ≤899 px las columnas
se apilan (cabecera arriba, contenido debajo), sin scroll horizontal.

## Checks

- `npm.cmd run build`: OK.
- `git diff --check`: limpio (solo aviso LF→CRLF de Windows).
- No hay script de test configurado.
- Preview (datos reales, vista anónima): perfil degradado correcto sin datos
  privados; estado "no encontrado"; móvil 375 px apilado con 0 overflow; sin
  errores de consola. El flujo de maestro autenticado (`?sol=` + aceptar/rechazar)
  y la vista propia se revisan con sesión iniciada (no testeable en preview anónimo).

## SQL de migración

No aplica.

## Criterios de aceptación

- [x] Existe `specs/027-perfil-publico-discipulo-claro-seguro.md`.
- [x] No se modifica Supabase; no se crean migraciones; no se toca `package.json`/`.env`.
- [x] Cabecera clara con avatar/placeholder, nombre y rol "Discípulo".
- [x] Muestra qué quiere aprender / disponibilidad / sobre mí solo si hay datos.
- [x] No se muestran bloques ni títulos vacíos.
- [x] No se muestran solicitudes/relaciones/decisiones/mensajes/historial/notificaciones de terceros.
- [x] No se muestra email ni IDs internos; nada de reputación/ranking.
- [x] Contenido de usuario renderizado como texto seguro (escHtml/textContent/safeColor).
- [x] El discípulo en su propio perfil puede ir a editar.
- [x] Estados de carga, no encontrado y error amable (sin error técnico crudo).
- [x] UI a 375 / 430 / 768 / 1024 / 1440 px (375 medido; resto cubierto por el sistema 017).
