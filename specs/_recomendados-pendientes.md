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
| C4 | spec 014 (Codex) | `renderEmptyState` no escapaba `ctaHref`/`secHref`/`icon`. | ✅ hecho (hrefs escapados; `icon` documentado como HTML de confianza) |
| O1 | spec 011 | `perfil-discipulo.html` mostraba stat pública "Abandonos". | ✅ hecho (retirada) |
| O2 | spec 005 | `privacidad.html` mencionaba pagos de donaciones (Stripe/PayPal/Bizum). | ✅ hecho (texto neutro: gratuito, sin pagos) |
| O3a | legacy | `css/components.css`, `css/home.css` y carpeta `pages/` sin uso. | ✅ hecho (eliminados) |

## Pendiente

| # | Origen | Pendiente | Nota |
|---|--------|-----------|------|
| O3b | legacy | Columnas `relaciones.decision_maestro` / `decision_discipulo` sin uso. | Diferido: es un cambio de esquema (DROP COLUMN) → requiere su propia migración + spec, no entra en un lote de frontend. |
