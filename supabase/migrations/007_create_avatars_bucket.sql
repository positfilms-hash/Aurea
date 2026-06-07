-- ============================================================
--  AUREA · Migración 007
--  Versiona el bucket público de avatares y sus policies.
--
--  El bucket puede existir ya en producción (creado a mano),
--  por eso usamos upsert sobre storage.buckets.
--
--  Convención de rutas: avatars/{auth.uid()}/avatar.{ext}
--  Cada usuario solo puede escribir/actualizar/borrar dentro de
--  la carpeta cuyo primer segmento es su propio auth.uid().
--  Lectura pública por bucket público (no se añade policy de SELECT).
--
--  Pega este archivo en:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  1048576,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Limpieza defensiva de policies anteriores con estos nombres.
drop policy if exists "avatars_insert_own_folder" on storage.objects;
drop policy if exists "avatars_update_own_folder" on storage.objects;
drop policy if exists "avatars_delete_own_folder" on storage.objects;

-- Permite a usuarios autenticados subir su propio avatar.
create policy "avatars_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Permite a usuarios autenticados actualizar únicamente objetos de su carpeta.
create policy "avatars_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Permite a usuarios autenticados borrar únicamente objetos de su carpeta.
create policy "avatars_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
