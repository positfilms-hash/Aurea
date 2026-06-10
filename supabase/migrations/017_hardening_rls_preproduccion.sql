-- ============================================================
--  AUREA · Migración 017 — Hardening RLS preproducción
--
--  Cierra hallazgos de seguridad de la spec 034 (informe
--  specs/_seguridad-preproduccion-hallazgos.md). Idempotente.
--
--  Pega este SQL en:
--  Supabase Dashboard → SQL Editor → New query → Run
--
--  NOTA: no incluye la restricción de columnas sensibles de
--  `profiles` (constancia_score/ubicacion) — requiere una vista o
--  split de tabla y se aborda en una migración aparte para no
--  romper lecturas legítimas (perfiles públicos, discover).
-- ============================================================


-- ============================================================
-- 1. (BLOQUEANTE) historial_discipulo: dejaba SELECT `using (true)`,
--    exponiendo el historial privado del discípulo (relaciones con
--    otros maestros) a cualquier usuario autenticado. Lo restringimos
--    a su dueño. (Ningún punto del frontend lo lee entre usuarios.)
-- ============================================================
drop policy if exists "Historial visible por todos" on public.historial_discipulo;

drop policy if exists "Historial visible por su dueño" on public.historial_discipulo;
create policy "Historial visible por su dueño"
  on public.historial_discipulo for select
  using (auth.uid() = discipulo_id);
-- (La policy ALL "Usuario gestiona su propio historial" del 001 sigue
--  vigente para insert/update/delete del propio dueño.)


-- ============================================================
-- 2. handle_new_user() es SECURITY DEFINER pero no fijaba
--    search_path (riesgo de inyección por search_path). Se fija sin
--    reescribir el cuerpo. Las funciones de 008+ ya lo tienen.
-- ============================================================
alter function public.handle_new_user() set search_path = public;


-- ============================================================
-- 3. solicitudes: la BD permitía crear una solicitud hacia uno mismo
--    (no había constraint). El frontend ya lo bloquea (spec 031); aquí
--    se añade la defensa en BD. Si existiera alguna fila con
--    discipulo_id = maestro_id, este ALTER fallará (no debería haber).
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'solicitudes_no_autosolicitud'
      and conrelid = 'public.solicitudes'::regclass
  ) then
    alter table public.solicitudes
      add constraint solicitudes_no_autosolicitud
      check (discipulo_id <> maestro_id);
  end if;
end $$;


-- ============================================================
-- 4. relaciones: el INSERT solo exigía auth.uid() = maestro_id, así que
--    un maestro podía fabricar relaciones con cualquier discípulo sin
--    una solicitud previa. Se exige que exista una solicitud entre
--    ambos (no que esté 'aceptada': el flujo de aceptación inserta la
--    relación antes de marcar la solicitud aceptada — spec 031) y que
--    maestro y discípulo sean distintos.
-- ============================================================
drop policy if exists "Maestro puede crear relaciones" on public.relaciones;
drop policy if exists "Maestro crea relacion con solicitud previa" on public.relaciones;
create policy "Maestro crea relacion con solicitud previa"
  on public.relaciones for insert
  with check (
    auth.uid() = maestro_id
    and maestro_id <> discipulo_id
    and exists (
      select 1 from public.solicitudes s
      where s.maestro_id  = relaciones.maestro_id
        and s.discipulo_id = relaciones.discipulo_id
    )
  );
