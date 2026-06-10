# Spec 025 — Crear `CLAUDE.md` operativo del proyecto Aurea

**Nombre:** Crear archivo `CLAUDE.md` con el flujo real de trabajo para Claude Code.

**Estado:** borrador

## Qué hace

Reemplaza el `CLAUDE.md` de la raíz por una guía operativa para que cualquier
sesión nueva de Claude pueda continuar el proyecto **sin depender del contexto de
chats anteriores**. Documentación operativa; **no cambia producto ni backend**.

## Archivos que toca

- **`CLAUDE.md`** (raíz) — reemplazado.
- `specs/025-crear-claude-md.md` — esta spec.

No toca HTML/CSS/JS de la web, `package.json`, `.env`, `vite.config.js`,
`vercel.json`, migraciones ni Supabase.

## Contenido del `CLAUDE.md`

Empieza con **"Léelo entero antes de tocar nada."** e incluye: qué es Aurea, stack,
estructura del repo (`positfilms-hash/Aurea`), roles (ChatGPT/Claude/Codex/GitHub/
Vercel/Supabase/humano), ciclo exacto con PRs y Codex, regla de corregir hallazgos
**en la misma rama antes del merge**, regla de **lotes** para recomendados,
**numeración independiente** de specs y migraciones con los comandos
`git ls-tree origin/main ...`, reglas críticas, **checks reales** (`npm.cmd run
build`, `git diff --check`, y que `npm.cmd test` **no existe** y no debe fingirse),
formato obligatorio del **resumen final**, lecciones aprendidas, tablas/Storage
conocidos, RLS/seguridad, auth/roles/tema, secretos/`.env`, EmailJS, NSFWJS/
avatares, sistema visual, y la plantilla de "Mensaje para Codex".

### Adaptaciones respecto al borrador de ChatGPT

- **Numeración actualizada**: el borrador decía "última spec 014 / migración 013";
  se puso el estado real (spec 023 / migración 016, con 024–025 en curso) y se
  mantiene la regla de comprobar siempre `origin/main`.
- **Lecciones nuevas de esta tanda de specs** (errores reales ya ocurridos, que es
  justo lo que esta guía debe prevenir): 13.11 no borrar `storage.objects` por SQL
  (`protect_delete`); 13.12 operaciones críticas atómicas sin tragar errores;
  13.13 commitear antes de pushear (rama sin commits → sin PR) y no usar `stash`
  entre ramas; 13.14 no meter U+2028/U+2029 literales en regex (rompen el build);
  13.15 mensajes de commit en una línea (los here-strings fallan en la PowerShell
  del humano). También se menciona `safeColor()` y la barra de navegación móvil.

## SQL de migración

No aplica.

## Criterios de aceptación

- [x] Existe `specs/025-crear-claude-md.md`.
- [x] Existe `CLAUDE.md` en la raíz, empieza con "Léelo entero antes de tocar nada.".
- [x] Explica qué es Aurea, el stack y la estructura del repo.
- [x] Explica los roles de ChatGPT, Claude, Codex, GitHub, Vercel, Supabase y humano.
- [x] Explica el ciclo exacto con PRs y Codex, incl. corregir en la misma rama antes del merge.
- [x] Incluye la regla de lotes para recomendados.
- [x] Explica la numeración independiente de specs/migraciones + comandos de `origin/main`.
- [x] Incluye reglas críticas.
- [x] Incluye los checks reales (`npm.cmd run build`, `git diff --check`, `npm.cmd test`
  no existe y no debe fingirse).
- [x] Incluye el formato obligatorio del resumen final.
- [x] Incluye las lecciones aprendidas.
- [x] Incluye que Claude no hace commit/push/merge ni migraciones remotas; el humano
  ejecuta las migraciones en Supabase Studio.
- [x] Incluye: no tocar `package.json` sin permiso, no commitear `.env`/secretos, no `git add .`.
- [x] Incluye el repo `positfilms-hash/Aurea`.
- [x] No modifica Supabase, no crea migraciones, no toca código de producto/`package.json`/`.env`.
