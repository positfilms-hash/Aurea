-- ============================================================
--  AUREA · Migración 003
--  Añade política RLS de INSERT para la tabla relaciones.
--  Sin ella, el maestro no puede crear relaciones al aceptar solicitudes.
--
--  Pega este SQL en:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

create policy "Maestro puede crear relaciones"
  on public.relaciones for insert
  with check (auth.uid() = maestro_id);
