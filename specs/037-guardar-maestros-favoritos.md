# Spec 037: Guardar maestros favoritos

**Estado:** en desarrollo
**Fecha:** 2026-06-11
**Autor:** ChatGPT

---

## Qué hace

Permite que un usuario guarde maestros para volver a verlos más adelante. Mejora
la exploración: el discípulo no tiene que enviar una solicitud de inmediato, puede
comparar, pensar y volver a perfiles que le interesan.

Los favoritos son **privados**: no son "me gusta" públicos, no generan ranking, no
notifican al maestro y no afectan a la reputación ni al orden de descubrimiento.

## Páginas que toca

- `aurea-prototipo/aurea/js/favoritos.js` — **nuevo** módulo ES con la lógica de
  favoritos (cargar, guardar, quitar, listar con perfil).
- `aurea-prototipo/aurea/perfil-maestro.html` — botón "Guardar maestro" /
  "Maestro guardado" en la columna izquierda, con mensajes según sesión/rol.
- `aurea-prototipo/aurea/discover.html` — botón compacto guardar/guardado en las
  cards de descubrimiento (solo para quien puede guardar).
- `aurea-prototipo/aurea/perfil.html` — sección "Maestros guardados" en Mi cuenta
  (máx. 6, con estado vacío, quitar y enlace a cada perfil).

## Tablas de Supabase que toca

| Tabla | Operación | Descripción |
|---|---|---|
| `maestros_favoritos` | CREATE / SELECT / INSERT / DELETE | nueva tabla de favoritos privados |
| `profiles` | SELECT | nombre/apellido/avatar/rol para tarjetas y permisos |
| `maestro_perfiles` | SELECT | confirmar que el guardado es un maestro real + disciplina/categoría |

No modifica `profiles`, `maestro_perfiles`, `discipulo_perfiles`, `solicitudes`,
`relaciones`, `mensajes`, `resenas` ni `notificaciones`. **No crea notificaciones.**

## Decisión de producto

Guardar un maestro es una acción **privada de exploración** ("quiero volver a ver
este perfil más adelante"). No significa "me gusta" público, solicitud enviada,
interés comunicado al maestro, ranking de popularidad ni compromiso de relación.

## Flujo de usuario

- **Desde card (discover):** el usuario que puede guardar ve un botón compacto
  `Guardar` en la card; al pulsarlo pasa a `Guardado` y el maestro queda en su
  lista privada. Reversible.
- **Desde perfil de maestro:** CTA secundario `Guardar maestro` → `Maestro
  guardado`. No compite con el CTA principal `Enviar solicitud`. Reversible.
- **Ver favoritos:** en `perfil.html` / Mi cuenta hay una sección `Maestros
  guardados` (máx. 6) con enlace al perfil de cada uno y acción `Quitar`.

## Comportamiento por sesión/rol

- **No autenticado:** no puede guardar. En perfil-maestro se muestra "Inicia
  sesión para guardar maestros." y el botón lleva a login. En las cards no aparece
  el botón.
- **Discípulo / ambos autenticado:** puede guardar.
- **Maestro puro:** no guarda desde su rol actual. En perfil-maestro se muestra
  "Cambia a rol discípulo para guardar maestros." (botón deshabilitado). En las
  cards y en Mi cuenta no se muestra la funcionalidad.
- **Viendo su propio perfil de maestro:** no puede guardarse a sí mismo; no se
  muestra el botón (ya existe "Ver mi cuenta").

## Migración SQL

`supabase/migrations/019_maestros_favoritos.sql` (siguiente número libre tras la
018). Crea `maestros_favoritos` con `user_id` y `maestro_id` → `profiles(id)`,
constraint `check (user_id <> maestro_id)`, `unique (user_id, maestro_id)`,
índices y RLS (select/insert/delete solo del propio dueño, sin update).
Idempotente. La ejecuta el humano en Supabase Studio.

## Criterios de aceptación

- [x] Existe `specs/037-guardar-maestros-favoritos.md`.
- [x] Existe migración con el siguiente número libre (`019_maestros_favoritos.sql`).
- [x] Existe tabla `maestros_favoritos` con RLS activado.
- [x] Un usuario solo puede ver / crear / borrar sus propios favoritos (RLS).
- [x] Un usuario no puede guardarse a sí mismo (check + RLS + UI).
- [x] No puede haber favoritos duplicados (unique).
- [x] Guardar/quitar desde `perfil-maestro.html`, persistente tras recargar.
- [x] Guardar/quitar desde cards de descubrimiento.
- [x] Mi cuenta muestra sección de maestros guardados con estado vacío.
- [x] Cada favorito enlaza al perfil público del maestro.
- [x] El maestro no recibe notificación; no hay contador ni ranking público.
- [x] No se toca `package.json` ni `.env`.

## Notas / restricciones

- `maestro_id` referencia `profiles(id)` (el maestro es un usuario), igual que
  `solicitudes`/`relaciones`. La UI confirma que es un maestro real comprobando su
  fila en `maestro_perfiles`; los favoritos cuyo perfil ya no es maestro se
  descartan del listado.
- En las cards la confirmación se gestiona con `aria-pressed` + texto (no solo
  icono), sin desplazar el CTA principal ni romper el layout móvil.
- No se crea página dedicada (`favoritos.html`): se empieza en Mi cuenta. Como no
  hay listado completo, no se muestra "ver más".
