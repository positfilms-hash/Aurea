# Spec 043: Discover personalizado sin IA

**Estado:** en desarrollo
**Fecha:** 2026-06-12
**Autor:** ChatGPT (spec) + Codex (preflight y prompt operativo)

---

## Qué hace

Convierte el discover de "todos los maestros" en una experiencia orientada según
sesión, rol, categorías de interés y señales disponibles — con lógica **local,
simple y explicable**. Sin IA, sin ranking público, sin popularidad, sin
favoritos públicos y sin tocar Supabase.

## Páginas que toca

- `aurea-prototipo/aurea/discover.html` — el discover real (aclaración del
  preflight de Codex: la spec decía `index.html`, pero el listado vive aquí):
  - **Cabecera contextual** según sesión/rol (anónimo / discípulo / maestro /
    ambos) con la explicación discreta de cómo se ordena lo que se ve.
  - **Secciones personalizadas** (solo sin filtros activos): **Para ti** (si hay
    datos suficientes; si no, invitación al test de intención), **Aceptan
    solicitudes ahora**, **Guardados por ti** (solo con favoritos propios,
    spec 037) y **Explorar por categoría** (canónicas de `categorias.js`).
  - El listado completo paginado se mantiene debajo, intacto.
- `aurea-prototipo/aurea/index.html` — solo el fix bloqueante del preflight: el
  maestro destacado nunca es el propio usuario (`m.id !== session.user.id`).

Sin cambios en Supabase, migraciones, `package.json` ni `.env`.

## Personalización (local, explicable, efímera)

**Fuentes** (cero queries nuevas por card):
- Perfil de discípulo (1 query si hay sesión con rol discípulo/ambos):
  `categoria`/`subcategoria` de interés.
- Resultado del test de intención (spec 038) desde `sessionStorage`, validado;
  no se guarda en Supabase.
- Filtros manuales (búsqueda/categoría/subcategoría/URL): **tienen prioridad** —
  con filtros activos las secciones desaparecen y manda el flujo clásico
  (specs 024/026), incluida la categoría inválida por URL (ya se ignora sin
  romper).

**Score interno** (solo para ordenar lo ya cargado; no se muestra ni se guarda):
+3 categoría de interés · +2 subcategoría · +2 abierta · +1 limitada ·
−3 pausada · +1 ritmo definido · +1 formato definido · +1 perfil con datos
suficientes. Empates conservan el orden previo. **No** usa favoritos ni
reputación como factores.

**Regla obligatoria:** el propio usuario queda excluido de `ALL` al cargar
(secciones, listado y CTA de solicitarse a sí mismo) y del destacado de la home.

## Lo que NO hace (guardarraíles del preflight)

- No usa favoritos como señal pública ni muestra conteos (`fetchFavoritos` solo
  alimenta "Guardados por ti", construida desde la carga actual — sin queries
  nuevas).
- No llama "modalidad económica" a `formato` (no existe precio en el producto).
- No refuerza la reputación como ranking (el orden por reputación del listado
  clásico queda como estaba; las secciones usan el score explicable).
- No hace consultas por card (trayectoria/reseñas/consolidaciones quedan fuera
  del score en esta primera versión, como permite el preflight).
- Cards intactas: se reutilizan `mapMaestro()`/`cardHTML()` (máx. 3 señales,
  Ver perfil, Guardar/Solicitar solo cuando aplica).

## Criterios de aceptación

- [x] Existe `specs/043-discover-personalizado-sin-ia.md`.
- [x] Sin Supabase/migraciones/package.json/.env.
- [x] Cabecera contextual por sesión/rol.
- [x] "Para ti" si hay datos suficientes (y CTA al test si no los hay).
- [x] "Aceptan solicitudes ahora" · "Guardados por ti" (solo con favoritos) ·
      "Explorar por categoría".
- [x] Lógica sin IA, simple; score no visible y no persistido; sin rankings.
- [x] Sin favoritos públicos ni conteos; sin solicitudes/mensajes/decisiones.
- [x] El propio usuario nunca aparece como candidato (discover + home).
- [x] Filtros manuales priorizan; categoría inválida por URL no rompe.
- [x] Estados vacíos claros (limpiar filtros, test de intención).
- [x] Móvil y desktop; sin scroll horizontal; sin errores técnicos crudos.

## Notas / riesgos

- "Guardados por ti" solo muestra favoritos presentes en la carga actual del
  listado (limitación aceptada en el preflight; favoritos cuyo maestro ya no
  aparece en discover no se listan aquí — siguen en Mi cuenta).
- "Para ti" requiere sesión con rol discípulo/ambos y alguna categoría de
  interés (perfil o test); para anónimos la cabecera y las secciones generales
  cumplen la guía.
- El bloque de categorías omite `Otra` como recomendación (sigue disponible en
  el selector lateral), según la spec.
