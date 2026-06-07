# Spec 004 — Hacer honestos los widgets simulados

**Nombre:** Hacer honestos los widgets simulados de chat asistente y mediador.
**Estado:** en desarrollo
**Autor:** ChatGPT (spec) · Claude (implementación)
**Migración asociada:** ninguna (solo frontend).

---

## Qué hace

Elimina el riesgo de que Aurea prometa canales reales de asistencia o
mediación que todavía no existen. El chat asistente y el mediador estaban
simulados en frontend: podían parecer reales pero no guardaban mensajes, no
notificaban a nadie ni abrían incidencias.

No implementa backend. Solo ajusta producto y copy para que la experiencia sea
honesta en producción.

---

## Páginas que toca

- `aurea-prototipo/aurea/js/components.js` — chat asistente (honesto) +
  eliminación del mediador simulado.
- `aurea-prototipo/aurea/relaciones.html` — modal de incidencia convertido en
  derivación honesta a Contacto.

El resto de páginas que inyectan `chat-container` heredan el cambio
automáticamente (el widget se inyecta desde `components.js`).

---

## Tablas de Supabase que toca

Ninguna. No toca tablas, columnas, RLS, triggers, Storage ni migraciones.

---

## Qué se cambió exactamente

### Chat asistente (`components.js` · `renderChatWidget`)
- El subtítulo verde **"● En línea"** (que implicaba persona en vivo) pasa a
  un neutro **"Asistente informativo"**.
- Se añade un **aviso visible** bajo la cabecera:
  *"No es un chat en vivo. No guarda mensajes ni contacta con el equipo. Para
  hablar con una persona, usa Contacto."* (con enlace a `contacto.html`).
- El saludo se reescribe para dejar claro que es orientación informativa y que,
  para hablar con una persona, se use Contacto.
- Las respuestas (`getResp`) ya eran orientativas y la respuesta por defecto ya
  derivaba a Contacto/email. No piden datos sensibles ni afirman guardar nada.

### Mediador de incidencias (`components.js`)
- Se **elimina por completo** el flujo simulado: `renderMediador()`,
  `openMediador()`, `closeMediador()`, `addMedMsg()`, `medOpt()`, `sendMed()`
  y su estado. Generaba "Incidencia enviada · referencia INC-XXXX · el equipo
  la revisará en 24–48 horas" sin enviar nada.
- La inyección global pasa de `renderChatWidget()+renderMediador()` a solo
  `renderChatWidget()`.
- En la práctica este mediador ya era inalcanzable (`relaciones.html`
  sobreescribía `openMediador`), pero se retira para no dejar copy deshonesto
  en el código.

### Modal de incidencia (`relaciones.html`)
- Era un formulario ("Notificar incidencia" + textarea + "Enviar incidencia")
  cuyo botón solo cerraba el modal: **aparentaba abrir un caso sin enviar nada**.
- Se convierte en un panel honesto: *"¿Necesitas ayuda con una relación? Por
  ahora las incidencias se gestionan desde Contacto."* con botón principal
  **"Ir a Contacto"** → `contacto.html`. Se elimina el textarea.

---

## Flujo de usuario

**Asistente informativo:** el usuario abre el widget, ve claramente que es
ayuda informativa (no chat real), consulta orientación básica y, si necesita
ayuda humana, se le deriva a `contacto.html`.

**Incidencia / mediación:** el usuario pulsa "Incidencia" en una relación, la
interfaz no simula mediación automática, le indica que por ahora use Contacto
y le ofrece el botón a `contacto.html`.

---

## Riesgos

- UI simulada dañaba la confianza si el usuario creía haber enviado algo →
  resuelto.
- Mediación es zona sensible (conflictos, reputación, relaciones) → ya no se
  finge un canal que no existe.
- Si el usuario creía el widget real, podía quedarse sin respuesta → ahora se
  deriva siempre a Contacto.
- El cambio es **reversible**: cuando exista mediación real, se restaura el
  flujo (el comentario en `components.js` lo documenta).

---

## Criterios de aceptación

- [x] Existe `specs/004-widgets-simulados-produccion.md`.
- [x] El chat asistente no se presenta como chat humano ni soporte real.
- [x] El chat asistente indica claramente que es informativo y no persistente.
- [x] El chat asistente no pide datos sensibles.
- [x] El chat asistente no afirma que guarda mensajes.
- [x] El chat asistente no afirma que contacta con el equipo.
- [x] El mediador simulado se elimina; la incidencia deriva a `contacto.html`.
- [x] No existe ningún flujo que diga "incidencia enviada" sin envío real.
- [x] No existe ningún flujo que diga "mediador avisado" sin backend real.
- [x] Cualquier solicitud de ayuda humana deriva a `contacto.html`.
- [x] No se crean tablas nuevas ni se tocan policies RLS ni migraciones.
- [x] No se toca `package.json` ni `.env`.
- [x] La navegación sigue funcionando en páginas públicas y autenticadas.
- [x] El cambio es reversible cuando se implemente una mediación real.

---

## Notas / fuera de alcance

- `css/components.css` contiene reglas `.mediador-overlay` ya muertas, pero ese
  archivo solo lo cargan los duplicados obsoletos de `aurea-prototipo/aurea/pages/`
  (no son entradas del build de Vite). No se tocan aquí para mantener el PR
  acotado; candidatos a una limpieza de legacy aparte.
