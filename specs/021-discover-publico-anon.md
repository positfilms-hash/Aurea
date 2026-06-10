# Spec 021 — Discover público para anónimos (GRANT a anon)

**Nombre:** Permitir que usuarios anónimos exploren maestros en discover.

**Estado:** borrador

**Migración asociada:** `supabase/migrations/015_grant_anon_discover.sql`

**Origen:** hallazgo de la spec 019 (al retirar el array DEMO, el rol `anon`
recibe "permission denied" al leer `maestro_perfiles`). Decisión de producto:
discover debe ser **público**.

## Problema

`discover.html` (y `perfil-maestro.html`) leen `maestro_perfiles` + `profiles`
(+ `trayectoria`/`resenas`/`relaciones`). Las policies RLS de esas tablas ya son
`using (true)` (lectura pública intencionada), **pero al rol `anon` le faltaba el
`GRANT SELECT` de tabla**, así que un visitante sin sesión obtenía
"permission denied". El array `DEMO` de la versión anterior lo ocultaba mostrando
maestros ficticios; al retirarlo (spec 019), el problema queda a la vista.

## Solución

Migración 015:

1. **`profiles`** — se divide la policy de SELECT para proteger la privacidad de
   los discípulos: `authenticated` sigue viendo todos los perfiles; `anon` solo
   ve perfiles **que pertenecen a un maestro** (`exists ... maestro_perfiles`).
2. **`GRANT SELECT TO anon`** en `profiles`, `maestro_perfiles`, `trayectoria`,
   `resenas` y `relaciones`. La RLS existente sigue filtrando filas:
   - `maestro_perfiles`/`trayectoria`/`resenas`: `using(true)` → contenido
     público del maestro.
   - `profiles`: gated por la nueva policy anon (solo maestros).
   - `relaciones`: RLS restrictiva (solo participantes) → anon obtiene **0 filas**
     (sin error). Esto evita que el contador de discípulos rompa
     `perfil-maestro` para anónimos, sin exponer relaciones privadas.

No cambia frontend. No crea tablas ni columnas.

## Por qué es seguro

- Un `GRANT SELECT` solo expone datos donde la RLS lo permite. No se relaja
  ninguna RLS salvo la separación de `profiles` (que **endurece** el caso anon:
  antes la policy `using(true)` aplicaba a todos los roles; ahora anon queda
  limitado a maestros).
- Los perfiles de **discípulo** NO son legibles por anónimos.
- `relaciones` sigue siendo privada (anon ve 0 filas).

## Relación con PR 019

PR 019 (cards) no necesita cambios para esto: su estado de error queda como
fallback ante fallos reales. Una vez aplicada la migración 015, el anónimo ve los
maestros en discover. (El CTA redundante "Solicitar aprendizaje" de la 019 se
trata por separado como recomendado.)

## Acción manual requerida

Ejecutar `supabase/migrations/015_grant_anon_discover.sql` en Supabase Studio
(la hace el humano; Claude no tiene acceso).

## Riesgos

- Hacer públicos los perfiles de maestro es el objetivo; si en el futuro se
  quisiera exponer también algún dato del discípulo públicamente, requeriría su
  propia revisión de privacidad.
- Si se renombró alguna policy de `profiles` fuera de migraciones, ajustar los
  `drop policy if exists`.

## Criterios de aceptación

- [x] Existe `specs/021-discover-publico-anon.md`.
- [x] Existe `supabase/migrations/015_grant_anon_discover.sql`, idempotente.
- [x] Tras aplicarla, el rol `anon` puede leer maestros (discover) y el contenido
  público de su perfil.
- [x] Los perfiles de discípulo NO son legibles por anon.
- [x] `relaciones` sigue privada (anon → 0 filas, sin error).
- [x] No se toca frontend, `package.json` ni `.env`.
- [ ] El humano ejecuta la migración 015 en Supabase Studio.
