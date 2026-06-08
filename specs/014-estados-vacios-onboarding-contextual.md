# Spec 014 — Estados vacíos y onboarding contextual

**Nombre:** Añadir estados vacíos y onboarding contextual en pantallas clave.
**Estado:** en desarrollo
**Autor:** ChatGPT (spec) · Claude (implementación)
**Migración asociada:** ninguna (solo frontend).

> **Numeración:** spec 014 (la última era 013). Sin migración.

---

## Qué hace

Convierte las pantallas autenticadas vacías en estados útiles que explican qué
pasa, por qué está vacío y cuál es el siguiente paso. No toca backend ni datos.

---

## Pieza compartida

`components.js` → `renderEmptyState({ icon, title, body, ctaLabel, ctaHref,
secLabel, secHref })`: estado vacío reutilizable con **un CTA principal** y un
enlace secundario opcional. Texto escapado. Estilos `.empty-state*` en
`global.css`. Así el copy y el aspecto son coherentes en todas las páginas.

---

## Qué se hizo por página

- **`solicitudes.html`** (recibidas por el maestro): vacío real → "Aún no has
  recibido solicitudes" + CTA "Mejorar perfil de maestro". Filtro sin resultados
  → mensaje simple. Error → estado amable. Caso "no eres maestro" → explica la
  sección + CTA "Explorar maestros" / enlace "Editar perfil".
- **`relaciones.html`**: vacío real → "Todavía no tienes relaciones de
  aprendizaje" + CTA "Explorar maestros" / enlace "Ver solicitudes". Se
  distingue **error de carga** (flag `_relError`) de ausencia de relaciones.
  Filtro sin resultados → mensaje simple.
- **`periodo-prueba.html`**: si no hay relación seleccionada/válida ya **no se
  redirige en silencio**; se muestra "No hay un periodo de prueba activo
  seleccionado" + CTA "Ver relaciones".
- **`mensajes.html`**: se distingue **error** de **sin conversaciones**; el vacío
  dice "Todavía no tienes conversaciones" + enlace "Ver relaciones".
- **`perfil.html`**: si el perfil está incompleto (sin frase) se antepone un
  banner "Tu perfil aún está incompleto" + CTA "Completar perfil".
- **`perfil-maestro.html`**: si no hay trayectoria → "Este maestro aún está
  completando su perfil" (en vez de datos de ejemplo); si no hay reseñas → "Este
  maestro aún no tiene reseñas" (antes se quedaban reseñas demo hardcodeadas).
- **`perfil-discipulo.html`**: si no hay frase → "Este discípulo aún está
  completando su perfil". (Ya no exponía historial privado — spec 011.)
- **`historia.html`**: ya tenía estado vacío ("Todavía no tienes historial…" +
  CTA "Explorar maestros") y de error desde la spec 011. Sin cambios.

---

## Reglas de UX aplicadas

- Cada estado vacío: máximo un CTA principal (+ enlace secundario opcional).
- Se distingue **cargando / vacío / error**; no se muestra "vacío" antes de
  terminar la consulta; los errores de Supabase no se muestran crudos.
- CTAs solo a páginas existentes (`perfil-edicion`, `solicitudes`, `relaciones`,
  `discover`, `mensajes`). No se crean rutas nuevas.
- Tono sobrio y humano, coherente con Aurea (no "no hay items").

---

## Criterios de aceptación

- [x] Existe `specs/014-estados-vacios-onboarding-contextual.md`.
- [x] `perfil.html` muestra estado útil si el perfil está incompleto + CTA a edición.
- [x] `solicitudes.html` no muestra listas vacías sin explicación; distingue casos.
- [x] `relaciones.html` muestra estado vacío útil y distingue error de ausencia.
- [x] `periodo-prueba.html` explica qué ocurre si no hay periodo activo.
- [x] `mensajes.html` explica sin conversaciones y distingue error.
- [x] `historia.html` tiene estado vacío útil y distingue error (spec 011).
- [x] `perfil-maestro.html` no muestra bloques rotos ni reseñas demo; estado honesto sin reseñas.
- [x] `perfil-discipulo.html` no muestra historial privado; nota si falta perfil.
- [x] Cada estado vacío tiene máximo un CTA principal; los CTAs llevan a páginas existentes.
- [x] No se crean páginas, no se modifica Supabase, no hay migraciones.
- [x] No se toca `package.json` ni `.env`.

---

## Notas / fuera de alcance

- `solicitudes.html` muestra las solicitudes **recibidas** (vista de maestro). Las
  solicitudes **enviadas** por el discípulo se ven en `historia.html` (spec 011),
  por eso el caso "discípulo sin solicitudes enviadas" se cubre allí, no aquí.
- `perfil-edicion.html` ya tiene una nota de onboarding en su sidebar ("Los
  cambios no se publican hasta que pulses Guardar cambios"); no se añadió más para
  no recargar la pantalla de edición.
- El caso "conversación seleccionada sin mensajes" lo cubre `periodo-prueba.html`
  (chat), que ya muestra "Aún no hay mensajes. Empieza la conversación".
