# Spec 018 — Eliminar columnas sin uso `relaciones.decision_*`

**Nombre:** Limpiar columnas muertas `decision_maestro` / `decision_discipulo`.

**Estado:** borrador

**Origen:** backlog de recomendados de Codex — ítem **O3b**
(`specs/_recomendados-pendientes.md`).

**Migración asociada:** `supabase/migrations/014_eliminar_columnas_decision_relaciones.sql`

## Qué hace

Elimina dos columnas de la tabla `relaciones` que se declararon en el esquema
inicial pero nunca se usaron:

- `relaciones.decision_maestro` (boolean)
- `relaciones.decision_discipulo` (boolean)

## Por qué

La decisión de consolidación ("sobre cerrado") se implementó con tablas propias
—`decisiones_consolidacion` y `resultados_consolidacion`— en las specs 007–009 /
migraciones 008–010. Las columnas `decision_*` de `relaciones` quedaron como
residuo del diseño original y nunca se conectaron a nada.

Verificación previa (hecha antes de escribir la migración):

- Frontend: **0** referencias a `decision_maestro` / `decision_discipulo` en
  `aurea-prototipo/`.
- Migraciones: solo aparecen en su declaración en `001_schema_inicial.sql`; no
  hay triggers, funciones, vistas ni policies RLS que dependan de ellas.

## Cambios

- **Migración 014** (la ejecuta el humano en Supabase Studio): dos
  `ALTER TABLE ... DROP COLUMN IF EXISTS`. Idempotente.
- **`specs/_recomendados-pendientes.md`**: se marca O3b como resuelto; el backlog
  queda sin pendientes.

No toca frontend, `package.json` ni `.env`.

## Riesgos

- `DROP COLUMN` es un cambio de esquema. Aquí es seguro porque las columnas no
  tienen uso ni datos relevantes (no hay usuarios reales todavía y nada las
  escribe/lee). No es destructivo de datos en uso.
- Si en el futuro se quisiera una decisión booleana directa en `relaciones`, se
  añadiría de nuevo con su propia migración; el sobre cerrado seguirá viviendo en
  sus tablas dedicadas.

## Acción manual requerida

Ejecutar `supabase/migrations/014_eliminar_columnas_decision_relaciones.sql` en
Supabase Studio (la hace el humano; Claude no tiene acceso).

## Criterios de aceptación

- [x] Existe `specs/018-eliminar-columnas-decision-relaciones.md`.
- [x] Existe `supabase/migrations/014_eliminar_columnas_decision_relaciones.sql`.
- [x] La migración elimina `decision_maestro` y `decision_discipulo` de
  `relaciones`, de forma idempotente (`IF EXISTS`).
- [x] No se toca frontend, `package.json` ni `.env`.
- [x] El backlog `_recomendados-pendientes.md` queda sin pendientes.
- [ ] El humano ejecuta la migración 014 en Supabase Studio.
