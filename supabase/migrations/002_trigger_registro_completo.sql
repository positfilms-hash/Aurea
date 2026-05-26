-- ============================================================
--  AUREA · Migración 002
--  Amplía handle_new_user() para crear el perfil completo
--  con todos los datos recogidos en el formulario de registro.
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
  -- Rol: validar que sea uno de los valores permitidos
  v_rol := coalesce(new.raw_user_meta_data->>'rol', 'discipulo');
  if v_rol not in ('maestro','discipulo','ambos') then
    v_rol := 'discipulo';
  end if;

  -- Insertar perfil base
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

  -- Si es maestro o ambos, crear perfil de maestro
  if v_rol in ('maestro', 'ambos') then
    -- Validar categoría
    v_categoria := coalesce(new.raw_user_meta_data->>'categoria', 'Otra');
    if v_categoria not in ('Filosofía','Artes','Oficios','Deportes','Espiritualidad','Ciencia','Lenguas','Otra') then
      v_categoria := 'Otra';
    end if;

    -- Validar formato
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

  return new;
end;
$$;
