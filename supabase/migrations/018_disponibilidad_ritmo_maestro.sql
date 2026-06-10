-- ============================================================
--  AUREA · Migración 018 — Disponibilidad y ritmo del maestro (spec 036)
--
--  Añade a maestro_perfiles: disponibilidad_estado (3 estados),
--  ritmo_preferido y disponibilidad_notas. NO añade modalidad: se
--  reutiliza `formato` (ya existía) extendiendo su check con 'a_acordar'.
--  `acepta_solicitudes` se mantiene como espejo de disponibilidad_estado
--  (lo sincroniza el frontend: pausada → false, abierta/limitada → true).
--
--  Pega este SQL en: Supabase Dashboard → SQL Editor → New query → Run
--  Idempotente.
-- ============================================================

-- 1. disponibilidad_estado (fuente de verdad del CTA de solicitud)
alter table public.maestro_perfiles
  add column if not exists disponibilidad_estado text not null default 'abierta';

-- 2. ritmo_preferido
alter table public.maestro_perfiles
  add column if not exists ritmo_preferido text not null default 'a_acordar';

-- 3. disponibilidad_notas (opcional, ≤ 500)
alter table public.maestro_perfiles
  add column if not exists disponibilidad_notas text;

-- 4. Reutilizar `formato` como modalidad: extender el check para admitir
--    'a_acordar' (se evita duplicar con una columna `modalidad_*`).
alter table public.maestro_perfiles
  drop constraint if exists maestro_perfiles_formato_check;
alter table public.maestro_perfiles
  add constraint maestro_perfiles_formato_check
  check (formato in ('presencial', 'online', 'ambos', 'a_acordar'));

-- 5. Checks de los campos nuevos (guard idempotente)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'maestro_perfiles_disponibilidad_estado_check') then
    alter table public.maestro_perfiles
      add constraint maestro_perfiles_disponibilidad_estado_check
      check (disponibilidad_estado in ('abierta', 'limitada', 'pausada'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'maestro_perfiles_ritmo_preferido_check') then
    alter table public.maestro_perfiles
      add constraint maestro_perfiles_ritmo_preferido_check
      check (ritmo_preferido in ('mensual', 'quincenal', 'semanal', 'intensivo', 'flexible', 'a_acordar'));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'maestro_perfiles_disponibilidad_notas_length_check') then
    alter table public.maestro_perfiles
      add constraint maestro_perfiles_disponibilidad_notas_length_check
      check (disponibilidad_notas is null or char_length(disponibilidad_notas) <= 500);
  end if;
end $$;

-- 6. Inicializar disponibilidad_estado coherente con acepta_solicitudes en las
--    filas existentes: si no aceptaba, queda 'pausada'. (Solo toca las que están
--    en el default 'abierta'; no pisa estados ya editados.)
update public.maestro_perfiles
  set disponibilidad_estado = 'pausada'
  where acepta_solicitudes = false
    and disponibilidad_estado = 'abierta';
