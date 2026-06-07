# Spec 003 — Versionar bucket `avatars`

**Nombre:** Versionar bucket de Storage `avatars`.
**Estado:** en desarrollo
**Autor:** ChatGPT (spec) · Claude (implementación)
**Migración asociada:** `supabase/migrations/007_create_avatars_bucket.sql`

---

## Qué hace

Convierte el bucket `avatars` de Supabase Storage en infraestructura
versionada dentro del repo. Hoy el bucket existe manualmente en Supabase pero
no está descrito en migraciones, así que un entorno nuevo puede tener todas
las tablas correctas y aun así fallar al subir o mostrar fotos de perfil.

Define el bucket, sus restricciones básicas y las policies mínimas para que
cada usuario gestione su propio avatar sin poder sobrescribir el de otros.

---

## Páginas que toca

Directamente:
- `perfil-edicion.html` — única página que **sube** al storage (flujo de avatar).

Indirectamente (solo **lectura** de `avatar_url`, sin cambios de código):
- `perfil.html`, `perfil-maestro.html`, `perfil-discipulo.html` y cualquier
  página que muestre el avatar desde `profiles`. Funcionan porque el bucket es
  público (la lectura no depende de RLS).

---

## Tablas de Supabase que toca

No toca tablas de negocio. Toca infraestructura de Storage:
- `storage.buckets` (upsert del bucket)
- `storage.objects` (policies)

No modifica `profiles`, `maestro_perfiles`, `discipulo_perfiles`,
`solicitudes`, `relaciones`, `mensajes`, `resenas`, `historial_discipulo`,
ni sus policies RLS.

---

## Decisión de producto

Los avatares son **públicos**: forman parte de la identidad visible del
maestro/discípulo y se muestran en perfiles públicos. La privacidad se
resuelve permitiendo no subir foto, no ocultando el bucket.

---

## Convención de rutas

```
avatars/{auth.uid()}/avatar.{ext}
```

- No se permiten subidas en la raíz del bucket.
- Un usuario solo puede escribir en la carpeta cuyo primer segmento coincide
  con su `auth.uid()`.

El frontend usa siempre `{auth.uid()}/avatar.jpg` (la imagen se redimensiona y
se sube como JPEG), que cumple la convención.

---

## Flujo de usuario

1. El usuario entra en edición de perfil.
2. Selecciona una imagen de avatar.
3. Se valida en cliente (tamaño + moderación NSFWJS, sin cambios).
4. Si pasa, se sube al bucket `avatars` bajo `{auth.uid()}/avatar.jpg`.
5. El perfil muestra el avatar actualizado.
6. Otros usuarios pueden ver el avatar en perfiles públicos, pero no modificarlo.

---

## SQL de migración

Archivo: `supabase/migrations/007_create_avatars_bucket.sql`

- `insert ... on conflict (id) do update` sobre `storage.buckets` (idempotente,
  respeta que el bucket ya exista en producción).
- Bucket público, `file_size_limit = 1048576` (1 MB), MIME permitidos:
  `image/jpeg`, `image/png`, `image/webp`.
- Tres policies sobre `storage.objects` (insert/update/delete) limitadas a la
  carpeta propia: `(storage.foldername(name))[1] = auth.uid()::text`.
- **No** se añade policy de SELECT (la lectura va por bucket público).

---

## Notas de implementación

- El código ya guardaba en `{auth.uid()}/avatar.jpg`: la convención se respeta
  sin migrar rutas.
- **Cambio clave:** se sustituyó `upload(..., { upsert: true })` por
  **borrar-y-subir** (`remove([path])` y luego `upload(...)` sin upsert). Así el
  flujo depende solo de las policies `insert` y `delete` de carpeta propia,
  evitando que `upsert` exija una policy de `update`/`select` ambigua según la
  versión de Supabase. `remove()` sobre una ruta inexistente no falla (primer
  avatar del usuario).
- La policy de `update` se incluye igualmente (criterio de aceptación), aunque
  el flujo actual no dependa de ella.
- El límite del bucket (1 MB) aplica al blob redimensionado (400 px, JPEG), muy
  por debajo de 1 MB. El check de cliente sobre el archivo original (5 MB) se
  mantiene.
- No se añaden dependencias. No se toca `package.json` ni `.env`.

---

## Riesgos

- Si el bucket siguiera siendo manual, un entorno nuevo fallaría aunque las
  tablas estuvieran bien → resuelto al versionarlo.
- Escritura en cualquier ruta permitiría sobrescribir avatares ajenos →
  evitado con el filtro de carpeta propia.
- Listado libre del bucket expondría datos → no se añade policy de SELECT.
- Imágenes grandes / formatos no controlados → límite 1 MB + whitelist de MIME.
- Si el frontend usara otra ruta, la migración podría bloquear subidas → no es
  el caso (ya usa la convención).

---

## Criterios de aceptación

- [x] Existe `specs/003-versionar-bucket-avatars.md`.
- [x] Existe `supabase/migrations/007_create_avatars_bucket.sql`.
- [x] La migración crea o actualiza el bucket `avatars`.
- [x] El bucket queda público.
- [x] Límite de tamaño 1 MB.
- [x] MIME aceptados: `image/jpeg`, `image/png`, `image/webp`.
- [x] Subidas solo para usuarios autenticados.
- [x] Insert/update/delete limitados a la carpeta `{auth.uid()}`.
- [x] No se añade policy de listado libre (SELECT).
- [x] El flujo de edición sube a `{auth.uid()}/avatar.jpg`.
- [x] Los perfiles muestran el avatar tras actualizarlo (lectura por bucket público).
- [x] Los perfiles públicos pueden mostrar avatares.
- [x] La moderación de imagen existente no se elimina.
- [x] No se modifican tablas de negocio.
- [x] No se toca `package.json` ni `.env`.
- [ ] **Pendiente (humano):** ejecutar la migración 007 en Supabase Studio.
