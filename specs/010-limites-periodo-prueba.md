# Spec 010 — Límites reales del periodo de prueba

**Nombre:** Aplicar límites reales al periodo de prueba: 30 días y 3 sesiones.
**Estado:** en desarrollo
**Autor:** ChatGPT (spec) · Claude (implementación)
**Migración asociada:** `supabase/migrations/011_limites_periodo_prueba.sql`

> **Nota de numeración:** ChatGPT la propuso como "spec 008 / migración 009",
> pero esos números ya estaban usados (specs 008/009 y migraciones 008-010 salieron
> de las rondas de Codex del sobre cerrado). Renumerada a **spec 010 / migración 011**.

---

## Qué hace

Hace operativa la promesa del periodo de prueba: máximo 30 días y hasta 3
sesiones. La base de datos impide crear más de 3 sesiones por relación y crear
sesiones tras vencer el periodo. El frontend muestra días restantes, sesiones
usadas (x/3) y empuja a la decisión de consolidación al terminar.

---

## Decisión técnica: adaptación al esquema existente (aprobada por el humano)

La spec proponía añadir `prueba_inicio_at` / `prueba_fin_at` + backfill + trigger
de fechas. Pero `relaciones` (migración 001) **ya tiene**:

- `iniciada_at` (timestamptz, default now()) → inicio del periodo.
- `dias_prueba_total` (integer, default 30) → duración.

Y `periodo-prueba.html` ya las usaba. Por eso **no se añaden columnas** (evita
duplicar datos y que se desincronicen): el fin se calcula como
`iniciada_at + dias_prueba_total días`. La migración solo añade el **cierre real
en la BD** (lo único que faltaba): un trigger que valida los límites al insertar
en `sesiones_prueba`.

---

## Páginas y archivos que toca

- `supabase/migrations/011_limites_periodo_prueba.sql` — trigger de validación.
- `periodo-prueba.html` — días restantes, sesiones x/3, "periodo vencido".
- `relaciones.html` — distingue "En prueba" vs "Prueba vencida · decidir".

---

## Tablas de Supabase

Añade un trigger `BEFORE INSERT` sobre `sesiones_prueba`
(`validar_limites_sesion_prueba`). **No** añade columnas, **no** hace backfill,
**no** toca datos. Lee `relaciones` (iniciada_at, dias_prueba_total, estado) y
`sesiones_prueba` (conteo). No cambia policies RLS (las existentes ya permiten a
los participantes leer/gestionar sus sesiones y relaciones).

### Reglas que impone la BD (no solo el frontend)
- Máximo 3 filas en `sesiones_prueba` por relación.
- No se insertan sesiones si `now() > iniciada_at + dias_prueba_total días`.
- No se insertan sesiones si la relación no está en estado `prueba`.

El trigger es `SECURITY DEFINER`; las reglas se cumplen aunque alguien intente
insertar por API saltándose el frontend.

---

## Frontend

- **`periodo-prueba.html`:** muestra "Quedan N días" (o "El periodo de prueba ha
  terminado"), el contador "Sesiones del periodo de prueba · x/3", y el badge del
  chat pasa a "Periodo vencido · toca decidir" cuando corresponde. El empuje a la
  consolidación ya lo da el bloque de sobre cerrado (spec 007), que aparece
  igualmente. Cálculo en días (sin precisión horaria).
- **`relaciones.html`:** una relación en `prueba` cuyo fin ya pasó se muestra como
  "⏳ Prueba vencida · decidir" en vez de "En prueba".

> No hay actualmente un flujo de UI para *crear* sesiones de prueba (no existe
> botón ni inserción en el código). Por eso no hay "botón que desactivar": la
> regla de los 3/vencimiento vive en la BD (el trigger), lista para cuando se
> añada ese flujo. La UI sí refleja el cupo usado y el vencimiento.

---

## Riesgos

- Límite solo en frontend → evitado: la regla está en la BD (trigger).
- Hora local del navegador → solo se muestran días (sin precisión horaria); la
  validación dura usa `now()` del servidor en el trigger.
- Bloquear sesiones legítimas → el trigger solo actúa al **insertar** sesiones.
- Tocar `relaciones.estado` sin conocer estados → no se toca estado aquí.
- Datos redundantes → evitados (no se añaden columnas de fecha).

---

## Criterios de aceptación

- [x] Existe `specs/010-limites-periodo-prueba.md`.
- [x] Existe `supabase/migrations/011_limites_periodo_prueba.sql`.
- [x] `relaciones` tiene fecha de inicio de prueba (`iniciada_at`, ya existente).
- [x] El fin de prueba (inicio + 30 días) está definido y enforced (vía trigger).
- [x] Nuevas relaciones reciben inicio y duración automáticamente (defaults ya existentes).
- [x] No se borran datos; no hay backfill destructivo (no aplica).
- [x] La BD impide crear una 4ª sesión de prueba.
- [x] La BD impide crear sesiones tras vencer el periodo.
- [x] `periodo-prueba.html` muestra días restantes.
- [x] `periodo-prueba.html` muestra sesiones usadas sobre 3.
- [x] `relaciones.html` distingue prueba activa / prueba vencida / consolidada.
- [x] La UI empuja a la consolidación al terminar (badge + sobre cerrado).
- [x] No se crean videollamadas, pagos ni mensajes automáticos.
- [x] No se toca `package.json` ni `.env`.
- [ ] **Pendiente (humano):** ejecutar la migración 011 en Supabase Studio.

---

## Revisión de Codex (pre-merge)

- **Bloqueante — carrera en el límite de 3 sesiones:** resuelto. El trigger hace
  `perform 1 from relaciones ... for no key update` antes de contar, serializando
  por relación (mismo patrón que el sobre cerrado). `FOR NO KEY UPDATE` es
  compatible con el `FOR KEY SHARE` del FK.
- **Bloqueante — `programada_at` posterior al fin:** resuelto. Si
  `new.programada_at > iniciada_at + dias_prueba_total`, se rechaza (en insert y
  update), de modo que no se puede programar una sesión fuera del periodo.
- **Recomendado — cubrir UPDATE:** el trigger pasa a `before insert or update`.
  En UPDATE: se valida `programada_at` y el conteo de 3 **excluyendo la propia
  fila** (cubre mover una sesión a otra relación); no se bloquea por `now()`/estado
  para no impedir, p. ej., marcar una sesión como completada tras el periodo.

## Notas / fuera de alcance

- No se implementa calendario ni videollamadas reales: solo el cupo registrado.
- Si en el futuro se añade un flujo para crear sesiones, el botón debe respetar
  (y la BD ya garantiza) los límites de 3/vencimiento.
