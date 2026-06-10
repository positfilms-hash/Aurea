# Spec 031 — Revisión humana de navegación, cuenta y estilo visual

**Nombre:** Aplicar revisión humana de navegación, cuenta y estilo visual.

**Estado:** borrador

## Alcance (acordado con el humano)

La 031 original incluía 6 puntos, uno de ellos el **cambio de tema visual a claro**
en toda la web. Se acordó **separar ese punto**: el tema claro global + textura va
en una spec aparte (**032**). Esta spec 031 implementa los **5 cambios de
comportamiento/UX** restantes. No toca Supabase, `package.json` ni `.env`.

## 1. Mensajes y notificaciones en una sola entrada ("Actividad")

- Se elimina el enlace suelto **"Mensajes"** de la nav superior autenticada.
- La campana 🔔 pasa a ser **"Actividad"**: su desplegable muestra un enlace
  "💬 Ver mensajes" (→ `mensajes.html`) + la lista de notificaciones. Cabecera y
  `aria-label` = "Actividad".
- La barra inferior móvil renombra el tab "Mensajes" → **"Actividad"** (sigue a
  `mensajes.html`, conserva el badge).
- **Badge único de actividad pendiente:** `notif.js` cuenta `notificaciones` no
  leídas (spec 013) y pinta el mismo número en la campana y en el tab móvil
  (consistente, no contradictorio). No hay badges en competencia.

## 3. "Mi cuenta" muestra el perfil; editar pasa a "Ajustes de cuenta"

- `perfil.html` ya muestra el perfil directamente. Se cambia el CTA principal de
  la tarjeta "Perfil público" de **"Editar perfil"** → **"Ajustes de cuenta"**
  (→ `perfil-edicion.html`). El item del desplegable del nav también pasa a
  "Ajustes de cuenta". Las ediciones siguen en `perfil-edicion.html`.

## 4. Impedir solicitarse a uno mismo

- En `perfil-maestro.html`, si el perfil cargado es el del usuario autenticado:
  se ocultan "Enviar solicitud" y "Lista de espera" y se muestra **"Ver mi
  cuenta"** (→ `perfil.html`).
- **Defensa real:** `sendSol()` rechaza el envío si `session.user.id === maestro_id`,
  aunque se manipule el front.
- **⚠️ Aviso de BD:** la tabla `solicitudes` (migración 001) tiene índice único
  `(discipulo_id, maestro_id)` pero **no** tiene `check (discipulo_id <> maestro_id)`:
  **la BD permite solicitudes a uno mismo**. La 031 no añade migración; queda como
  riesgo para una migración futura.

## 5. El cambio de rol cambia el contexto de navegación

- `cambiarRolNav` (toggle de rol del header, usuarios "ambos") ahora, además de
  actualizar tema/labels, **navega al contexto del rol** cuando no estás en
  `perfil.html`: discípulo → `discover.html`, maestro → `solicitudes.html`. En
  `perfil.html` el cambio es **en sitio** (`setRole` ya reconstruye la vista) y no
  se navega.
- **Ya estaba implementado** (sin cambios): `perfil-edicion.guardar()` redirige a
  `perfil.html` con feedback "✓ Perfil actualizado" tras guardar.
- Nota de modelo: no se sobrescribe `localStorage.aurea-rol` (sigue siendo el rol
  de cuenta, p. ej. "ambos"); la vista activa persiste por `aurea-tema` (mecanismo
  existente), por lo que el contexto al aterrizar es coherente. La 032 (tema)
  revisará este acoplamiento.

## 6. `como-funciona.html` más compacta

- Se sustituyen las **3 secciones gigantes** de dos columnas (mucho scroll) por un
  **grid compacto de 6 pasos** (1. crea perfil · 2. encuentra persona · 3. envía
  solicitud · 4. empieza la prueba · 5. sobre cerrado · 6. consolidar/cerrar), con
  copy escueto.
- Desktop: 3 columnas (2 filas). Móvil: 1 columna, tarjetas en fila (número +
  texto), padding reducido. Se añade responsive a hero, secciones "diferente",
  CTA y estadísticas (clase `.cf-stats`). Sin lenguaje de cursos. CTA final intacto.

## Checks

- `npm.cmd run build`: OK.
- `git diff --check`: limpio.
- No hay script de test configurado.
- Preview: nav autenticado sin "Mensajes" suelto, desplegable "Actividad" con "Ver
  mensajes", tab móvil "Actividad"; como-funciona con 6 pasos, 3 col desktop / 1 col
  móvil, **0 scroll horizontal** a 1440 y 375, página mucho más corta;
  `perfil-maestro` (anónimo, no propio) muestra "Enviar solicitud" y oculta "Ver mi
  cuenta", sin errores de consola. Los flujos con sesión (CTA "Ajustes de cuenta",
  perfil propio del maestro, navegación al cambiar rol) se revisan logueado.

## Riesgos

- **BD permite auto-solicitud** (sin `check (discipulo_id <> maestro_id)`): el guard
  es de frontend; conviene una migración futura.
- Items dependientes de sesión no testeables en preview anónimo (revisar logueado).
- La nav superior de páginas **públicas** queda algo apretada en móvil (pre-existente,
  sin scroll horizontal); buen momento para pulirla en la 032.

## Refinamientos (revisión humana + Codex, misma rama)

- **Nav:** el botón de notificaciones muestra el texto **"Notificaciones"** (en vez
  del emoji 🔔); su desplegable conserva "Ver mensajes" + lista. `toggleRelDd`
  ahora cierra también el desplegable de notificaciones (simetría; hallazgo Codex).
- **Mi cuenta (`perfil.html`)** se simplifica: se elimina el botón duplicado
  "Editar perfil", los enlaces "Ver perfil de maestro/discípulo" (ya están en la
  barra lateral), la tarjeta "Sesión", y las tarjetas "Seguridad" y "Zona
  peligrosa" (no deben aparecer en Mi cuenta). Queda: perfil + "Perfil público"
  (CTA "Ajustes de cuenta") + "Rol y apariencia" + "Cuenta".
- **Ajustes de cuenta (`perfil-edicion.html`)** organiza todo en apartados de la
  barra lateral: Perfil · Trayectoria · Requisitos · **Seguridad** (cambiar
  contraseña, movido desde Mi cuenta) · **Cuenta** (zona peligrosa / eliminar
  cuenta, ya existente). `?tab=seguridad` válido.

## SQL de migración

No aplica.

## Criterios de aceptación

- [x] Existe `specs/031-revision-humana-navegacion-cuenta-estilo.md`.
- [x] No se modifica Supabase; no migraciones; no `package.json`/`.env`.
- [x] Mensajes y notificaciones agrupados en una entrada ("Actividad"); sin badges duplicados/contradictorios.
- [x] "Mi cuenta" muestra el perfil; no usa "Editar perfil" como CTA principal; existe "Ajustes de cuenta"; las ediciones viven ahí.
- [x] Un usuario no ve ni puede enviar "Solicitar aprendizaje" a su propio perfil; hay CTA alternativo; se avisa del hueco en BD.
- [x] El cambio de rol en header cambia el contexto; en Mi cuenta cambia la vista; tras guardar ajustes se abre el perfil actualizado.
- [x] `como-funciona.html` reduce scroll en desktop, formato compacto, más escueta en móvil, sin perder el flujo ni el CTA.
- [x] No se rompe navegación móvil; sin scroll horizontal (1440/375 verificados).
- [ ] El tema visual claro + textura (punto 2 original) → diferido a la spec 032.
