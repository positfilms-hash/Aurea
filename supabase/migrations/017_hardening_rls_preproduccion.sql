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
--    una solicitud previa. Se exige que maestro y discípulo sean
--    distintos y que exista una solicitud entre ambos NO rechazada.
--    No se exige 'aceptada' porque el flujo de aceptación (spec 031)
--    inserta la relación antes de marcar la solicitud aceptada, así que
--    en ese momento está en 'nueva'/'vista'. Se excluye 'rechazada'
--    para no permitir crear una relación tras rechazar la solicitud.
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
      where s.maestro_id   = relaciones.maestro_id
        and s.discipulo_id = relaciones.discipulo_id
        and s.estado in ('nueva', 'vista', 'aceptada')
    )
  );


-- ============================================================
-- 5. (BLOQUEANTE) profiles.email es PII y era legible: por `anon` en los
--    perfiles de maestro y por CUALQUIER `authenticated` en todos los
--    perfiles (policy `using(true)` + GRANT de tabla de la 015). La RLS
--    no filtra por columnas; se quita el SELECT de TABLA y se concede
--    SELECT solo de las columnas públicas (todas menos `email`). El email
--    propio se lee de `auth.users` (session.user.email), no de profiles.
--    (Frontend: los dos `select('*')` sobre profiles se cambian a columnas
--    explícitas en el mismo PR para no romper.)
-- ============================================================
revoke select on public.profiles from anon, authenticated;
grant select (
  id, nombre, apellido, avatar_url, avatar_color, bio, frase,
  ubicacion, rol, constancia_score, verified, activo,
  created_at, updated_at
) on public.profiles to anon, authenticated;
