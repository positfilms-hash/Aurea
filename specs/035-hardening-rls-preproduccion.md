# Spec 035 — Hardening RLS preproducción (migración 017)

**Nombre:** Cerrar hallazgos de RLS/Auth de la revisión de seguridad (spec 034).

**Estado:** borrador

## Qué hace

Resuelve, mediante la **migración 017**, los hallazgos de RLS/Auth que la spec 034
documentó y que requerían SQL (no se podían tocar en la auditoría). **Solo SQL**: no
toca frontend, `package.json` ni `.env`. La ejecuta el humano en Supabase Studio.

Ver el informe: `specs/_seguridad-preproduccion-hallazgos.md`.

## Migración `supabase/migrations/017_hardening_rls_preproduccion.sql`

Idempotente (`drop policy if exists` + `create`, `alter function`, guard de
constraint). Cuatro cambios:

1. **(Bloqueante) `historial_discipulo`:** se sustituye la policy de SELECT
   `using (true)` por `using (auth.uid() = discipulo_id)`. El historial privado del
   discípulo (sus relaciones con otros maestros) deja de ser legible por cualquier
   usuario autenticado. **Verificado que ningún punto del frontend lee esa tabla
   entre usuarios**, así que la restricción no rompe nada. La policy `ALL` del dueño
   (insert/update/delete propio) se mantiene.

2. **`handle_new_user()`:** función `SECURITY DEFINER` sin `search_path`. Se fija con
   `alter function ... set search_path = public` (sin reescribir el cuerpo del
   trigger de registro, para no arriesgar el alta de usuarios). Las funciones de
   migraciones 008+ ya lo tenían.

3. **`solicitudes`:** se añade `check (discipulo_id <> maestro_id)` (constraint
   `solicitudes_no_autosolicitud`, con guard de idempotencia). Defensa en BD contra
   auto-solicitud; el frontend ya lo bloquea (spec 031).

4. **`relaciones` (INSERT):** la policy pasaba con solo `auth.uid() = maestro_id`, lo
   que permitía a un maestro fabricar relaciones con cualquier discípulo. Se exige
   además `maestro_id <> discipulo_id` y que **exista una solicitud** entre ambos.
   No se exige `estado = 'aceptada'` porque el flujo de aceptación (spec 031) inserta
   la relación **antes** de marcar la solicitud aceptada.

## Fuera de alcance (documentado, no en 017)

- **`profiles` con `SELECT using(true)`** expone `constancia_score`/`ubicacion`/
  `apellido` de todos. Restringir columnas en Postgres requiere una **vista** o
  **split de tabla** (no hay RLS por columna), y hacerlo mal rompería discover y los
  perfiles públicos. Se deja para una migración dedicada con diseño cuidadoso. Dato
  de baja sensibilidad; no bloqueante para abrir a usuarios.

## Riesgos / verificación manual (¡importante!)

Claude **no tiene acceso remoto**: estos cambios se prueban tras aplicarlos en Studio.

- **Probar el flujo de aceptación de solicitud** tras aplicar 017: un maestro acepta
  una solicitud → debe crearse la relación (la nueva policy de INSERT debe permitirlo
  porque existe la solicitud). Si fallara, revisar la subconsulta de la policy 4.
- El `check` de `solicitudes` **valida las filas existentes**: si hubiera alguna fila
  con `discipulo_id = maestro_id` (no debería, no hay usuarios reales), el `ALTER`
  fallaría. En ese caso, borrar/corregir esa fila antes.
- Migración **inmutable** una vez aplicada (§13.3): si hace falta ajustar, crear una
  nueva idempotente.

## Checks

- No aplica `npm.cmd run build` a la SQL (las migraciones no entran al build). El
  check real es **leer la migración con cuidado**: nombres de tablas/columnas
  (`historial_discipulo.discipulo_id`, `solicitudes.discipulo_id/maestro_id`,
  `relaciones.maestro_id/discipulo_id`), idempotencia, y compatibilidad con el flujo
  existente — revisado.
- `git diff --check`: limpio.
- No hay script de test configurado.

## Criterios de aceptación

- [x] Existe `specs/035-hardening-rls-preproduccion.md` y `supabase/migrations/017_hardening_rls_preproduccion.sql`.
- [x] La migración restringe `historial_discipulo` SELECT al dueño (cierra el bloqueante).
- [x] `handle_new_user` queda con `search_path` fijo.
- [x] `solicitudes` gana el `check (discipulo_id <> maestro_id)`.
- [x] El INSERT de `relaciones` exige solicitud previa y partes distintas.
- [x] No se restringe `profiles` por columnas (documentado como migración futura).
- [x] No se toca frontend, `package.json` ni `.env`.
- [x] La migración es idempotente y respeta nombres reales del esquema.
- [ ] **El humano ejecuta 017 en Supabase Studio y prueba el flujo de aceptar solicitud.**
