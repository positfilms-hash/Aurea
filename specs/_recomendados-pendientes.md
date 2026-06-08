# Recomendados pendientes (backlog de revisiones de Codex)

Recomendados de Codex que **no son bloqueantes** y se difieren para hacerlos en
lote (cada 2-3 specs, o al corregir un bloqueante). Regla acordada: guardar
salvo que sea fundamental.

| # | Origen | Recomendado | Arreglo sugerido | Estado |
|---|--------|-------------|------------------|--------|
| R1 | spec 012 (reseñas) | El CTA "Dejar reseña" en `relaciones.html` se muestra por `relaciones.estado = 'consolidada'`, pero la BD valida por `resultados_consolidacion.resultado = 'consolidada'`. Una relación consolidada legacy (sin fila en `resultados_consolidacion`) mostraría el botón y el insert fallaría con mensaje genérico. | En `relaciones.html`, cargar `resultados_consolidacion` para las relaciones del usuario y mostrar el CTA solo si `resultado = 'consolidada'` (alinear UI con la regla de la BD). | pendiente |

---

## Observaciones menores fuera de specs (también en lote)

| # | Origen | Observación | Estado |
|---|--------|-------------|--------|
| O1 | spec 011 (historial) | `perfil-discipulo.html` muestra una stat "Abandonos" (de `historial_discipulo`, tabla vacía → siempre 0); señalador de fracaso en perfil público, candidato a retirar. | pendiente |
| O2 | spec 005 (donaciones) | `privacidad.html` menciona pagos de donaciones vía Stripe/PayPal/Bizum mientras las donaciones están ocultas; revisar al retomar donaciones. | pendiente |
| O3 | legacy | `css/components.css` y carpeta `aurea-prototipo/aurea/pages/` (duplicados que no entran al build) + columnas `relaciones.decision_*` sin uso → limpieza. | pendiente |
