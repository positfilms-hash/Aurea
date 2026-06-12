# Spec 041: Ritual guiado del periodo de prueba

**Estado:** en desarrollo
**Fecha:** 2026-06-12
**Autor:** ChatGPT (spec) + Codex (preflight y prompt operativo)

---

## Qué hace

Convierte la pantalla del periodo de prueba en un **ritual guiado**: un camino de
6 etapas (intención inicial, sesión de diagnóstico, sesión de práctica/revisión,
sesión de cierre, decisión por sobre cerrado y resultado) con próximo paso
recomendado, CTA según el estado y plantillas de mensaje opcionales. El objetivo
es que la relación no se quede fría tras aceptar una solicitud.

**No cambia** la lógica de consolidación, los límites (30 días / máx. 3 sesiones)
ni `relaciones.estado`. **No toca Supabase** (solo lecturas ya existentes), ni
migraciones, ni `package.json`, ni `.env`.

## Páginas que toca

- `aurea-prototipo/aurea/periodo-prueba.html` — el panel lateral pasa a ser el
  camino de 6 etapas con estado real, "Próximo paso" + CTA, y plantillas
  (copiar / insertar en el textarea, nunca enviar). Copy neutral del sobre
  cerrado. Estados vacíos diferenciados (sin id vs no encontrado/sin acceso).
  Fix responsive: en móvil la página deja de ser de altura fija (scroll normal).
- `aurea-prototipo/aurea/relaciones.html` — relaciones en `prueba` muestran
  "En periodo de prueba · X días restantes · n/3 sesiones" (solo datos
  calculables) y CTA **"Ver periodo de prueba"**. Las sesiones se obtienen con
  **una** query agrupada (`in(relacion_id, …)`), no una por tarjeta.
- `aurea-prototipo/aurea/mensajes.html` — aviso compacto en el panel derecho,
  solo cuando existen conversaciones en prueba.

## Tablas de Supabase que toca (solo lectura)

| Tabla | Uso |
|---|---|
| `relaciones` | `iniciada_at` + `dias_prueba_total` para días restantes |
| `sesiones_prueba` | sesiones usadas (filas reales; máx. 3) |
| `mensajes` | etapa 1 (¿la conversación ha empezado?) |
| `decisiones_consolidacion` | **solo la decisión propia** (sobre cerrado) |
| `resultados_consolidacion` | resultado final (existe solo si ambos decidieron) |

Sin escrituras nuevas, sin RLS nueva, sin triggers, sin migraciones.

## Cálculo de progreso (datos reales, nunca inventados)

- Días: `iniciada_at + dias_prueba_total` (default 30 si la columna es nula).
  Si `iniciada_at` falta o es inválida → copy genérico sin números
  ("Periodo de prueba en curso", "En periodo de prueba" sin días).
- Sesiones: conteo de filas reales de `sesiones_prueba`, cap a 3.
- En relaciones.html, si la query de sesiones falla no se muestra conteo.

## Etapa actual y CTA principal

Derivados solo de datos reales: resultado → etapa 6 · decisión propia → etapa 5
(esperando) · vencido o 3 sesiones → etapa 5 (toca decidir, CTA "Tomar decisión")
· sin mensajes → etapa 1 (CTA "Abrir conversación") · 0/1/2 sesiones → etapas
2/3/4 (CTA "Continuar conversación"). La etapa actual se marca con **texto**
("Etapa actual"), no solo con color.

## Privacidad del sobre cerrado (sin cambios de lógica)

- Solo se lee la decisión propia; el resultado solo existe cuando ambos
  decidieron (modelo de la spec 007/008, intacto).
- Copy neutral en banda, modal y ritual: *"Tu decisión queda guardada de forma
  privada hasta que ambas partes hayan decidido."* — se elimina la mención a la
  otra persona ("cuando X también decida") para no insinuar quién falta.
- Nunca se muestra la decisión ajena ni quién dijo que no.

## Plantillas de mensaje

4 textos de la spec (inicio según rol, antes de la segunda sesión, antes de
decidir) en un desplegable. Acciones: **Copiar** (portapapeles) y **Usar en el
chat** (inserta en el textarea existente; enviar sigue siendo del usuario).
Nunca se envían automáticamente. Solo visibles mientras el chat está activo.

## Criterios de aceptación

- [x] Existe `specs/041-ritual-guiado-periodo-prueba.md`.
- [x] No se modifica Supabase, sin migraciones, sin tocar `package.json`/`.env`.
- [x] Guía con las 6 etapas (intención, diagnóstico, práctica, cierre, sobre
      cerrado, resultado).
- [x] Días restantes y sesiones usadas solo si el dato real existe; nada
      inventado si no se puede calcular.
- [x] CTA principal cambia según el estado; hay CTA hacia la conversación.
- [x] Plantillas no se envían automáticamente.
- [x] No se revela la decisión ajena ni quién dijo que no; lógica de
      consolidación intacta.
- [x] relaciones.html enlaza claramente ("Ver periodo de prueba") con datos
      reales y query agrupada de sesiones.
- [x] mensajes.html: aviso compacto condicional, sin convertirla en el ritual.
- [x] Estados cargando/vacío/error sin errores técnicos crudos.
- [x] Móvil y desktop; sin scroll horizontal; etapa actual indicada con texto.

## Notas / riesgos

- `sesiones_prueba` no tiene flujo de registro en la UI todavía: el ritual no
  obliga a registrar sesiones (no bloquea), solo refleja las que existan.
- El fix móvil de periodo-prueba (altura fija → scroll de página a ≤899px)
  corrige un problema preexistente que el ritual habría agravado.

## Correcciones tras el review de Codex (misma rama)

- **Bloqueante — 403 en `resultados_consolidacion`:** las migraciones 008/013
  crearon sus tablas con RLS correcta pero sin GRANT de tabla a `authenticated`
  (mismo fallo que la 015 corrigió para `anon`). Nueva migración
  `supabase/migrations/020_grants_authenticated_consolidacion_notif_resenas.sql`
  con GRANTs mínimos (resultados: select · decisiones: select+insert ·
  notificaciones: select+update · resenas: select+insert). La RLS existente
  sigue decidiendo las filas; no se toca ninguna policy. **Requiere ejecución
  manual en Supabase Studio.** Cubre también el recomendado de 403 en
  notificaciones/reseñas (misma causa raíz).
- **Recomendado — nav autenticada móvil solapada:** reglas compactas a ≤599px en
  `global.css` (se oculta el wordmark cuando hay nav autenticada; controles
  reducidos; el rol vive en el dropdown).
- **Recomendado — `aurea-onboarding-visto` global por navegador:** ahora es por
  usuario (`aurea-onboarding-visto:<uid>`, helper `claveOnboardingVisto` en
  `auth.js`; `onboarding.html` actualizado).
- **Menor — filtro del smoke E2E demasiado amplio:** `tests/e2e/helpers.js` ya
  solo ignora el favicon; cualquier 4xx de Supabase hace fallar el smoke.
