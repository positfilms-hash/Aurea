# Spec 030 — Legal, privacidad y cookies mínimo producción

**Nombre:** Preparar textos legales, privacidad y gestión básica de cookies para producción.

**Estado:** borrador

## Qué hace

Deja Aurea técnicamente preparada para producción con una base legal mínima y
**honesta**: política de privacidad actualizada, política de cookies, aviso legal,
enlaces legales en el footer y consentimiento de privacidad en el registro. No
sustituye una revisión legal profesional. No toca Supabase, `package.json` ni `.env`.

## Auditoría previa (resultados)

- **No hay analítica, ads, pixel ni tracking** en el código (el único match de la
  búsqueda era `loadStats()` → falso positivo de "ads"). → **No se añade banner de
  cookies**; solo política clara (la spec lo exige así).
- **No hay cookies propias** (`document.cookie` no se usa). La sesión la guarda
  Supabase en `localStorage`.
- **Claves reales de `localStorage`:** `aurea-rol`, `aurea-tema`,
  `aurea-chat-corner` (todas técnicas/preferencias, no sensibles).
  (`aurea-notificaciones` no es localStorage: es el nombre de un canal realtime.)
- **NSFWJS** se ejecuta en el navegador (`window.nsfwjs.load()`); la imagen no se
  envía a terceros para moderar → se afirma así, sin inventar transferencia.

## Archivos

- **`privacidad.html`** (reescrita): privacidad-only honesta y completa. Se retiran
  afirmaciones falsas previas ("datos agregados y anónimos", cookie "Analítica
  desactivable", "cumple con el RGPD" absoluto, email inventado `privacidad@aurea.app`).
  Cubre: qué es Aurea, responsable (pendiente), datos tratados, finalidades, base
  jurídica orientativa, terceros (Supabase, Vercel, EmailJS, NSFWJS), transferencias
  internacionales, conservación, derechos y cómo ejercerlos, eliminación de cuenta,
  seguridad, almacenamiento local, fecha de última actualización. Marcadores
  `[PENDIENTE HUMANO]` visibles.
- **`cookies.html`** (nueva): cookies/tecnologías similares, qué usa Aurea (solo
  técnico/preferencias), las 3 claves de `localStorage`, sesión de Supabase,
  categorías (técnico/preferencias/analítica/marketing) marcando lo que **no** se
  usa, "Aurea no utiliza cookies de publicidad ni marketing", sin banner, fecha.
- **`aviso-legal.html`** (nueva): titular (pendiente), condiciones de uso,
  conducta, propiedad intelectual, responsabilidad sobre contenidos de usuarios,
  privacidad/cookies, ley aplicable orientativa, fecha. Marcadores `[PENDIENTE HUMANO]`.
- **`js/components.js`**: footer global con enlaces **Privacidad / Cookies / Aviso
  legal / Contacto**; y se elimina "Inicio" de `renderNavPublic` (el logo ya va a
  inicio; se solapaba con el logo en el header móvil — petición del humano).
- **Footer inline** (`page-footer-bar`) actualizado en `discover`, `solicitudes`,
  `relaciones`, `perfil-maestro`, `perfil-edicion`, `mensajes` con los 4 enlaces.
- **`registro.html`**: en el paso 2, "Al crear tu cuenta confirmas que has leído la
  política de privacidad." (enlace visible). Sin casilla premarcada, sin mezclar cookies.
- **`contacto.html`**: se retiran las promesas de "24–48 horas"; nota sobria de que
  los datos se usan solo para responder al mensaje + enlace a privacidad.
- **`css/global.css`**: `.nav-links { min-width: 0 }` en móvil para que la nav
  pública quepa en 375 px (corrige un overflow pre-existente; verificado forzando
  el nav a 375 px: los hijos caben y los enlaces hacen scroll interno).

No se toca `vite.config.js` (auto-descubre los `.html`). No se enlaza `dona.html`.

## Datos legales pendientes del humano

`[PENDIENTE HUMANO: responsable legal]`, `[NIF/CIF]`, `[domicilio]`,
`[email de privacidad]`, `[base legal final revisada]`. Quedan **visibles** en
`privacidad.html` y `aviso-legal.html`. Como contacto real se usa el que ya está en
el repo: `info.aureacatena@gmail.com`. No se inventa razón social; no se usa
"Posit Films" como responsable.

## Cookies / banner

No se añade banner: solo hay almacenamiento técnico/preferencias. Si en el futuro se
añaden tecnologías no necesarias, habrá que implementar banner con
aceptar/rechazar/configurar (equivalentes, sin premarcado) y no cargar scripts antes
del consentimiento.

## Checks

- `npm.cmd run build`: OK (las 2 páginas nuevas compilan; avisos de `scale.js`/
  `components.js` "without type=module" son los habituales de todas las páginas).
- `git diff --check`: limpio (solo LF→CRLF).
- No hay script de test configurado.
- Preview: footer con los 4 enlaces correctos; nav público sin "Inicio"; cookies
  lista las 3 claves y "no publicidad ni marketing"; privacidad menciona
  Supabase/Vercel/EmailJS/NSFWJS-cliente y elimina las afirmaciones falsas;
  registro con consentimiento (sin cookies); contacto sin "24–48 h" + nota de datos;
  contenido legal sin overflow a 375 y 1440; nav público cabe en 375 con el fix;
  sin errores de consola.

## SQL de migración

No aplica.

## Riesgos pendientes

- **La versión legal final debe revisarla un profesional antes de producción.** Los
  textos son una base honesta, no asesoramiento jurídico, y no afirman cumplimiento total.
- Faltan los **datos del responsable legal** (`[PENDIENTE HUMANO]`): hay que
  rellenarlos antes de publicar.
- Si en el futuro se añade analítica/marketing, hará falta banner de consentimiento
  (esta spec deja la política preparada pero sin banner por no haber tracking).
- El overflow del nav público a 375 era **pre-existente**; se corrigió con
  `min-width:0`. La emulación del preview mide el `position:fixed` contra la ventana
  real (~495 px), por eso conviene una comprobación en móvil real.

## Criterios de aceptación

- [x] Existe `specs/030-legal-privacidad-cookies-minimo-produccion.md`.
- [x] No se modifica Supabase; no migraciones; no `package.json`/`.env`.
- [x] `privacidad.html` actualizada; `cookies.html` y `aviso-legal.html` creadas.
- [x] Footer enlaza a privacidad, cookies, aviso legal y contacto; no enlaza `dona.html`.
- [x] No se inventa responsable legal; pendientes marcados visiblemente.
- [x] Privacidad menciona Supabase, Vercel, EmailJS y NSFWJS; explica datos, fines, derechos y contacto.
- [x] Cookies documenta `aurea-rol` y `aurea-tema` (y `aurea-chat-corner`).
- [x] Auditoría de analítica/ads/tracking hecha; sin cookies no necesarias → sin banner.
- [x] Registro enlaza a privacidad de forma visible y no mezcla cookies.
- [x] Contacto no promete incidencia ni tiempos de respuesta.
- [x] Textos legales con fecha de última actualización; legibles en móvil y escritorio (375/1440 verificados).
- [x] En riesgos: la versión final debe revisarla el humano antes de producción.
