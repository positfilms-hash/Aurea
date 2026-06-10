# Spec 038: Test de intención del discípulo

**Estado:** en desarrollo
**Fecha:** 2026-06-11
**Autor:** ChatGPT

---

## Qué hace

Añade un flujo breve para ayudar a un usuario que **no sabe qué buscar** a
descubrir qué categorías, tipo de maestro y ritmo pueden encajar con su momento
actual. No diagnostica, no etiqueta psicológicamente y **no usa IA**: es una guía
de intención simple y transparente.

El resultado sugiere 2–3 categorías canónicas, 1–2 arquetipos de maestro y un
ritmo, y enlaza a explorar maestros filtrados por categoría.

## Páginas que toca

- `aurea-prototipo/aurea/intencion.html` — **nueva** página del test (intro →
  6 preguntas → resultado).
- `aurea-prototipo/aurea/js/intencion.js` — **nuevo** módulo con preguntas,
  pesos y la lógica de recomendación (editable, sin IA).
- `aurea-prototipo/aurea/index.html` — CTA "No sé qué buscar" en el hero.
- `aurea-prototipo/aurea/discover.html` — CTA con subtexto en la barra lateral.

No se tocan otras páginas. No se toca `package.json` ni `.env`.

## Tablas de Supabase que toca

**Ninguna.** No crea ni modifica tablas, columnas, RLS, triggers, Storage ni
migraciones. El test es 100% frontend. No guarda el resultado en Supabase.

## Flujo de usuario

1. Desde index/discover el usuario pulsa "No sé qué buscar".
2. Ve una intro breve y pulsa "Empezar orientación".
3. Responde 6 preguntas (una por pantalla, progreso textual "Pregunta n de 6").
4. Ve su orientación: resumen, categorías sugeridas, tipo de maestro, ritmo,
   disclaimer y CTA "Ver maestros recomendados" (→ `discover.html?categoria=…`).
5. Puede repetir el test o explorar maestros.

El test se puede hacer **sin iniciar sesión**.

## Lógica de recomendación

Modelo simple y mantenible en `intencion.js`: cada opción suma puntos a una o
varias categorías (`cats`) y a uno o varios arquetipos de maestro (`arqs`). El
resultado muestra las categorías y arquetipos con más peso (empate → orden de
inserción, estable). Si hay pocas señales o muchas respuestas "no lo sé", se cae
a un fallback amable (`Aprendizaje`, `Filosofía`, `Estilo de vida`).

Categorías: **canónicas** desde `categorias.js` (`CATS`), no se duplica la lista.
No se recomienda `Otra`.

## Preguntas

6 preguntas: necesidad, forma de aprender, área (categorías canónicas), ritmo,
tipo de maestro, momento personal. No se pregunta edad ni datos sensibles. **No**
se incluye la pregunta de "modalidad económica": Aurea no tiene esa funcionalidad
(la "spec 035" que la condicionaba es, en este repo, el hardening de RLS).

## Integración

- Ritmo sugerido en el resultado (coherente con la disponibilidad/ritmo del
  maestro de la spec 036, aunque discover no filtra por ritmo todavía).
- CTA de categorías → `discover.html?categoria=<canónica>&origen=intencion`;
  discover ya muestra un estado vacío amable si no hay maestros en esa categoría.
- Progreso entre páginas con `sessionStorage` (no localStorage permanente). Se
  borra al repetir el test.

## Criterios de aceptación

- [x] Existe `specs/038-test-intencion-discipulo.md`.
- [x] No se modifica Supabase ni se crean migraciones.
- [x] No se toca `package.json` ni `.env`.
- [x] Existe entrada visible "No sé qué buscar" (index y discover).
- [x] El test se puede hacer sin iniciar sesión.
- [x] Tiene entre 5 y 7 preguntas (6) y no pide datos sensibles ni edad.
- [x] Usa categorías canónicas; no recomienda `Otra` salvo fallback.
- [x] Lógica simple, mantenible y sin IA.
- [x] El resultado muestra resumen, categorías, tipo de maestro, ritmo y
      disclaimer, con CTA a discover (con filtro) y opción de repetir.
- [x] No guarda el resultado en Supabase ni lo expone a otros; no se usa para
      ranking.
- [x] Funciona en móvil y desktop; opciones accesibles con teclado; progreso
      textual; sin errores técnicos crudos.

## Notas / restricciones

- No usar lenguaje terapéutico ni diagnósticos. No inferir edad/salud/economía.
- No prometer precisión: el resultado es una ayuda para empezar a explorar.
- Si se quiere guardar preferencias de aprendizaje, será otra spec.
