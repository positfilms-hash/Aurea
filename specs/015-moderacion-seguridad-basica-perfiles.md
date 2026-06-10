# Spec 015 — Moderación y seguridad básica de perfiles

**Nombre:** Añadir validaciones y seguridad básica en perfiles públicos.

**Estado:** borrador

## Qué hace

Endurece la edición y visualización de perfiles para evitar perfiles rotos,
vacíos, ofensivos de forma obvia o claramente spam.

La spec cubre textos públicos, categorías, subcategorías, avatar y renderizado
seguro del contenido. No implementa moderación automática avanzada ni revisión
humana. El objetivo es que los perfiles de maestro y discípulo sean
suficientemente fiables para producción estable.

## Páginas que toca

Directamente:

- `perfil-edicion.html`
- `perfil.html`
- `perfil-maestro.html`
- `perfil-discipulo.html`

Además (muestran extractos de perfil → mismo riesgo de XSS):

- `discover.html` (tarjetas con nombre / disciplina / hashtags de maestros)
- `relaciones.html` (nombre / disciplina; además inyección en `onclick`)
- `mensajes.html` (nombre / disciplina / preview)

Archivos JS:

- `aurea-prototipo/aurea/js/categorias.js` (widget de hashtags)

`solicitudes.html` ya escapaba con `escHtml`; no se toca.

## Tablas de Supabase que toca

Lee y escribe mediante flujos existentes: `profiles`, `maestro_perfiles`,
`discipulo_perfiles`, `trayectoria`. Lee `resenas` en el perfil público de maestro.

**No modifica** estructura, columnas, RLS, triggers, Storage ni migraciones.

## Decisión de producto

Un perfil público no debe poder quedar como basura visible. Aurea permite
perfiles humanos, imperfectos y en construcción, pero no publica: textos vacíos
en campos esenciales, textos extremadamente largos, HTML o scripts renderizados,
enlaces repetidos o spam evidente, categorías inválidas, avatares no moderados,
ni imágenes demasiado pesadas o de tipo no permitido.

## Reglas de validación

### Texto

Campos públicos: recortan espacios, longitud mínima si son esenciales, longitud
máxima razonable, y se renderizan como texto, nunca como HTML inyectado.

Límites aplicados (adaptados a los campos reales):

```text
Nombre:                 2–60   (esencial, obligatorio)
Apellido:               0–60
Ubicación:              0–80
Frase / bio:            0–600
Disciplina (maestro):   0–80
Disciplina (discípulo): 0–80
Días / horas:           0–60
Trayectoria · periodo:  0–40
Trayectoria · título:   1–120  (obligatorio si la entrada tiene contenido)
Trayectoria · descr.:   0–400
Requisitos libres:      ≤200 por línea, ≤12 líneas
```

### HTML / XSS

El contenido de usuario nunca se inserta con `innerHTML` sin escapar. Se usa el
helper `escHtml()` (ya existente en `components.js`) o `textContent`. En
`categorias.js` se añade un escape local porque es un módulo ES independiente.
No se permite guardar ni mostrar scripts, iframes ni HTML activo.

### URLs y spam

- No se permite `javascript:` en ningún campo de texto.
- No se permiten URLs repetidas (misma URL ≥2 veces) en campos descriptivos.
- No se permiten campos compuestos casi solo por enlaces.
- No hay campos de URL específicos en el perfil, así que no se valida `https://`
  por campo.

### Categorías y subcategorías

La categoría debe pertenecer a la lista canónica de `categorias.js` más `Otra`:

```text
Filosofía · Artes · Oficios · Deportes · Negocios · Salud · Relaciones ·
Tecnología · Aprendizaje · Espiritualidad · Estilo de vida · Otra
```

- No se permiten categorías fuera de la lista.
- Al cambiar la categoría, la subcategoría incompatible se limpia
  (`poblarSub` ya repuebla el select; además se guarda `null` si la subcategoría
  no pertenece a la categoría).
- Los hashtags ya no se duplican (lógica existente en `initHashtags`).

### Avatar

Se mantiene la moderación NSFWJS existente. Se añade validación explícita de
tipo (`image/jpeg`, `image/png`, `image/webp`) sobre `file.type`, además del
atributo `accept`.

Sobre el tamaño: la spec 003 fija **a propósito** el check del archivo original
en 5 MB, porque el blob se redimensiona a 400 px / JPEG (muy por debajo de 1 MB)
y el límite de 1 MB es del bucket `avatars` sobre el blob ya subido. Por tanto la
imagen almacenada **siempre respeta ≤1 MB** sin necesidad de bajar el gate del
original a 1 MB (lo que rechazaría fotos legítimas de móvil de 3–8 MB). Se
mantiene el comportamiento de la spec 003.

Mensaje de error si falla moderación/validación, sin detalles técnicos:

```text
No hemos podido usar esta imagen. Prueba con otra foto clara y adecuada.
```

## Comportamiento en edición de perfil

La edición valida antes de guardar. Si hay errores: se marca el campo concreto,
se explica el problema en lenguaje humano, no se borra lo escrito, no se guarda
parcialmente y se cambia a la pestaña del primer error.

## Comportamiento en perfiles públicos

Los perfiles públicos son robustos aunque falten datos: no muestran bloques
vacíos, no rompen layout con textos largos, no renderizan HTML de usuario, no
muestran errores técnicos y no exponen historial privado del discípulo.

## SQL de migración

No aplica. No se crean migraciones en esta spec. Si se detectara que la base de
datos permite guardar contenido peligroso no mitigable en frontend, se propondría
una spec separada de constraints/RLS antes de tocar Supabase.

## Riesgos

- Validación solo en frontend: un cliente técnico podría saltarse reglas (la
  capa de seguridad real frente a XSS es el escape en render, que sí se aplica).
- Endurecer demasiado puede frustrar a usuarios reales completando su perfil.
- Bloquear URLs legítimas podría restar contexto a algún maestro.
- `discover.html` no estaba en la lista literal de la spec, pero es la principal
  superficie pública con extractos de perfil; se incluye por ser el mismo riesgo.

## Criterios de aceptación

- [x] Existe `specs/015-moderacion-seguridad-basica-perfiles.md`.
- [x] `perfil-edicion.html` valida campos públicos antes de guardar.
- [x] Los campos esenciales no aceptan textos vacíos o demasiado cortos.
- [x] Los campos públicos tienen límites máximos razonables.
- [x] Los errores se muestran junto al campo correspondiente.
- [x] Los errores no borran el contenido escrito por el usuario.
- [x] El contenido de usuario se renderiza como texto, no como HTML activo.
- [x] No hay uso inseguro de `innerHTML` con contenido de usuario.
- [x] No se permite `javascript:` en enlaces guardados o mostrados.
- [x] Se evita spam obvio de enlaces repetidos.
- [x] Las categorías se validan contra la lista canónica.
- [x] Las subcategorías incompatibles se limpian o bloquean al cambiar categoría.
- [x] No se permiten hashtags/subcategorías duplicadas.
- [x] La subida de avatar mantiene NSFWJS.
- [x] La subida de avatar respeta tipos JPG, PNG y WEBP.
- [x] La subida de avatar respeta tamaño máximo de 1 MB (en el blob almacenado).
- [x] Los perfiles públicos no muestran bloques vacíos.
- [x] Los perfiles públicos no rompen layout con textos largos.
- [x] `perfil-discipulo.html` no expone historial privado.
- [x] No se añade moderación externa.
- [x] No se crean tablas nuevas.
- [x] No se modifica Supabase.
- [x] No se crean migraciones.
- [x] No se toca `package.json`.
- [x] No se toca `.env`.
- [x] La UI funciona en móvil y escritorio.
