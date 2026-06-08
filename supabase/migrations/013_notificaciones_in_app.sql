-- ============================================================
--  AUREA · Migración 013 — Notificaciones in-app persistentes
--
--  Crea la tabla `notificaciones`, una función segura para generarlas
--  (SECURITY DEFINER, sin acceso de cliente) y triggers en los eventos
--  clave: solicitudes, mensajes, resultado de consolidación y reseñas.
--
--  Adaptación al esquema real (la spec asumía `mensajes.emisor_id`):
--    - `mensajes` usa `autor_id` (no `emisor_id`). El trigger de mensajes
--      se adapta a `autor_id`.
--    - URLs relativas (la web sirve las páginas en la raíz).
--
--  RLS: cada usuario solo lee/actualiza sus propias notificaciones.
--  No hay policy de INSERT para clientes: solo las generan los triggers.
--
--  Pega este archivo en:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

create table if not exists public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tipo text not null check (
    tipo in (
      'solicitud_recibida',
      'solicitud_aceptada',
      'solicitud_rechazada',
      'mensaje_nuevo',
      'consolidacion_resultado',
      'resena_recibida'
    )
  ),
  titulo text not null,
  cuerpo text,
  url text,
  entidad_tipo text,
  entidad_id uuid,
  leida_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notificaciones_user_created_idx
  on public.notificaciones (user_id, created_at desc);

create index if not exists notificaciones_user_unread_idx
  on public.notificaciones (user_id, created_at desc)
  where leida_at is null;

-- Evita duplicar la misma notificación (mismo destinatario, tipo y entidad).
create unique index if not exists notificaciones_dedupe_idx
  on public.notificaciones (user_id, tipo, entidad_tipo, entidad_id)
  where entidad_id is not null;

alter table public.notificaciones enable row level security;

drop policy if exists "notificaciones_select_propias" on public.notificaciones;
drop policy if exists "notificaciones_update_propias" on public.notificaciones;

create policy "notificaciones_select_propias"
  on public.notificaciones for select to authenticated
  using (user_id = auth.uid());

create policy "notificaciones_update_propias"
  on public.notificaciones for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
-- Sin policy de INSERT: las notificaciones solo se generan desde los triggers.

-- ── Función segura para crear notificaciones (solo la usan los triggers) ──
create or replace function public.crear_notificacion(
  p_user_id uuid, p_tipo text, p_titulo text, p_cuerpo text,
  p_url text, p_entidad_tipo text, p_entidad_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notificaciones (
    user_id, tipo, titulo, cuerpo, url, entidad_tipo, entidad_id
  )
  values (
    p_user_id, p_tipo, p_titulo, p_cuerpo, p_url, p_entidad_tipo, p_entidad_id
  )
  on conflict do nothing;
end;
$$;

revoke all on function public.crear_notificacion(uuid, text, text, text, text, text, uuid) from public;
revoke all on function public.crear_notificacion(uuid, text, text, text, text, text, uuid) from anon;
revoke all on function public.crear_notificacion(uuid, text, text, text, text, text, uuid) from authenticated;

-- ── Solicitud nueva → notifica al maestro ─────────────────────────────────
create or replace function public.notificar_solicitud_recibida()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.crear_notificacion(
    new.maestro_id, 'solicitud_recibida',
    'Nueva solicitud recibida', 'Alguien quiere aprender contigo.',
    'solicitudes.html', 'solicitud', new.id
  );
  return new;
end;
$$;

drop trigger if exists trg_notificar_solicitud_recibida on public.solicitudes;
create trigger trg_notificar_solicitud_recibida
  after insert on public.solicitudes
  for each row execute function public.notificar_solicitud_recibida();

-- ── Cambio de estado de solicitud → notifica al discípulo ─────────────────
create or replace function public.notificar_estado_solicitud()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.estado is distinct from new.estado then
    if new.estado = 'aceptada' then
      perform public.crear_notificacion(
        new.discipulo_id, 'solicitud_aceptada',
        'Solicitud aceptada', 'Tu solicitud ha sido aceptada. Empieza el periodo de prueba.',
        'relaciones.html', 'solicitud', new.id
      );
    elsif new.estado = 'rechazada' then
      perform public.crear_notificacion(
        new.discipulo_id, 'solicitud_rechazada',
        'Solicitud no aceptada', 'La solicitud no fue aceptada.',
        'solicitudes.html', 'solicitud', new.id
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notificar_estado_solicitud on public.solicitudes;
create trigger trg_notificar_estado_solicitud
  after update on public.solicitudes
  for each row execute function public.notificar_estado_solicitud();

-- ── Mensaje nuevo → notifica al receptor (adaptado a autor_id) ────────────
create or replace function public.notificar_mensaje_nuevo()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_receptor_id uuid;
begin
  select case when r.maestro_id = new.autor_id then r.discipulo_id else r.maestro_id end
    into v_receptor_id
  from public.relaciones r
  where r.id = new.relacion_id;

  if v_receptor_id is not null and v_receptor_id <> new.autor_id then
    perform public.crear_notificacion(
      v_receptor_id, 'mensaje_nuevo',
      'Nuevo mensaje', 'Tienes un mensaje nuevo en una relación.',
      'mensajes.html', 'mensaje', new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notificar_mensaje_nuevo on public.mensajes;
create trigger trg_notificar_mensaje_nuevo
  after insert on public.mensajes
  for each row execute function public.notificar_mensaje_nuevo();

-- ── Resultado de consolidación → notifica a ambas partes ──────────────────
create or replace function public.notificar_resultado_consolidacion()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_maestro_id uuid;
  v_discipulo_id uuid;
begin
  select r.maestro_id, r.discipulo_id into v_maestro_id, v_discipulo_id
  from public.relaciones r
  where r.id = new.relacion_id;

  if v_maestro_id is not null then
    perform public.crear_notificacion(
      v_maestro_id, 'consolidacion_resultado',
      'Resultado de consolidación disponible', 'Ya podéis ver el resultado del sobre cerrado.',
      'relaciones.html', 'relacion', new.relacion_id
    );
  end if;
  if v_discipulo_id is not null then
    perform public.crear_notificacion(
      v_discipulo_id, 'consolidacion_resultado',
      'Resultado de consolidación disponible', 'Ya podéis ver el resultado del sobre cerrado.',
      'relaciones.html', 'relacion', new.relacion_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notificar_resultado_consolidacion on public.resultados_consolidacion;
create trigger trg_notificar_resultado_consolidacion
  after insert on public.resultados_consolidacion
  for each row execute function public.notificar_resultado_consolidacion();

-- ── Reseña nueva → notifica al maestro ────────────────────────────────────
create or replace function public.notificar_resena_recibida()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.crear_notificacion(
    new.maestro_id, 'resena_recibida',
    'Nueva reseña recibida', 'Un discípulo ha dejado una reseña sobre vuestra relación.',
    'perfil.html', 'resena', new.id
  );
  return new;
end;
$$;

drop trigger if exists trg_notificar_resena_recibida on public.resenas;
create trigger trg_notificar_resena_recibida
  after insert on public.resenas
  for each row execute function public.notificar_resena_recibida();
