-- ============================================================
-- 016 — Eliminar cuenta y datos personales (spec 023)
-- ============================================================
-- Función SECURITY DEFINER que un usuario AUTENTICADO invoca vía
-- rpc('eliminar_mi_cuenta') para borrar SU PROPIA cuenta. Usa auth.uid()
-- (nunca un id recibido del cliente) → un usuario no puede borrar a otro.
--
-- Diseño basado en el ESQUEMA REAL verificado (no en los nombres del borrador
-- de la spec, que asumían columnas inexistentes como emisor_id / user_id en
-- maestro_perfiles / trayectoria.user_id):
--   · Casi todo cuelga de public.profiles con ON DELETE CASCADE:
--     maestro_perfiles(id), discipulo_perfiles(id), trayectoria(maestro_id),
--     solicitudes(discipulo_id, maestro_id), mensajes(autor_id),
--     resenas(maestro_id, discipulo_id), historial_discipulo(discipulo_id;
--     maestro_id → SET NULL), notificaciones(user_id),
--     decisiones_consolidacion(user_id).
--   · profiles.id → auth.users(id) ON DELETE CASCADE.
--   · El ÚNICO FK con ON DELETE RESTRICT es relaciones→profiles, así que las
--     relaciones del usuario se borran PRIMERO. Eso cascada sesiones_prueba,
--     mensajes(relacion_id), decisiones_consolidacion(relacion_id),
--     resultados_consolidacion(relacion_id) y pone a NULL
--     resenas.relacion_id / historial_discipulo.relacion_id.
-- ============================================================

create or replace function public.eliminar_mi_cuenta()
returns void
language plpgsql
security definer
set search_path = public, storage, auth
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'No autenticado.';
  end if;

  -- 1) Relaciones donde participa (FK RESTRICT a profiles → hay que borrarlas
  --    antes del perfil). Al borrarlas cascada todo lo asociado a esas relaciones.
  delete from public.relaciones
  where maestro_id = v_user_id or discipulo_id = v_user_id;

  -- 2) Avatar(es) del usuario en Storage: avatars/{uid}/...  (limpieza defensiva;
  --    el frontend también intenta borrarlo vía Storage API antes del RPC).
  if to_regclass('storage.objects') is not null then
    delete from storage.objects
    where bucket_id = 'avatars'
      and (storage.foldername(name))[1] = v_user_id::text;
  end if;

  -- 3) Perfil principal. CASCADE borra todo lo personal restante (ver cabecera).
  delete from public.profiles where id = v_user_id;

  -- 4) Usuario de Auth. Si el entorno no permitiera borrar auth.users desde esta
  --    función, los datos personales (paso 3) YA están borrados y no se revierte;
  --    se deja un warning para activar el fallback (Edge Function service_role).
  begin
    delete from auth.users where id = v_user_id;
  exception when others then
    raise warning 'eliminar_mi_cuenta: no se pudo borrar auth.users (%). Datos personales ya borrados.', sqlerrm;
  end;
end;
$$;

revoke all on function public.eliminar_mi_cuenta() from public;
revoke all on function public.eliminar_mi_cuenta() from anon;
grant execute on function public.eliminar_mi_cuenta() to authenticated;
