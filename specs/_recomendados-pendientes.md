# Recomendados pendientes (backlog de revisiones de Codex)

Recomendados de Codex que **no son bloqueantes**, gestionados en lote.
Regla: guardar salvo que sea fundamental; resolver cada 2-3 specs o al tocar un bloqueante.

## Lote resuelto (rama feat/estados-vacios, junto a spec 014)

| # | Origen | Recomendado | Estado |
|---|--------|-------------|--------|
| R1 | spec 012 | CTA "Dejar reseña" gateado por `relaciones.estado` en vez de `resultados_consolidacion.resultado`. | ✅ hecho (gate por `resultado='consolidada'`) |
| R2 | spec 013 | `notif.js` esperaba al `update` antes de navegar. | ✅ hecho (navega al terminar o a los 600 ms) |
| C1 | spec 014 (Codex) | `periodo-prueba.html` usaba `await new Promise(()=>{})` para parar el módulo. | ✅ hecho (IIFE async + `return`) |
| C2 | spec 014 (Codex) | `perfil-maestro.html` conservaba la demo de Rafael si no hay `?id=` o falla la carga. | ✅ hecho (estado "maestro no encontrado") |
| C3 | spec 014 (Codex) | `relaciones.html` mostraba filas demo mientras cargaba. | ✅ hecho (estado "Cargando…" al inicio) |
| C2b/C3b | spec 014 (Codex 2ª ronda) | El **HTML estático** de `perfil-maestro.html` y `relaciones.html` seguía trayendo los datos demo (flash / fail-open si el JS se cuelga). | ✅ hecho (HTML inicial neutro en "Cargando…", sin datos ficticios) |
| C4 | spec 014 (Codex) | `renderEmptyState` no escapaba `ctaHref`/`secHref`/`icon`. | ✅ hecho (hrefs escapados; `icon` documentado como HTML de confianza) |
| O1 | spec 011 | `perfil-discipulo.html` mostraba stat pública "Abandonos". | ✅ hecho (retirada) |
| O2 | spec 005 | `privacidad.html` mencionaba pagos de donaciones (Stripe/PayPal/Bizum). | ✅ hecho (texto neutro: gratuito, sin pagos) |
| O3a | legacy | `css/components.css`, `css/home.css` y carpeta `pages/` sin uso. | ✅ hecho (eliminados) |

## Pendiente

| # | Origen | Recomendado | Estado |
|---|--------|-------------|--------|
| R3 | spec 026 (Codex) | `discover.html`: los estados vacíos específicos ("Todavía no hay maestros en esta categoría" / "No hemos encontrado maestros en esta subcategoría") no contemplan la búsqueda libre activa: si hay categoría/subcategoría con maestros pero la búsqueda deja `FILTERED` a 0, el copy es engañoso. Priorizar el estado "sin resultados con esos filtros" cuando `searchEl.value.trim()` no esté vacío, o ajustar el copy para mencionar la búsqueda. | ⏳ pendiente |
| R4 | spec 026 (Codex) | `discover.html` (~línea 201): blindar `Number(m.rep).toFixed(1)` con `Number.isFinite(Number(m.rep))` por si `reputacion` no fuera numérico (menor; Supabase lo guarda numérico). | ⏳ pendiente |

## Resuelto fuera de lote

| # | Origen | Recomendado | Estado |
|---|--------|-------------|--------|
| R5 | spec 028 (Codex) | `perfil.html`: panel "Rol y apariencia" mostraba tema de localStorage sin aplicar reglas reales (discipulo→arena, maestro→dark). Label se desincronizaba al alternar el toggle en `ambos`. | ✅ hecho (derivación correcta en `buildAjustesHTML` + sync en `setRole`) |
| O3b | legacy | Columnas `relaciones.decision_maestro` / `decision_discipulo` sin uso. | ✅ hecho (spec 018 + migración 014: `DROP COLUMN IF EXISTS`). |