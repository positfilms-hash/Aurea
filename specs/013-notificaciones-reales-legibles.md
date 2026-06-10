# Spec 013 — Notificaciones reales y legibles

**Nombre:** Crear notificaciones in-app persistentes y legibles.
**Estado:** en desarrollo
**Autor:** ChatGPT (spec) · Claude (implementación)
**Migración asociada:** `supabase/migrations/013_notificaciones_in_app.sql`
**Depende de:** spec 007 (`resultados_consolidacion`) y spec 012 (`resenas`), ambas aplicadas.

> **Numeración:** la spec es la 013 (la última era 012); la migración es la **013**
> (ChatGPT propuso "011", ya ocupada).

---

## Qué hace

Convierte las notificaciones en un sistema **persistente** (tabla
`notificaciones`) generado desde **triggers seguros** en Supabase, y añade una
**campana en el nav** con badge de no leídas + dropdown legible. Sustituye los
badges paralelos de `notif.js` por un único badge global desde `notificaciones`.

---

## Decisión técnica / adaptaciones

- **`mensajes` usa `autor_id`, no `emisor_id`** (lo que asumía la spec). El
  trigger de mensajes se adapta a `autor_id`.
- **Consolidación del badge:** el `notif.js` anterior calculaba badges paralelos
  (solicitudes/relaciones/mensajes) sobre los enlaces del nav. Ahora el badge
  global viene **solo** de `notificaciones` (no leídas). Se retira el cálculo
  paralelo; el badge de mensajes por enlace deja de poblarse.
- URLs de notificación **relativas** (la web sirve páginas en la raíz) y validadas
  contra una allowlist en el front.

---

## Tablas de Supabase

**Crea:** `notificaciones` (con RLS). **Lee** para contexto en triggers:
`solicitudes`, `mensajes`, `relaciones`, `resultados_consolidacion`, `resenas`.
**Triggers nuevos** en: `solicitudes` (insert + update), `mensajes` (insert),
`resultados_consolidacion` (insert), `resenas` (insert). No modifica datos
existentes.

### Seguridad
- RLS: SELECT/UPDATE solo de las propias (`user_id = auth.uid()`). **Sin policy de
  INSERT** → los clientes no pueden crear notificaciones.
- Las notificaciones las crea `crear_notificacion()` (SECURITY DEFINER), con
  `REVOKE` de public/anon/authenticated → no es invocable por RPC desde cliente;
  solo la usan los triggers.
- Índice único de dedupe `(user_id, tipo, entidad_tipo, entidad_id)` + `on
  conflict do nothing` → no se duplican avisos.

---

## Eventos → notificación

| Evento | Destinatario | tipo |
|---|---|---|
| Solicitud nueva | maestro | `solicitud_recibida` |
| Solicitud aceptada | discípulo | `solicitud_aceptada` |
| Solicitud rechazada | discípulo | `solicitud_rechazada` |
| Mensaje nuevo | receptor | `mensaje_nuevo` |
| Resultado de consolidación | ambos | `consolidacion_resultado` |
| Reseña nueva | maestro | `resena_recibida` |

- **Sobre cerrado respetado:** solo se notifica al **insertarse**
  `resultados_consolidacion` (el resultado), nunca las decisiones individuales.
- El mensaje no expone contenido sensible: "Nuevo mensaje" + enlace a `mensajes.html`.

---

## Frontend

- **`components.js`:** campana 🔔 en el nav autenticado, con badge
  `#nav-notif-badge` y dropdown (`#nav-notif-dd`) con cabecera "Marcar todas" y
  lista. `toggleNotifDd()` + cierre al clicar fuera.
- **`notif.js`** (reescrito): `checkNotificaciones()` cuenta no leídas, pinta el
  badge, carga la lista (últimas 20) y se suscribe por Realtime a
  `notificaciones` del usuario. Click en una notificación → marca leída y navega
  (la navegación no se bloquea si falla el marcado). "Marcar todas como leídas".
  `refreshMsgBadge()` se mantiene como alias retrocompatible.
- **Páginas:** se añadió `checkNotificaciones()` donde faltaba (mensajes,
  historia, perfil, perfil-edicion, perfil-maestro); ya estaba en discover,
  solicitudes, relaciones, periodo-prueba, perfil-discipulo.
- Persistencia: al recargar, el estado se relee de la tabla (no depende de
  Realtime); si Realtime falla, la app sigue funcionando.

---

## Riesgos

- Notificaciones solo en frontend → resuelto (persisten en tabla).
- Spam interno → sin policy de insert; solo triggers + función con REVOKE.
- Decisión individual de consolidación → no se notifica (solo el resultado).
- Badge mal contado → cuenta `leida_at is null` del propio usuario.
- Duplicados → índice de dedupe + `on conflict do nothing`.
- Contenido sensible de mensajes → no se muestra (texto genérico).

---

## Criterios de aceptación

- [x] Existe `specs/013-notificaciones-reales-legibles.md`.
- [x] Existe `supabase/migrations/013_notificaciones_in_app.sql`.
- [x] Existe la tabla `notificaciones` con RLS.
- [x] Un usuario solo lee/marca como leídas sus propias notificaciones.
- [x] No hay policy que permita a clientes crear notificaciones.
- [x] Solicitud nueva / aceptada / rechazada → notifica a quien corresponde.
- [x] Mensaje nuevo → notifica al receptor (sin contenido sensible).
- [x] Resultado de consolidación → notifica a ambas partes.
- [x] Reseña nueva → notifica al maestro.
- [x] No se notifica la decisión individual de consolidación.
- [x] El badge global muestra solo no leídas y desaparece si no hay.
- [x] Se puede marcar una (al abrir) o todas como leídas.
- [x] Click en una notificación lleva a su página.
- [x] Las notificaciones sobreviven a recarga (lectura desde tabla).
- [x] Realtime actualiza el badge si está disponible; la app funciona sin él.
- [x] No se implementa email/push/cron. No se toca `package.json` ni `.env`.
- [ ] **Pendiente (humano):** ejecutar la migración 013 en Supabase Studio.

---

## Notas / fuera de alcance

- Cada mensaje genera una notificación `mensaje_nuevo`. Leer el chat no marca
  esas notificaciones como leídas automáticamente (se limpian al abrirlas en el
  panel o con "Marcar todas"). Posible refinamiento futuro: marcar leídas las
  notificaciones de mensajes de una relación al abrir su chat.
- Las páginas públicas con nav inteligente (index, como-funciona, contacto, dona)
  muestran la campana si hay sesión, pero no llaman a `checkNotificaciones()`;
  fuera del alcance de esta spec (no son la navegación principal autenticada).
