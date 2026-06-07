-- ============================================================
--  AUREA · Migración 006
--  Alinea la whitelist de categorías dentro de handle_new_user()
--  con las 11 categorías vigentes (+ 'Otra'), igual que el CHECK
--  de las tablas (migración 005) y el frontend (categorias.js).
--
--  Reemplaza la función conservando ÍNTEGRO el cuerpo definido en
--  la migración 004. Lo ÚNICO que cambia es la whitelist de categorías
--  permitidas, que pasa de la lista antigua a las 11 categorías
--  canónicas vigentes (+ 'Otra').
--
--  No modifica tablas, columnas, constraints, policies RLS ni datos.
--
--  Pega este archivo en:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

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
    -- Whitelist alineada con las 11 categorías vigentes (migración 005 + categorias.js)
    if v_categoria not in (
      'Filosofía','Artes','Oficios','Deportes','Negocios',
      'Salud','Relaciones','Tecnología','Aprendizaje',
      'Espiritualidad','Estilo de vida','Otra'
    ) then
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
