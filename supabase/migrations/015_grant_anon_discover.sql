-- ============================================================
-- 015 — Discover público para anónimos (spec 021)
-- ============================================================
-- Las policies SELECT de profiles/maestro_perfiles/trayectoria/resenas ya eran
-- `using (true)` (lectura pública intencionada), pero al rol `anon` le faltaba
-- el GRANT de tabla → "permission denied" al explorar sin sesión. El array DEMO
-- (retirado en spec 019) enmascaraba esto cayendo a datos ficticios.
--
-- Aquí se completa el acceso de LECTURA pública para descubrimiento,
-- PRESERVANDO la privacidad de los perfiles de discípulo: un anónimo solo puede
-- leer perfiles que pertenecen a un maestro.
--
-- Nota: un GRANT solo expone datos donde la RLS lo permite. `relaciones` tiene
-- RLS restrictiva (solo participantes) → el anónimo obtiene 0 filas (sin error),
-- lo que evita que el contador de discípulos rompa `perfil-maestro` sin filtrar
-- datos privados.
--
-- Idempotente: drop policy if exists + grants re-ejecutables.
-- ============================================================

-- 1) profiles: separar lectura anon (solo maestros) de authenticated (todo).
drop policy if exists "Perfiles visibles por todos"          on public.profiles;
drop policy if exists "Perfiles legibles por autenticados"   on public.profiles;
drop policy if exists "Perfiles de maestro legibles por anon" on public.profiles;

create policy "Perfiles legibles por autenticados"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Perfiles de maestro legibles por anon"
  on public.profiles for select
  to anon
  using (exists (select 1 from public.maestro_perfiles m where m.id = profiles.id));

-- 2) GRANT SELECT al rol anon en las tablas de descubrimiento público.
--    La RLS existente sigue filtrando filas (relaciones → 0 filas para anon).
grant select on public.profiles         to anon;
grant select on public.maestro_perfiles  to anon;
grant select on public.trayectoria       to anon;
grant select on public.resenas           to anon;
grant select on public.relaciones        to anon;
