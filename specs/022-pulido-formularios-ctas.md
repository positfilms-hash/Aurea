# Spec 022 — Pulido visual de formularios y CTAs

**Nombre:** Pulir formularios y llamadas a la acción en Aurea.

**Estado:** borrador

> Nota de numeración: ChatGPT entregó esta spec como "021", pero el 021 ya es
> *discover público* (mergeado). Se usa **022** (siguiente libre). No cambia
> backend ni lógica.

## Qué hace

Mejora claridad, jerarquía y errores de formularios/CTAs en pantallas clave.
Sobre el sistema de botones de la spec 017 (`.btn-primary/.btn-secondary/
.btn-ghost/.btn-danger`), que ya existe. Esta entrega prioriza los arreglos
**concretos y seguros** que no tocan lógica de negocio.

## Cambios de esta entrega

### Errores humanos (criterio: no mostrar errores técnicos crudos)
Se reemplazan los `error.message`/`err.message` crudos mostrados al usuario por
mensajes humanos, conservando `console.error(...)` para depuración:

- **`login.html`** — fallback del mapa de errores → "No hemos podido iniciar
  sesión. Inténtalo de nuevo." (mantiene los mensajes específicos de credenciales).
- **`registro.html`** — fallback → "No hemos podido crear tu cuenta. Inténtalo de
  nuevo.". **Bug corregido:** tras error, el botón se restauraba a "Entrar en
  Aurea"; ahora vuelve a **"Crear cuenta"** (CTA correcto de la spec).
- **`contacto.html`** — error de EmailJS → "No hemos podido enviar el mensaje
  ahora mismo. Inténtalo de nuevo o escríbenos a info.aureacatena@gmail.com.".
- **`perfil-edicion.html`** — guardar ("No hemos podido guardar los cambios.
  Inténtalo de nuevo."), subida de avatar, baja de rol y añadir rol: todos
  humanizados. Copy de éxito al guardar → **"Perfil actualizado"**.
- **`perfil-maestro.html`** — error al enviar solicitud → "No hemos podido enviar
  tu solicitud ahora mismo. Inténtalo de nuevo.".
- **`perfil-discipulo.html`** — error al aceptar → "No se pudo aceptar. Reintenta".

### CTAs / copy de acciones delicadas
- **`solicitudes.html`** — el botón de rechazo era una "✕" (solo icono,
  ambiguo, riesgo de click accidental) → ahora **"No aceptar"** (etiqueta clara,
  copy sobrio).
- **`perfil-discipulo.html`** — "Rechazar solicitud" → **"No aceptar"** (la spec
  pide evitar "Rechazar discípulo").

### Estados ya correctos (verificados, sin cambios)
- `login`/`registro`/`contacto`: CTA principal claro, estado loading
  ("Entrando…"/"Registrando…"/"Enviando…") + `disabled` que evita doble envío,
  labels visibles, error junto al formulario, confirmación de envío real en
  contacto. `perfil-edicion` guardar y `perfil-maestro` solicitar ya tenían
  loading + disabled.
- Los modales (`.modal`) ya quedan acotados en móvil por la spec 017.

## Pendiente — verificación con sesión (autenticadas)

Como en la spec 016, las páginas autenticadas no se pueden cargar en el preview
sin sesión. A verificar visualmente por el humano (móvil 360–430):
- `solicitudes`: que "Aceptar" y "No aceptar" queden bien separados (sin click
  accidental) en la fila.
- `periodo-prueba`: jerarquía de las decisiones de consolidación (sí/no) y que la
  acción irreversible quede sobria, no como acción normal.
- `relaciones`: que no compitan demasiados CTAs del mismo peso.
- `perfil-edicion`: feedback de guardado y errores por campo (spec 015) legibles.

Si algo concreto se ve mal, indicar página + ancho + qué falla y se corrige
dirigido.

## Reglas aplicadas

CSS/JS mínimos, sin librerías, sin `!important` nuevo, sin tocar lógica de
negocio (solo textos mostrados + un copy de botón). Reutiliza el sistema de 017.

## SQL de migración

No aplica.

## Criterios de aceptación

- [x] Existe `specs/022-pulido-formularios-ctas.md`.
- [x] No se modifica Supabase ni se crean migraciones; no se toca `package.json`/`.env`.
- [x] No se muestran errores técnicos crudos al usuario (login, registro,
  contacto, perfil-edicion, perfil-maestro, perfil-discipulo).
- [x] Botones con estado loading + `disabled` que evita doble envío (verificado).
- [x] `registro.html` CTA principal claro ("Crear cuenta"; bug de restauración
  corregido).
- [x] `login.html` CTA principal claro ("Entrar en Aurea").
- [x] `perfil-edicion.html` guarda con feedback claro ("Perfil actualizado").
- [x] `perfil-maestro.html` destaca "Solicitar aprendizaje" (sin cambios; ya OK).
- [x] `solicitudes.html` separa aceptar / **No aceptar** (etiqueta clara, no icono).
- [x] `contacto.html` distingue envío real (mensaje de éxito) de widgets simulados.
- [x] Labels visibles; placeholders no son el único label (formularios existentes).
- [ ] Revisión visual de autenticadas en 375/430/768/1024/1440 (pendiente: sesión
  o verificación del humano).
