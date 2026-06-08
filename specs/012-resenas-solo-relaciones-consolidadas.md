# Spec 012 — Reseñas solo para relaciones consolidadas

**Nombre:** Permitir reseñas solo en relaciones consolidadas.
**Estado:** en desarrollo
**Autor:** ChatGPT (spec) · Claude (implementación)
**Migración asociada:** `supabase/migrations/012_resenas_solo_relaciones_consolidadas.sql`
**Depende de:** spec 007 (usa `resultados_consolidacion.resultado = 'consolidada'`).

> **Numeración:** la spec es la 012 (la última era 011); la migración es la **012**
> (ChatGPT propuso "010", pero ya está ocupada por afinar-locks).

---

## Qué hace

Restringe las reseñas a relaciones **consolidadas por ambas partes**. Una reseña
solo puede crearla el **discípulo** de una relación cuyo resultado de sobre
cerrado sea `consolidada`. Se prohíben reseñas tras solicitud, durante prueba o
de relaciones no consolidadas. La regla se aplica en **base de datos** (no solo
en UI).

---

## Decisión técnica: adaptación al esquema existente

`resenas` (migración 001) **ya tiene**:
- `relacion_id` (FK a `relaciones`, `on delete set null`)
- `unique uq_resena_por_relacion (relacion_id, discipulo_id)`
- `maestro_id`, `discipulo_id`, `estrellas` (1-5), `texto`, `disciplina`

Por eso la migración **no añade** la columna `relacion_id` ni un índice único
redundante. Añade lo que falta:
- `check (relacion_id is not null)` **NOT VALID** (obliga a vincular nuevas
  reseñas sin romper datos legacy).
- helper `can_insert_resena_consolidada()` (relación + `resultados_consolidacion`).
- trigger `validar_resena_solo_consolidada` (`before insert or update`).
- **Sustituye las policies permisivas existentes** por restrictivas (clave: la
  policy antigua de INSERT, "Discípulo publica su propia reseña", dejaba reseñar
  sin relación consolidada; las policies se suman en OR, así que había que
  eliminarla).

No se cambia el FK (`set null`) ni la unique. No se rompe `actualizar_reputacion()`
(sigue usando `maestro_id`/`estrellas`).

---

## Páginas y archivos que toca

- `supabase/migrations/012_resenas_solo_relaciones_consolidadas.sql`
- `relaciones.html` — CTA "Dejar reseña" + modal (solo discípulo, consolidada).
- `perfil-maestro.html` — **sin cambios**: ya muestra las reseñas públicas.

---

## RLS resultante (`resenas`)

- **SELECT** público (las reseñas forman parte del perfil del maestro).
- **INSERT**: `discipulo_id = auth.uid()` **y** existe relación consolidada entre
  ese discípulo y ese maestro (helper). El maestro no puede auto-reseñarse
  (no es discípulo de su relación).
- **UPDATE**: solo el autor (`discipulo_id = auth.uid()`) y mientras siga
  consolidada.
- **DELETE**: solo el autor.
- El **trigger** repite la validación a nivel BD (defensa aunque una policy fuera
  laxa). La **unique** existente garantiza una reseña por (relación, discípulo).

---

## Flujo de usuario

- **No consolidada / prueba / solicitud:** no aparece CTA de reseña (sin mensajes
  de error; simplemente no corresponde).
- **Consolidada (discípulo):** botón "Dejar reseña" → modal con estrellas (1-5) y
  texto (mín. 80 / máx. 1200) → envía. Si ya reseñó: "✓ Reseñada".
- **Maestro:** ve sus reseñas en el perfil público; no puede crear/editar/borrar.

---

## Validación del formulario

- Puntuación obligatoria (1-5).
- Comentario obligatorio, mín. 80 / máx. 1200 caracteres, con contador.
- Errores amables; nada de errores crudos de Supabase. Duplicado → "Ya has dejado
  una reseña para esta relación".

---

## Riesgos

- Reseñas prematuras / de frustración → bloqueadas (solo consolidada, en BD).
- Reseñar a cualquier maestro → bloqueado (helper exige relación propia consolidada).
- Auto-reseña del maestro → imposible (maestro ≠ discípulo de la relación).
- Romper `actualizar_reputacion()` → no se tocan sus columnas.
- Policy antigua laxa → eliminada en la misma migración.

---

## Criterios de aceptación

- [x] Existe `specs/012-resenas-solo-relaciones-consolidadas.md`.
- [x] Existe `supabase/migrations/012_resenas_solo_relaciones_consolidadas.sql`.
- [x] `resenas` queda vinculada a `relaciones` por `relacion_id` (ya existente).
- [x] La BD impide reseñas sin `relacion_id` (check NOT VALID + policy + trigger).
- [x] La BD impide reseñas de relaciones no consolidadas / en prueba / sin consolidar.
- [x] Solo el discípulo de la relación puede crear la reseña.
- [x] Un discípulo solo puede crear una reseña por relación (unique existente).
- [x] El maestro no puede auto-reseñarse ni editar/borrar reseñas recibidas.
- [x] El discípulo puede editar o borrar su propia reseña (policies).
- [x] Las reseñas públicas siguen mostrándose en `perfil-maestro.html`.
- [x] `relaciones.html` muestra CTA de reseña solo en consolidadas (discípulo).
- [x] No hay CTA en solicitudes pendientes, prueba ni no consolidadas.
- [x] La reputación se sigue recalculando con el trigger existente.
- [x] No se crean tablas nuevas ni notificaciones.
- [x] No se toca `package.json` ni `.env`.
- [ ] **Pendiente (humano):** ejecutar la migración 012 en Supabase Studio.

---

## Notas / fuera de alcance

- El FK `resenas.relacion_id` se mantiene `on delete set null` (no se cambia a
  cascade): las relaciones no se borran en la práctica.
- No se implementan reseñas del maestro al discípulo, ni respuestas, ni moderación
  automática, ni notificaciones (fuera de alcance).
