# Spec 002 — Alinear categorías en `handle_new_user`

**Nombre:** Alinear categorías permitidas en el trigger de alta de usuario.
**Estado:** en desarrollo
**Autor:** ChatGPT (spec) · Claude (implementación)
**Migración asociada:** `supabase/migrations/006_alinear_categorias_handle_new_user.sql`

---

## Qué hace

Corrige la desalineación entre la validación de categorías dentro de
`handle_new_user()` y las categorías aceptadas por las tablas y el frontend.

Hoy el trigger conserva una lista antigua de categorías. Aunque el bug no se
manifiesta porque el registro actual no envía categoría, es una **trampa
latente**: si en el futuro el alta incluye categoría, algunas categorías
válidas podrían degradarse a `'Otra'`.

No cambia producto visible. Es una migración **preventiva** para estabilidad
en producción.

---

## Páginas que toca

Ninguna directamente. Flujo afectado indirectamente: `registro.html`.
No se modifica HTML/CSS/JS (no se detectó ninguna referencia a la lista
antigua de categorías en el frontend durante la implementación).

---

## Tablas de Supabase que toca

No cambia estructura de tablas. Afecta a:

- función `public.handle_new_user()`
- trigger asociado al alta en `auth.users`

Tablas que la función ya inserta (sin cambios en esa lógica): `profiles`,
`maestro_perfiles`, `discipulo_perfiles`.

No modifica: columnas, constraints, policies RLS ni datos existentes.

---

## Flujo de usuario

1. Un usuario se registra.
2. Supabase ejecuta `handle_new_user()`.
3. El perfil se crea igual que antes.
4. Si llega una categoría en el metadata de registro (ahora o en el futuro),
   la función acepta exactamente las categorías vigentes de Aurea.
5. El alta no falla ni degrada categorías válidas por usar una lista antigua.

---

## SQL de migración

Archivo: `supabase/migrations/006_alinear_categorias_handle_new_user.sql`

Implementación: `CREATE OR REPLACE FUNCTION public.handle_new_user()` con el
cuerpo **íntegro** de la migración 004, cambiando **solo** la whitelist de
categorías.

Lista canónica permitida:
`Filosofía`, `Artes`, `Oficios`, `Deportes`, `Negocios`, `Salud`,
`Relaciones`, `Tecnología`, `Aprendizaje`, `Espiritualidad`,
`Estilo de vida`, `Otra`.

Se conservan: nombre, parámetros, `RETURN`, `LANGUAGE plpgsql`,
`SECURITY DEFINER`, la lógica de creación de perfil, la lógica de roles y
todas las inserciones existentes. La función actual **no** define
`search_path`, por lo que tampoco se añade (se conserva tal cual).

---

## Riesgos

- Reconstruir la función desde cero podría romper el alta → se copió el cuerpo
  real de la 004, solo se cambió la whitelist.
- Perder `SECURITY DEFINER` → conservado.
- Perder `search_path` → no existía; no se añade.
- Cambiar inserciones existentes → no se tocaron.
- Tildes/espacios en los nombres deben ser exactos (`Tecnología`,
  `Espiritualidad`, `Estilo de vida`) → respetados.

---

## Criterios de aceptación

- [x] Existe `specs/002-alinear-categorias-handle-new-user.md`.
- [x] Existe `supabase/migrations/006_alinear_categorias_handle_new_user.sql`.
- [x] La migración usa `CREATE OR REPLACE FUNCTION public.handle_new_user()`.
- [x] La función conserva la lógica actual salvo la lista de categorías.
- [x] La lista antigua de 8 categorías ya no aparece en `handle_new_user()`.
- [x] La lista nueva acepta exactamente las 12 entradas canónicas (11 + `Otra`).
- [x] No se modifican tablas, columnas, constraints ni policies RLS.
- [x] No se toca `package.json`.
- [x] No se toca `.env`.
- [x] El registro sin categoría sigue funcionando (lógica intacta).
- [x] Una categoría nueva válida no falla si llega en metadata.
- [ ] **Pendiente (humano):** ejecutar la migración 006 en Supabase Studio.
