# Spec 042: Señales de confianza en perfiles

**Estado:** en desarrollo
**Fecha:** 2026-06-12
**Autor:** ChatGPT (spec) + Codex (prompt operativo)

---

## Qué hace

Añade señales honestas, compactas y derivadas **solo de datos reales** sobre la
calidad/completitud de los perfiles. Sin rankings, sin verificación falsa, sin
métricas privadas y sin popularidad. El objetivo: que el usuario entienda si un
perfil está cuidado y preparado para una relación de aprendizaje seria.

**No toca Supabase** (solo lecturas ya existentes en cada página), ni
migraciones, ni `package.json`, ni `.env`. Sin queries nuevas.

## Páginas que toca

- `aurea-prototipo/aurea/perfil-maestro.html` — bloque **"Señales de confianza"**
  al inicio de la columna derecha (debajo de la cabecera, encima de la
  propuesta). Etiquetas posibles, todas derivadas de datos ya cargados:
  - **Perfil completo**: nombre + categoría real (≠ `Otra`) + disciplina real
    (≠ `Sin especificar`) + disponibilidad/ritmo (spec 036) + trayectoria o
    `experiencia_anos`.
  - **Acepta solicitudes / Disponibilidad limitada / No acepta solicitudes
    ahora**: de `disponibilidad_estado` (fallback `acepta_solicitudes`), igual
    que el resto de la página.
  - **Ritmo …**: de `ritmo_preferido` (solo si existe).
  - **Online / Presencial / Online o presencial / Modalidad a acordar**: de
    `formato` (solo si existe).
  - **Trayectoria añadida**: si hay filas reales en `trayectoria`.
  - **Reseñas de relaciones consolidadas**: si hay reseñas reales (las reseñas
    nacen de relaciones consolidadas por diseño del modelo).
- `aurea-prototipo/aurea/perfil-discipulo.html` — bloque **"Señales de
  claridad"** (claridad de intención, no historial): **Intención clara**
  (`disciplina_buscada`), **Intereses definidos** (categoría real o hashtags),
  **Forma de aprender descrita** (frase pública o disponibilidad), **Perfil
  completo** (todas las anteriores + nombre).
- `aurea-prototipo/aurea/perfil.html` — tarjeta privada **"Señales de
  confianza"** en Mi cuenta: lista amable de lo que falta según el rol (maestro:
  disciplina/propuesta, categoría, frase, disponibilidad y ritmo, trayectoria;
  discípulo: qué quieres aprender, intereses, cómo aprendes). CTA "Ajustes de
  cuenta" → `perfil-edicion.html`. Si no falta nada, la tarjeta no aparece.

## discover.html: sin cambios (decisión de cambio mínimo)

Las cards de descubrimiento **ya** muestran hasta 3 señales compactas honestas
(estado de disponibilidad · ritmo · modalidad, de la spec 036) sin desplazar
nombre/categoría/CTA, y el botón de guardar (spec 037) sigue siendo acción
privada. No hay nada que añadir sin saturar la card.

## Reglas respetadas

- No se muestran señales vacías; si no hay ninguna, el bloque entero se omite.
- No se usa "Verificado" como señal nueva (el badge existente de la cabecera de
  perfil-maestro se mantiene tal cual, sin duplicar).
- No se usan favoritos, solicitudes, mensajes, historial ni decisiones privadas.
- Sin "modalidad económica": esa funcionalidad no existe en el producto (la
  "spec 035" del repo es el hardening RLS), así que la señal queda fuera.
- La completitud se calcula al vuelo, no se guarda en BD y no se muestra como
  porcentaje público (etiquetas, no números).
- En el perfil público lo incompleto simplemente no genera señal (nunca un
  defecto negativo); el aviso es privado en Mi cuenta, en tono amable.
- Todo el contenido va escapado (`escHtml`/`textContent`); las etiquetas son
  cadenas fijas, sin datos de usuario.

## Criterios de aceptación

- [x] Existe `specs/042-senales-confianza-perfiles.md`.
- [x] No se modifica Supabase, sin migraciones, sin tocar `package.json`/`.env`.
- [x] Perfil público de maestro muestra señales honestas si hay datos.
- [x] Perfil público de discípulo muestra señales de claridad si hay datos.
- [x] Mi cuenta muestra sugerencias privadas; desaparecen al completar.
- [x] No hay bloque vacío de señales en perfiles públicos.
- [x] Sin "Verificado" nuevo, sin rankings, sin favoritos públicos, sin número
      de solicitudes, sin mensajes, sin historial, sin decisiones privadas.
- [x] Las reseñas señaladas proceden de relaciones consolidadas; sin demos.
- [x] Cards de maestro: máximo 3 señales compactas (ya cumplido, sin cambios).
- [x] Completitud simple, mantenible y no persistida.
- [x] Móvil y desktop; sin scroll horizontal; sin errores técnicos crudos.

## Notas / riesgos

- En `perfil-discipulo.html`, un visitante anónimo no puede leer
  `discipulo_perfiles` (sin GRANT para `anon`): las señales se derivan entonces
  solo de lo visible (frase pública) — honesto con lo que esa vista muestra.
- La señal de estado de disponibilidad siempre es derivable (fallback de
  `acepta_solicitudes`), así que el bloque del maestro casi siempre tiene al
  menos una etiqueta; el caso "sin señales → sin bloque" cubre fallos de carga.
