# Spec 023 — Eliminar cuenta y datos personales

**Nombre:** Permitir al usuario eliminar su cuenta y borrar sus datos personales.

**Estado:** borrador

**Migración asociada:** `supabase/migrations/016_eliminar_cuenta_usuario.sql`

> Numeración: ChatGPT entregó esta spec como "022" + migración "012", ambos
> obsoletos (022 = pulido formularios; última migración = 015). Se usa **spec 023
> + migración 016**.

## Qué hace

Permite a un usuario autenticado eliminar su cuenta desde `perfil-edicion.html`
(pestaña **Cuenta**, zona de peligro). Borra sus datos personales de la base de
datos activa, su avatar y su usuario de Auth, y cierra sesión. Toca Supabase
(migración + función `SECURITY DEFINER`); no se resuelve solo ocultando el perfil
en frontend.

## Verificación del esquema real (clave)

El SQL del borrador asumía columnas que **no existen** (`mensajes.emisor_id`,
`maestro_perfiles.user_id`, `trayectoria.user_id`, `historial_discipulo.user_id`).
Tras revisar el esquema real, la función se reescribió apoyándose en las **FK
reales**:

- `profiles.id → auth.users(id) ON DELETE CASCADE`.
- Cuelgan de `profiles(id)` con **ON DELETE CASCADE**: `maestro_perfiles(id)`,
  `discipulo_perfiles(id)`, `trayectoria(maestro_id)`,
  `solicitudes(discipulo_id, maestro_id)`, `mensajes(autor_id)`,
  `resenas(maestro_id, discipulo_id)`, `historial_discipulo(discipulo_id)`
  (su `maestro_id → SET NULL`, con copia `maestro_nombre`),
  `notificaciones(user_id)`, `decisiones_consolidacion(user_id)`.
- Único FK **ON DELETE RESTRICT**: `relaciones(maestro_id/discipulo_id) → profiles`.
- Cuelgan de `relaciones(id)` con CASCADE: `sesiones_prueba`,
  `mensajes(relacion_id)`, `decisiones_consolidacion(relacion_id)`,
  `resultados_consolidacion(relacion_id)`; con SET NULL:
  `resenas.relacion_id`, `historial_discipulo.relacion_id`.

## Función `public.eliminar_mi_cuenta()` (migración 016)

`SECURITY DEFINER`, usa **`auth.uid()`** (no acepta id del cliente) → un usuario
solo puede borrarse a sí mismo. `revoke` a public/anon; `grant execute` solo a
`authenticated`. Pasos:

1. Borra `relaciones` del usuario (desbloquea el RESTRICT y cascada lo asociado).
2. Borra `profiles` → **CASCADE** elimina todo lo personal restante.
3. Borra `auth.users`.

**Avatar:** NO se borra en SQL. Supabase **bloquea el `DELETE` directo sobre
`storage.objects`** (trigger `storage.protect_delete`: "Use the Storage API
instead"). Por eso el **frontend** borra el avatar vía Storage API
(`supabase.storage.from('avatars').remove([...])`) **antes** del RPC; como el
perfil se elimina, nada vuelve a referenciar ese avatar. (Si el borrado del
fichero fallara, queda huérfano en el bucket pero sin referencia; limpieza
opcional futura.) **El error NO se captura a propósito** (atómico): si el
   entorno no permite borrar `auth.users` desde la función, la excepción se
   propaga y **toda la transacción se revierte** (pasos 1–3 incluidos). Así o se
   borra todo (datos + auth) o no se borra nada, y el cliente recibe un error
   real — nunca un falso "cuenta eliminada" con un usuario de Auth huérfano y un
   login roto. (Corrige el bloqueante de Codex: antes se tragaba el error y se
   reportaba éxito parcial como total.)

**Fallback de `auth.users`:** borrar `auth.users` desde una función
`SECURITY DEFINER` (propiedad del rol de la migración) suele funcionar en
Supabase. **El humano DEBE probarlo en Studio con una cuenta de prueba antes de
mergear.** Si el borrado de `auth.users` falla, la RPC devolverá error (nada se
borra) y se implementará el fallback: **Edge Function `delete-account` con
`service_role`** que use la Admin API (`auth.admin.deleteUser`) — nunca exponer
`service_role` en el cliente. (Mini-spec aparte si hace falta.)

## Frontend (`perfil-edicion.html`, pestaña Cuenta)

Bloque "Eliminar cuenta" (zona de peligro, copy de la spec). Flujo:
`Eliminar mi cuenta` → revela confirmación → exige escribir **ELIMINAR**
(botón final deshabilitado hasta entonces) → `Eliminar cuenta definitivamente`.
Al confirmar: intenta borrar el avatar vía Storage API, llama a
`rpc('eliminar_mi_cuenta')`, hace `signOut()`, limpia `localStorage` sensible
(`aurea-rol`, `aurea-rol-ts`) y redirige a `index.html`. Evita doble envío
(botón disabled + texto "Eliminando…"); errores amables (sin SQL crudo).

`aurea-tema` no se borra (es preferencia local de visualización, no de cuenta).

## Acción manual requerida (Supabase Studio)

Ejecutar `supabase/migrations/016_eliminar_cuenta_usuario.sql`. **Probar con una
cuenta de prueba** y confirmar: el perfil desaparece, `auth.users` desaparece (o
documentar bloqueo y aplicar fallback), no carga el perfil por URL directa, no
quedan solicitudes/relaciones/avatar asociados y la cuenta no puede volver a
iniciar sesión.

## Seguridad

- `auth.uid()` interno; sin `user_id` del cliente. Un usuario no borra a otro.
- `service_role` NUNCA en frontend. El borrado va por la función segura, no
  tabla por tabla desde el cliente.

## Criterios de aceptación

- [x] Existe `specs/023-eliminar-cuenta-datos-personales.md`.
- [x] Existe `supabase/migrations/016_eliminar_cuenta_usuario.sql`.
- [x] Existe `public.eliminar_mi_cuenta()` segura; `grant execute` solo a `authenticated`.
- [x] Usa `auth.uid()`; no acepta id arbitrario; un usuario no puede borrar otra cuenta.
- [x] Borra perfil, perfiles maestro/discípulo, trayectoria, solicitudes,
  relaciones, mensajes, reseñas (emitidas/recibidas), historial, notificaciones,
  decisiones/resultados de consolidación y avatar (vía CASCADE + borrados explícitos).
- [x] Borra `auth.users` (con fallback documentado si el entorno lo bloquea).
- [x] No se expone `service_role` en frontend.
- [x] La UI exige escribir `ELIMINAR`, comunica irreversibilidad y evita doble envío.
- [x] Tras eliminar: `signOut`, limpia estado local sensible y redirige a `index.html`.
- [x] No se toca `package.json` ni `.env`.
- [x] La migración se ejecuta manualmente en Studio (sin acceso remoto de Claude).
- [ ] El humano prueba el borrado con cuenta de prueba (perfil/URL/login/auth).
