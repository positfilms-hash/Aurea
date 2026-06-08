-- ============================================================
-- 014 — Eliminar columnas sin uso de `relaciones` (spec 018 / backlog O3b)
-- ============================================================
-- `relaciones.decision_maestro` y `relaciones.decision_discipulo` (boolean) se
-- declararon en 001_schema_inicial.sql pero NUNCA se llegaron a usar:
--   · No las referencia el frontend (verificado: 0 coincidencias en
--     aurea-prototipo/).
--   · No las referencia ninguna otra migración (solo aparecen en 001).
--   · No hay triggers, funciones, vistas ni policies RLS que dependan de ellas.
-- El flujo de "sobre cerrado" usa las tablas `decisiones_consolidacion` y
-- `resultados_consolidacion` (migraciones 008–010), no estas columnas.
--
-- Por tanto, eliminarlas no destruye datos en uso. Idempotente (IF EXISTS):
-- segura de re-ejecutar.
-- ============================================================

alter table public.relaciones drop column if exists decision_maestro;
alter table public.relaciones drop column if exists decision_discipulo;
