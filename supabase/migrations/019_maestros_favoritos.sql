-- ============================================================
--  AUREA · Migración 019 — Maestros favoritos (spec 037)
--
--  Permite que un usuario guarde maestros para volver a verlos.
--  Los favoritos son PRIVADOS: solo su dueño los ve, no notifican
--  al maestro y no generan ranking público.
--
--  Idempotente. Pega este SQL en:
--  Supabase Dashboard → SQL Editor → New query → Run
--
--  NOTA: tanto user_id como maestro_id referencian profiles(id)
--  porque el maestro también es un usuario/perfil (mismo patrón que
--  solicitudes/relaciones). La UI confirma que el perfil guardado es
--  realmente un maestro comprobando que exista su fila en
--  maestro_perfiles (cuyo id = profiles.id).
-- ============================================================


create table if not exists public.maestros_favoritos (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  maestro_id  uuid        not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),

  -- No puedes guardarte a ti mismo.
  constraint maestros_favoritos_no_self
    check (user_id <> maestro_id),

  -- Un usuario no puede guardar dos veces al mismo maestro.
  constraint maestros_favoritos_unico
    unique (user_id, maestro_id)
);

-- Listado "Mis maestros guardados" (más recientes primero).
create index if not exists maestros_favoritos_user_created_idx
  on public.maestros_favoritos (user_id, created_at desc);

-- Limpieza por maestro (cascade) y futuros usos internos.
create index if not exists maestros_favoritos_maestro_idx
  on public.maestros_favoritos (maestro_id);


-- ============================================================
-- RLS: cada usuario solo ve / crea / borra SUS propios favoritos.
-- (Sin policy de UPDATE: un favorito no se edita, se crea o se borra.)
-- ============================================================
alter table public.maestros_favoritos enable row level security;

drop policy if exists "maestros_favoritos_select_propios" on public.maestros_favoritos;
drop policy if exists "maestros_favoritos_insert_propios" on public.maestros_favoritos;
drop policy if exists "maestros_favoritos_delete_propios" on public.maestros_favoritos;

create policy "maestros_favoritos_select_propios"
  on public.maestros_favoritos for select
  to authenticated
  using (user_id = auth.uid());

create policy "maestros_favoritos_insert_propios"
  on public.maestros_favoritos for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and user_id <> maestro_id
  );

create policy "maestros_favoritos_delete_propios"
  on public.maestros_favoritos for delete
  to authenticated
  using (user_id = auth.uid());
