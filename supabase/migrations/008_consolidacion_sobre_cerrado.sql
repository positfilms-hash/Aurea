-- ============================================================
--  AUREA · Migración 008 — Consolidación con sobre cerrado
--
--  Decisión privada de cada parte al final del periodo de prueba.
--  La decisión de cada uno permanece oculta (RLS) hasta que ambos
--  han decidido; entonces se calcula el resultado y se sincroniza
--  relaciones.estado.
--
--  Esquema verificado:
--    relaciones(id, maestro_id, discipulo_id, estado, consolidada_at,
--               finalizada_at, ...) con maestro_id/discipulo_id = profiles.id = auth.uid()
--    estados válidos existentes: prueba, consolidada, pausada, finalizada, cancelada
--
--  Adaptación respecto a la spec 007 (aprobada por el humano):
--    - El trigger TAMBIÉN sincroniza relaciones.estado
--      (consolidada / finalizada) para que el resto de la web
--      (relaciones.html, notif.js) refleje la consolidación. Se usan
--      estados ya existentes; no se añade ningún estado nuevo.
--
--  Pega este archivo en:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Helper para comprobar participación en una relación.
create or replace function public.is_participante_relacion(
  p_relacion_id uuid,
  p_user_id uuid
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
    where r.id = p_relacion_id
      and (r.maestro_id = p_user_id or r.discipulo_id = p_user_id)
  );
$$;

-- Decisiones privadas de cada parte.
create table if not exists public.decisiones_consolidacion (
  id uuid primary key default gen_random_uuid(),
  relacion_id uuid not null references public.relaciones(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  decision text not null check (decision in ('consolidar', 'no_consolidar')),
  created_at timestamptz not null default now(),
  constraint decisiones_consolidacion_unica_por_usuario unique (relacion_id, user_id)
);

-- Resultado final revelado cuando ambas partes han decidido.
create table if not exists public.resultados_consolidacion (
  relacion_id uuid primary key references public.relaciones(id) on delete cascade,
  resultado text not null check (resultado in ('consolidada', 'no_consolidada')),
  decided_at timestamptz not null default now()
);

alter table public.decisiones_consolidacion enable row level security;
alter table public.resultados_consolidacion enable row level security;

-- Limpieza defensiva de policies.
drop policy if exists "decisiones_consolidacion_insert_participante" on public.decisiones_consolidacion;
drop policy if exists "decisiones_consolidacion_select_sobre_cerrado" on public.decisiones_consolidacion;
drop policy if exists "resultados_consolidacion_select_participantes" on public.resultados_consolidacion;

-- Cada usuario autenticado puede insertar solo su propia decisión
-- y solo si participa en la relación.
create policy "decisiones_consolidacion_insert_participante"
on public.decisiones_consolidacion
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_participante_relacion(relacion_id, auth.uid())
);

-- Sobre cerrado:
--  - antes del resultado, cada usuario solo ve su propia decisión
--  - después del resultado, los participantes pueden ver las decisiones
create policy "decisiones_consolidacion_select_sobre_cerrado"
on public.decisiones_consolidacion
for select
to authenticated
using (
  user_id = auth.uid()
  or (
    public.is_participante_relacion(relacion_id, auth.uid())
    and exists (
      select 1 from public.resultados_consolidacion rc
      where rc.relacion_id = decisiones_consolidacion.relacion_id
    )
  )
);

-- El resultado final solo lo pueden ver participantes de la relación.
create policy "resultados_consolidacion_select_participantes"
on public.resultados_consolidacion
for select
to authenticated
using (
  public.is_participante_relacion(relacion_id, auth.uid())
);

-- Calcula el resultado cuando ya hay dos decisiones y sincroniza el estado.
create or replace function public.calcular_resultado_consolidacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_decisiones integer;
  total_si integer;
begin
  select count(*) into total_decisiones
  from public.decisiones_consolidacion
  where relacion_id = new.relacion_id;

  if total_decisiones < 2 then
    return new;
  end if;

  select count(*) into total_si
  from public.decisiones_consolidacion
  where relacion_id = new.relacion_id
    and decision = 'consolidar';

  insert into public.resultados_consolidacion (relacion_id, resultado, decided_at)
  values (
    new.relacion_id,
    case when total_si = 2 then 'consolidada' else 'no_consolidada' end,
    now()
  )
  on conflict (relacion_id) do nothing;

  -- Sincronizar relaciones.estado (solo si sigue en prueba; idempotente).
  if total_si = 2 then
    update public.relaciones
       set estado = 'consolidada', consolidada_at = now(), updated_at = now()
     where id = new.relacion_id and estado = 'prueba';
  else
    update public.relaciones
       set estado = 'finalizada', finalizada_at = now(), updated_at = now()
     where id = new.relacion_id and estado = 'prueba';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_calcular_resultado_consolidacion on public.decisiones_consolidacion;

create trigger trg_calcular_resultado_consolidacion
after insert on public.decisiones_consolidacion
for each row
execute function public.calcular_resultado_consolidacion();
