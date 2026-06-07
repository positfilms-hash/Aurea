-- ============================================================
--  AUREA · Migración 011 — Límites reales del periodo de prueba
--
--  Adaptación de la spec 010 (aprobada por el humano):
--  `relaciones` YA tiene las columnas necesarias:
--    - iniciada_at        → inicio del periodo de prueba (default now())
--    - dias_prueba_total  → duración en días (default 30)
--  y el frontend ya las usa. Por eso NO se añaden columnas nuevas ni
--  backfill: el fin del periodo se calcula como
--  iniciada_at + dias_prueba_total días.
--
--  Lo único que faltaba era el cierre real en la BD: impedir crear más
--  de 3 sesiones por relación y crear sesiones tras vencer el periodo.
--
--  Pega este archivo en:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

create or replace function public.validar_limites_sesion_prueba()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_iniciada_at timestamptz;
  v_dias        integer;
  v_estado      text;
  v_fin         timestamptz;
  v_total       integer;
begin
  select r.iniciada_at, coalesce(r.dias_prueba_total, 30), r.estado
    into v_iniciada_at, v_dias, v_estado
  from public.relaciones r
  where r.id = new.relacion_id;

  if v_iniciada_at is null then
    raise exception 'No existe la relación o no tiene fecha de inicio de prueba.';
  end if;

  -- Las sesiones de prueba solo se registran mientras la relación está en prueba.
  if v_estado <> 'prueba' then
    raise exception 'La relación no está en periodo de prueba.';
  end if;

  -- Fin del periodo = inicio + duración (sin columna redundante).
  v_fin := v_iniciada_at + (v_dias || ' days')::interval;
  if now() > v_fin then
    raise exception 'El periodo de prueba ha terminado.';
  end if;

  -- Máximo 3 sesiones por relación.
  select count(*) into v_total
  from public.sesiones_prueba sp
  where sp.relacion_id = new.relacion_id;

  if v_total >= 3 then
    raise exception 'La relación ya ha usado las 3 sesiones de prueba.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validar_limites_sesion_prueba on public.sesiones_prueba;

create trigger trg_validar_limites_sesion_prueba
before insert on public.sesiones_prueba
for each row
execute function public.validar_limites_sesion_prueba();
