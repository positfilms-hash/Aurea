# Spec 009 — Afinar locks y transiciones del sobre cerrado

**Nombre:** Afinar el lock del trigger y las transiciones de estado.
**Estado:** en desarrollo
**Autor:** Codex (revisión nº3) · Claude (implementación)
**Migración asociada:** `supabase/migrations/010_afinar_locks_sobre_cerrado.sql`

---

## Qué hace

Cierra los hallazgos de la 3ª revisión de Codex sobre el sobre cerrado
(migraciones 008 + 009 ya aplicadas). Migración 010 idempotente + un ajuste de
frontend.

1. **Deadlock por conversión de lock (bloqueante):** el INSERT en
   `decisiones_consolidacion` toma `FOR KEY SHARE` sobre la relación (por el FK).
   El trigger pedía `FOR UPDATE`, así que dos inserts concurrentes intentaban
   subir de KEY SHARE a UPDATE → deadlock. Se cambia a **`FOR NO KEY UPDATE`**,
   compatible con KEY SHARE y suficiente para serializar los triggers. El UPDATE
   posterior de `relaciones` solo cambia columnas no-clave, así que no necesita
   un lock mayor.
2. **Transición indebida a 'prueba' (recomendado):** la policy de UPDATE de
   `relaciones` permitía a un participante revertir una relación cerrada a
   'prueba' (WITH CHECK solo prohibía 'consolidada'). Se añade
   `estado <> 'prueba'` también en WITH CHECK.
3. **Parpadeo en carga (menor):** la llamada de carga pasa a
   `await refrescarDecision()`.

---

## Páginas y archivos que toca

- `supabase/migrations/010_afinar_locks_sobre_cerrado.sql` — trigger + policy.
- `periodo-prueba.html` — `await` en la llamada de carga.

---

## Tablas de Supabase

Redefine (sin cambiar estructura) la función trigger
`calcular_resultado_consolidacion` y la policy UPDATE de `relaciones`. No crea
tablas/columnas. No toca datos.

### Transiciones de participante tras 010
- Permitidas: desde una relación que **no** está en prueba, hacia un estado que
  no sea 'prueba' ni 'consolidada' (p. ej. `consolidada → finalizada`, que es
  "Finalizar"). Verificado que ese es el único UPDATE de estado por participante
  en el frontend.
- Bloqueadas: tocar relaciones en 'prueba', poner 'consolidada' a mano, o
  revertir a 'prueba'. Las transiciones desde 'prueba' las hace solo el trigger.

---

## Riesgos

- Deadlock: resuelto con `FOR NO KEY UPDATE` (compatible con el KEY SHARE del FK).
- Romper "Finalizar": descartado (`consolidada → finalizada` sigue permitido).
- Idempotencia: `CREATE OR REPLACE` + `DROP/CREATE POLICY`; seguro sobre la BD
  con 008+009 ya aplicadas.

---

## Criterios de aceptación

- [x] Existe `specs/009-afinar-locks-sobre-cerrado.md`.
- [x] Existe `supabase/migrations/010_afinar_locks_sobre_cerrado.sql`.
- [x] El trigger usa `FOR NO KEY UPDATE` (sin riesgo de deadlock por conversión).
- [x] El WITH CHECK de la policy UPDATE prohíbe `prueba` y `consolidada`.
- [x] "Finalizar" (consolidada → finalizada) sigue permitido.
- [x] La carga usa `await refrescarDecision()`.
- [x] No se crean tablas/columnas; no se tocan datos.
- [x] No se toca `package.json` ni `.env`.
- [ ] **Pendiente (humano):** ejecutar la migración 010 en Supabase Studio.
