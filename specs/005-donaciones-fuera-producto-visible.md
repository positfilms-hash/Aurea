# Spec 005 — Mantener `dona.html` fuera del producto visible

**Nombre:** Retirar donaciones del producto visible hasta que exista una propuesta cerrada.
**Estado:** en desarrollo
**Autor:** ChatGPT (spec) · Claude (implementación)
**Migración asociada:** ninguna (solo frontend).

---

## Qué hace

Evita que Aurea muestre una funcionalidad de donaciones que aún no está lista.
`dona.html` se conserva para trabajo futuro, pero se elimina cualquier acceso
visible desde navegación, footer y CTAs. Quien entre por URL directa ve un
mensaje claro de que las donaciones aún no están disponibles.

---

## Páginas que toca

- `aurea-prototipo/aurea/dona.html` — reescrita como página sobria y honesta.
- `aurea-prototipo/aurea/js/components.js` — se quitan los enlaces a `dona.html`
  del nav público, el nav autenticado y el footer.

`index.html`, `como-funciona.html` y `contacto.html` no tenían enlaces propios
a donaciones: heredaban el enlace desde el nav/footer compartido, así que se
limpian automáticamente al tocar `components.js`.

---

## Tablas de Supabase que toca

Ninguna. No toca tablas, columnas, RLS, triggers, Storage ni migraciones.

---

## Qué se cambió exactamente

### `dona.html` (reescrita)
- Página sobria: titular *"Las donaciones aún no están disponibles"*, texto
  breve y honesto, y dos botones seguros: **Volver al inicio** (`index.html`) y
  **Contacto** (`contacto.html`).
- Se eliminan: selector de importes, frecuencia, métodos de pago
  (Tarjeta/PayPal/Bizum), botón "Donar ahora", modales de Bizum/éxito y toda la
  lógica de pagos (`PAGOS`, `donar()`, Stripe/PayPal links, etc.).
- Se añade `<meta name="robots" content="noindex, nofollow">`.
- Mantiene nav y footer estándar (sin enlace a donaciones) para coherencia.

### `components.js`
- `renderNavPublic`: eliminado `{id:'dona', label:'Dona', href:'dona.html'}`.
- `renderNavAuth`: eliminado el mismo item del array de páginas.
- `renderFooter`: el enlace "Dona" de la columna *Proyecto* se sustituye por
  "Cómo funciona" (para no dejar la columna coja) + se mantiene "Contacto".

---

## Decisión de producto

Las donaciones no forman parte del lanzamiento estable: no hay flujo de pagos,
ni decisión sobre importe/recurrencia/fiscalidad/destino. Mostrarlas antes de
tiempo resta confianza. La página no se elimina para poder recuperarla cuando
exista una spec específica de donaciones.

---

## Flujo de usuario

- **Navegando por Aurea:** no ve enlaces ni CTAs de donar; la experiencia se
  centra en maestros, discípulos, solicitudes y relaciones.
- **Entrando directo a `/dona.html`:** ve un mensaje claro de que aún no está
  disponible, sin formularios de pago, y puede volver al inicio o ir a contacto.

---

## Riesgos

- Una página de donación incompleta dañaría la confianza → resuelto (sobria y honesta).
- Si apareciera en navegación parecería activa → enlaces eliminados.
- Indexación de una página no lista → `noindex, nofollow`.
- Borrar el archivo perdería trabajo futuro → se conserva.
- Añadir pagos sin spec abriría zona sensible (fiscalidad, soporte) → no se hace.

---

## Criterios de aceptación

- [x] Existe `specs/005-donaciones-fuera-producto-visible.md`.
- [x] `dona.html` sigue existiendo.
- [x] `dona.html` no contiene botones de pago activos.
- [x] `dona.html` no contiene formularios de donación.
- [x] `dona.html` no promete procesamiento de donaciones.
- [x] `dona.html` comunica claramente que las donaciones aún no están disponibles.
- [x] `dona.html` incluye enlace al inicio.
- [x] `dona.html` incluye enlace a contacto.
- [x] `dona.html` incluye `<meta name="robots" content="noindex, nofollow">`.
- [x] No hay enlaces visibles a `dona.html` en navegación principal (público y auth).
- [x] No hay enlaces visibles a `dona.html` en footer.
- [x] No hay CTAs de "donar" en páginas públicas.
- [x] No se crean tablas, no se modifica Supabase, no se crean migraciones.
- [x] No se toca `package.json` ni `.env`.
- [x] El cambio es reversible cuando exista una spec específica de donaciones.

---

## Notas / fuera de alcance

- `privacidad.html` menciona en su texto legal que *"los pagos de donaciones se
  gestionan a través de proveedores certificados (Stripe, PayPal, Bizum)"*. No
  es un enlace ni un CTA a `dona.html`, así que queda fuera de los criterios de
  esta spec, pero conviene revisarlo en la futura spec de donaciones (o quitarlo
  si se quiere coherencia total mientras las donaciones estén ocultas).
