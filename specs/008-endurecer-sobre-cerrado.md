# Spec 008 — Endurecer el sobre cerrado (cierre de hallazgos Codex)

**Nombre:** Endurecer la consolidación con sobre cerrado.
**Estado:** en desarrollo
**Autor:** Codex (revisión) · Claude (implementación)
**Migración asociada:** `supabase/migrations/009_endurecer_sobre_cerrado.sql`

---

## Por qué existe esta spec (divergencia detectada)

La spec 007 se mergeó en `main` en su versión **original** (migración 008), sin
los fixes que se hicieron a raíz de la 1ª revisión de Codex (esos fixes se
quedaron sin commitear y no llegaron a `main`). Codex revisó después una versión
más arreglada que no coincide con lo que hay en el repo.

Para no editar una migración ya mergeada/aplicada (la 008), esta spec consolida
**todos** los endurecimientos pendientes en una **migración 009 idempotente**
que deja la base de datos en el estado correcto definitivo, se haya aplicado la
008 original o una variante.

---

## Qué hace

Cierra los hallazgos de Codex sobre el sobre cerrado:

1. **Carrera entre las dos decisiones (bloqueante):** el trigger
   `calcular_resultado_consolidacion()` ahora bloquea la relación
   (`... for update`) antes de contar. Si maestro y discípulo deciden casi a la
   vez, la 2ª transacción espera al commit de la 1ª y su conteo ya ve ambas, así
   que el resultado nunca se pierde.
2. **INSERT de decisión solo en 'prueba' (recomendado):** la policy de INSERT
   exige `relaciones.estado = 'prueba'`.
3. **Lockdown de `relaciones.estado` (bloqueante):** la policy de UPDATE de
   `relaciones` se recrea con:
   - `USING (... and estado <> 'prueba')` → un participante **no puede modificar
     una relación en prueba**; todas las transiciones desde 'prueba' las hace
     solo el trigger (SECURITY DEFINER, omite RLS). Esto cierra el bypass por la
     vía negativa (`prueba → finalizada` directo por API).
   - `WITH CHECK (... and estado <> 'consolidada')` → un participante no puede
     poner 'consolidada' a mano.

También se añade al frontend (`periodo-prueba.html`) el reflejo del cierre en la
misma pestaña (badge + bloqueo del chat) al revelarse el resultado, que tampoco
había llegado a `main`.

---

## Páginas y archivos que toca

- `supabase/migrations/009_endurecer_sobre_cerrado.sql` — trigger + 2 policies.
- `periodo-prueba.html` — reflejo del cierre al revelar resultado.

---

## Tablas de Supabase

Redefine (sin cambiar estructura): la función trigger
`calcular_resultado_consolidacion`, la policy INSERT de
`decisiones_consolidacion` y la policy UPDATE de `relaciones`. No crea tablas ni
columnas. No toca datos.

### Seguridad verificada
La única transición de `relaciones.estado` por un participante en el frontend es
"Finalizar" (relaciones.html → `finalizada`, sobre relaciones **consolidadas**,
no en prueba). El lockdown `estado <> 'prueba'` no la rompe. La creación de
relaciones es por INSERT (no afectado).

---

## Riesgos

- Deadlock por el `FOR UPDATE`: bajo. Ambas transacciones bloquean la misma fila
  única de `relaciones`; no hay orden inverso de múltiples locks.
- Romper "Finalizar": descartado (actúa sobre relaciones consolidadas).
- Divergencia git ↔ Supabase: esta migración es idempotente y converge al estado
  correcto; el humano debe ejecutarla en Supabase Studio.

---

## Criterios de aceptación

- [x] Existe `specs/008-endurecer-sobre-cerrado.md`.
- [x] Existe `supabase/migrations/009_endurecer_sobre_cerrado.sql`.
- [x] El trigger bloquea la relación antes de contar (cierra la carrera).
- [x] El INSERT de decisión exige `estado = 'prueba'`.
- [x] Un participante no puede modificar una relación en 'prueba' (solo el trigger).
- [x] Un participante no puede poner 'consolidada' a mano.
- [x] "Finalizar" (consolidada → finalizada) sigue funcionando.
- [x] El frontend refleja el cierre (badge + bloqueo de chat) sin recargar.
- [x] No se crean tablas/columnas; no se tocan datos.
- [x] No se toca `package.json` ni `.env`.
- [x] La migración es idempotente y ejecutable en Supabase Studio.
- [ ] **Pendiente (humano):** ejecutar la migración 009 en Supabase Studio.

---

## Acción pendiente importante

> Ejecuta `009_endurecer_sobre_cerrado.sql` en Supabase Studio. Tras esto, el
> estado del sobre cerrado en la BD queda correcto independientemente de qué
> variante de la 008 se hubiera aplicado.
