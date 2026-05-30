-- ============================================================
--  AUREA · Migración 004
--  1. Crea la tabla discipulo_perfiles (con RLS)
--  2. Actualiza handle_new_user() para crearla al registrarse
--     como 'discipulo' o 'ambos'
--
--  Pega este archivo en:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================


-- ============================
-- TABLA: discipulo_perfiles
-- ============================
create table if not exists public.discipulo_perfiles (
  id                  uuid        primary key references public.profiles(id) on delete cascade,
  disciplina_buscada  text,
  categoria           text        not null default 'Otra'
                                  check (categoria in (
                                    'Filosofía','Artes','Oficios','Deportes',
                                    'Espiritualidad','Ciencia','Lenguas','Otra'
                                  )),
  nivel               text        not null default 'principiante'
                                  check (nivel in ('principiante','intermedio','avanzado')),
  disponibilidad_dias text,
  horas_semanales     text,
  max_practicas       integer     not null default 3
                                  check (max_practicas between 1 and 5),
  hashtags            text[]      not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Trigger updated_at
create trigger trg_discipulo_perfiles_updated_at
  before update on public.discipulo_perfiles
  for each row execute function set_updated_at();

-- RLS
alter table public.discipulo_perfiles enable row level security;

create policy "Perfiles de discipulo visibles por todos"
  on public.discipulo_perfiles for select
  using (true);

create policy "Discipulo gestiona su propio perfil"
  on public.discipulo_perfiles for all
  using (auth.uid() = id);


-- ============================
-- ACTUALIZAR TRIGGER handle_new_user
-- Ahora crea discipulo_perfiles para rol 'discipulo' y 'ambos'
-- ============================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_rol       text;
  v_categoria text;
  v_formato   text;
begin
  v_rol := coalesce(new.raw_user_meta_data->>'rol', 'discipulo');
  if v_rol not in ('maestro','discipulo','ambos') then
    v_rol := 'discipulo';
  end if;

  -- Perfil base
  insert into public.profiles (id, nombre, apellido, email, rol, ubicacion, frase)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nombre', ''), split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'apellido', ''),
    new.email,
    v_rol,
    coalesce(new.raw_user_meta_data->>'ubicacion', ''),
    coalesce(new.raw_user_meta_data->>'frase', '')
  );

  -- Si es maestro o ambos → crear maestro_perfiles
  if v_rol in ('maestro', 'ambos') then
    v_categoria := coalesce(new.raw_user_meta_data->>'categoria', 'Otra');
    if v_categoria not in ('Filosofía','Artes','Oficios','Deportes','Espiritualidad','Ciencia','Lenguas','Otra') then
      v_categoria := 'Otra';
    end if;
    v_formato := coalesce(new.raw_user_meta_data->>'formato', 'ambos');
    if v_formato not in ('presencial','online','ambos') then
      v_formato := 'ambos';
    end if;
    insert into public.maestro_perfiles (id, disciplina, categoria, formato)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data->>'disciplina', ''), 'Sin especificar'),
      v_categoria,
      v_formato
    );
  end if;

  -- Si es discipulo o ambos → crear discipulo_perfiles
  if v_rol in ('discipulo', 'ambos') then
    insert into public.discipulo_perfiles (id)
    values (new.id);
  end if;

  return new;
end;
$$;


-- ============================
-- CREAR discipulo_perfiles para usuarios existentes
-- que ya son discipulo o ambos pero no tienen entrada
-- ============================
insert into public.discipulo_perfiles (id)
select p.id
from   public.profiles p
where  p.rol in ('discipulo', 'ambos')
  and  not exists (
    select 1 from public.discipulo_perfiles d where d.id = p.id
  );
