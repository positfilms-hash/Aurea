-- ============================================================
--  AUREA · Migración 012 — Reseñas solo para relaciones consolidadas
--
--  Adaptación de la spec 012 (verificado el esquema real):
--  `resenas` (migración 001) YA tiene:
--    - relacion_id uuid references relaciones(id)  (FK on delete set null)
--    - unique uq_resena_por_relacion (relacion_id, discipulo_id)
--    - maestro_id, discipulo_id, estrellas (1-5), texto, disciplina
--  Por eso NO se añade columna relacion_id ni un índice único redundante.
--  Se añade lo que falta para la regla "solo relaciones consolidadas":
--    - check relacion_id NOT NULL (NOT VALID → solo aplica a filas nuevas)
--    - helper can_insert_resena_consolidada()
--    - trigger de validación a nivel BD
--    - se SUSTITUYEN las policies permisivas existentes por restrictivas
--      (la antigua de INSERT dejaba reseñar sin relación consolidada).
--
--  Depende de la spec 007: usa resultados_consolidacion.resultado = 'consolidada'.
--  No se cambia el FK on delete (set null) ni la unique existente.
--  No se rompe actualizar_reputacion() (sigue leyendo maestro_id/estrellas).
--
--  Pega este archivo en:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1) relacion_id obligatorio para nuevas reseñas (NOT VALID no rompe legacy).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'resenas_relacion_id_required') then
    alter table public.resenas
      add constraint resenas_relacion_id_required check (relacion_id is not null) not valid;
  end if;
end $$;

-- 2) Helper: la reseña corresponde a una relación consolidada entre ese
--    maestro y ese discípulo (consolidada = resultado del sobre cerrado).
create or replace function public.can_insert_resena_consolidada(
  p_relacion_id uuid,
  p_maestro_id uuid,
  p_discipulo_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.relaciones r
    join public.resultados_consolidacion rc on rc.relacion_id = r.id
    where r.id = p_relacion_id
      and r.maestro_id = p_maestro_id
      and r.discipulo_id = p_discipulo_id
      and rc.resultado = 'consolidada'
  );
$$;

-- 3) Defensa a nivel BD (insert y update).
create or replace function public.validar_resena_solo_consolidada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.relacion_id is null then
    raise exception 'La reseña debe estar vinculada a una relación.';
  end if;
  if not public.can_insert_resena_consolidada(new.relacion_id, new.maestro_id, new.discipulo_id) then
    raise exception 'Solo se pueden crear reseñas de relaciones consolidadas.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validar_resena_solo_consolidada on public.resenas;

create trigger trg_validar_resena_solo_consolidada
before insert or update on public.resenas
for each row
execute function public.validar_resena_solo_consolidada();

-- 4) RLS: sustituir las policies permisivas existentes por restrictivas.
alter table public.resenas enable row level security;

-- Antiguas (migración 001): la de INSERT permitía reseñar sin relación consolidada.
drop policy if exists "Reseñas visibles por todos" on public.resenas;
drop policy if exists "Discípulo publica su propia reseña" on public.resenas;
-- Las de esta spec (idempotencia).
drop policy if exists "resenas_select_publicas" on public.resenas;
drop policy if exists "resenas_insert_discipulo_relacion_consolidada" on public.resenas;
drop policy if exists "resenas_update_autor_relacion_consolidada" on public.resenas;
drop policy if exists "resenas_delete_autor" on public.resenas;

-- Las reseñas son públicas (forman parte del perfil del maestro).
create policy "resenas_select_publicas"
on public.resenas
for select
to anon, authenticated
using (true);

-- Solo el discípulo de una relación consolidada puede crear su reseña.
create policy "resenas_insert_discipulo_relacion_consolidada"
on public.resenas
for insert
to authenticated
with check (
  discipulo_id = auth.uid()
  and public.can_insert_resena_consolidada(relacion_id, maestro_id, auth.uid())
);

-- El discípulo puede editar su propia reseña mientras siga consolidada.
create policy "resenas_update_autor_relacion_consolidada"
on public.resenas
for update
to authenticated
using (discipulo_id = auth.uid())
with check (
  discipulo_id = auth.uid()
  and public.can_insert_resena_consolidada(relacion_id, maestro_id, auth.uid())
);

-- El discípulo puede borrar su propia reseña.
create policy "resenas_delete_autor"
on public.resenas
for delete
to authenticated
using (discipulo_id = auth.uid());
