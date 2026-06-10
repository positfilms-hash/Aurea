# CLAUDE.md

**Léelo entero antes de tocar nada.**

Este archivo es la guía operativa de Claude Code para trabajar en Aurea. Su
objetivo es que una sesión nueva pueda continuar el proyecto sin depender del
contexto de chats anteriores.

---

## 1. Qué es Aurea

Aurea es una plataforma española, publicada en `aureacatena.com`, que conecta
**maestros** y **discípulos** para relaciones de aprendizaje **continuas**.

No es una plataforma de cursos, lecciones grabadas ni compra de clases sueltas.
El centro del producto es la **relación humana** de aprendizaje.

El deploy se hace automáticamente en **Vercel** al mergear a `main`.

**No hay usuarios reales todavía**, solo cuentas de prueba. Esto permite
migraciones pragmáticas, pero **nunca destructivas sin intención explícita**.

---

## 2. Stack técnico

- Frontend: **HTML, CSS y JavaScript vanilla** (sin frameworks).
- Build: **Vite 6** multipágina.
- Backend/datos: **Supabase** (PostgreSQL, Auth, Realtime, Storage).
- Deploy: **Vercel**.
- Contacto: **EmailJS** (sin backend; claves públicas hardcodeadas).
- Moderación de imágenes: **NSFWJS** en cliente.

No añadir frameworks ni dependencias sin permiso explícito.

---

## 3. Estructura del repo

Repo GitHub: **`positfilms-hash/Aurea`**

```
/
├── CLAUDE.md
├── specs/                       # specs NNN-nombre.md + _recomendados-pendientes.md + _template.md
├── supabase/migrations/         # migraciones SQL numeradas (001..)
├── vite.config.js · package.json · vercel.json   # EN LA RAÍZ
└── aurea-prototipo/aurea/       # la web (root de Vite)
    ├── *.html
    ├── js/  (supabase.js, auth.js, components.js, scale.js, categorias.js, notif.js)
    └── css/global.css
```

No recrear legacy eliminado: `css/components.css`, `css/home.css`, carpeta
`aurea-prototipo/aurea/pages/`.

---

## 4. Roles del equipo

- **ChatGPT** → piensa producto, detecta riesgos y **escribe las specs**. No
  programa. Si una spec toca Supabase, describe tablas/columnas/RLS/migración/riesgos.
- **Claude (tú)** → **PROGRAMA** siguiendo specs aprobadas. No decide prioridades
  de producto por su cuenta.
- **Codex** → **REVISA los PRs**. Clasifica: bloqueante / recomendado / menor.
- **GitHub** → historial y fuente de verdad. La rama que se mergea debe ser la que
  revisó Codex.
- **Vercel** → despliega solo al mergear a `main`.
- **Supabase** → Claude **no tiene acceso remoto**. Las migraciones SQL las
  ejecuta **el humano a mano** en Supabase Studio.
- **Humano** → aprueba specs, decide prioridades, hace commit/push/PR/merge, pega
  los hallazgos de Codex y ejecuta las migraciones.

**Claude no ejecuta commits, push, merge ni migraciones remotas.**

---

## 5. Ciclo exacto de trabajo

1. ChatGPT entrega una spec; el humano la pega a Claude.
2. Claude crea **rama nueva** desde `main` actualizado.
3. Claude **verifica el esquema/código real** antes de escribir.
4. Claude implementa **solo** la spec. La guarda en `specs/NNN-nombre.md`.
5. Claude ejecuta los **checks reales** (§9).
6. Claude entrega: **resumen final** (§10) + **comando de commit/push** + **Mensaje
   para Codex**.
7. El humano hace commit/push y abre el PR.
8. Codex revisa; el humano pega los hallazgos.
9. Claude corrige **en la misma rama, antes del merge**.
10. Cuando Codex queda limpio → el humano mergea; si hay migración, la ejecuta en
    Supabase Studio.

> **Regla dura:** la rama que se mergea debe ser la misma que revisó Codex. No
> corregir hallazgos en otra rama.

---

## 6. Regla para hallazgos de Codex

- **Bloqueantes**: se arreglan siempre antes del merge.
- Sin bloqueantes: guardar recomendados/menores en
  `specs/_recomendados-pendientes.md` y resolverlos **en lote** (cada 2–3 specs o
  al tocar un bloqueante cercano).
- **Excepción (se corrige en el momento):** seguridad, privacidad, datos
  personales, datos ficticios visibles, pérdida de datos o contradicción fuerte de
  producto.

---

## 7. Numeración de specs y migraciones

Se numeran **independientemente** y van desfasadas. **No confiar en los números de
ChatGPT** (suelen estar obsoletos). Antes de numerar, comprobar `origin/main`:

```powershell
git ls-tree origin/main specs/ --name-only | Select-Object -Last 1
git ls-tree origin/main supabase/migrations/ --name-only | Select-Object -Last 1
```

Usar el siguiente número libre de cada carpeta. **Si el humano se salta un número,
avísale.** Si un número de ChatGPT ya está ocupado, renumera y díselo.

Estado al escribir esta guía (verificar siempre `origin/main`): última **spec
mergeada 023**, última **migración 016**; en curso specs 024 (filtros) y 025 (este
archivo). El **016 de specs** quedó como hueco histórico.

---

## 8. Reglas críticas

- No trabajar en `main`. Rama nueva por cambio, desde `main` actualizado.
- PRs pequeños y acotados; no mezclar cambios no relacionados.
- Implementar solo la spec; avisar de contradicciones/riesgos **antes** de implementar.
- No tocar Supabase sin spec. Migraciones numeradas en `supabase/migrations/`.
- **Migraciones aplicadas son inmutables**: no editarlas; crear una nueva idempotente.
- No tocar `package.json` sin permiso. No tocar `.env`. No commitear secretos.
- **No usar `git add .`**; usar rutas explícitas.
- Claude no hace commit, push ni merge.
- No borrar datos reales. No reintroducir hooks de auto-commit. No fingir checks.

---

## 9. Checks reales antes de terminar

```powershell
npm.cmd run build      # desde la raíz; valida también los <script type="module"> inline
git diff --check       # espacios/conflictos (el aviso LF→CRLF es normal en Windows)
npm.cmd test           # NO EXISTE
```

`npm.cmd test` no está configurado. **No digas que los tests pasaron**; di
claramente: "No hay script de test configurado." Las migraciones SQL no entran al
build; su check real es **leerlas con cuidado** (nombres de tablas/columnas,
policies, triggers, orden de borrado/creación, idempotencia).

---

## 10. Resumen final obligatorio de Claude

1. **Archivos creados/modificados** (rutas exactas).
2. **Motivo** de cada cambio.
3. **Checks ejecutados** (resultado real de `npm.cmd run build` y `git diff
   --check`; y "no hay tests" si aplica).
4. **Riesgos pendientes** (incl. **migración manual en Supabase Studio** si aplica).
5. **Qué revisar visualmente** (páginas/flujos concretos).
6. **Comando de commit/push recomendado** (sin ejecutarlo; rutas explícitas, nunca
   `git add .`).
7. **Mensaje para Codex** listo para pegar (que lea los archivos del PR, sin
   pegarle diffs enormes).

Ejemplo de bloque de commit:

```powershell
git add specs/NNN-nombre.md ruta/archivo1 ruta/archivo2
git commit -m "feat: descripcion breve en una linea - spec NNN"
git push -u origin nombre-rama
```

---

## 11. Supabase y migraciones

Claude no tiene acceso remoto; el humano ejecuta las migraciones en Studio. Si una
spec toca Supabase: revisar migraciones y nombres reales, no duplicar columnas, no
inventar esquema, adaptar al esquema real, SQL idempotente y explicar riesgos.

Patrones preferidos: `create or replace function`, `drop policy if exists` +
`create policy`, `add column if not exists`, `create table if not exists`.

---

## 12. Tablas y Storage conocidos

`profiles`, `maestro_perfiles`, `discipulo_perfiles`, `trayectoria`,
`solicitudes`, `relaciones`, `sesiones_prueba`, `mensajes`, `resenas`,
`historial_discipulo`, `decisiones_consolidacion`, `resultados_consolidacion`,
`notificaciones`. Bucket de Storage: `avatars`.

**No asumir nombres de columnas. Verificar siempre en el esquema real**
(`supabase/migrations/001_schema_inicial.sql` y posteriores).

---

## 13. Lecciones aprendidas (NO repetir errores)

**13.1 El esquema suele tener ya lo que la spec propone.** Verifica las columnas
reales antes de crear migraciones. Vistos: `relaciones` ya tenía
`iniciada_at`/`dias_prueba_total`; `resenas` ya tenía `relacion_id` + unique;
`mensajes` usa **`autor_id`** (no `emisor_id`); `maestro_perfiles` y
`discipulo_perfiles` usan **`id`** (= `profiles.id`), no `user_id`; `trayectoria`
usa `maestro_id`. No dupliques columnas. Si hay choque spec↔esquema, avisa antes
de implementar.

**13.2 Corrige los hallazgos de Codex en la MISMA rama antes de mergear.** Una vez
se mergeó una versión vieja y hubo divergencia git/Supabase dolorosa.

**13.3 Migraciones aplicadas son inmutables.** No las edites; crea una nueva
idempotente (`create or replace`, `if not exists`, `drop policy if exists` + `create`).

**13.4 Triggers que cuentan filas y deben serializar:** `perform 1 from <tabla>
where id = ... for no key update;` — **`FOR NO KEY UPDATE`**, no `FOR UPDATE`
(este choca con el `FOR KEY SHARE` del FK → deadlock).

**13.5 RLS suma policies en OR.** Al endurecer, elimina la policy permisiva
antigua. Para "solo sistema": función `SECURITY DEFINER` + `REVOKE EXECUTE` a
public/anon/authenticated; sin policy de INSERT para clientes.

**13.6 No tocar `relaciones.estado` a ciegas.** Estados: `prueba, consolidada,
pausada, finalizada, cancelada`. Transiciones desde `prueba` solo por trigger.

**13.7 Escapa el texto de usuario en `innerHTML`.** Usa `escHtml()` (global en
`components.js`) o `textContent`. Para color usa `safeColor()` (global, solo
acepta hex o `var(--...)`). Para incrustar texto en una cadena JS dentro de un
atributo (`onclick="...'X'..."`) hay que escapar **dos** contextos (JS + HTML).
`categorias.js` tiene su propio `esc` local (es módulo ES).

**13.8 Nada de datos demo en el HTML estático.** Las páginas con datos remotos
arrancan en "Cargando…"/vacío/error, nunca con contenido ficticio. Distingue
**cargando / vacío / error** (y "sin resultados" si hay filtros).

**13.9 No reintroducir el hook de auto-commit** (había un `Stop` en
`.claude/settings.json` que hacía `git add -A` + commit + push). Eliminado. Los
commits los controla el humano.

**13.10 Top-level await + early return:** envuelve la lógica en `(async () => {
... return; })()`. No uses `await new Promise(()=>{})` para "parar" un módulo.

**13.11 Storage: NO borres `storage.objects` por SQL.** Supabase lo bloquea
(trigger `storage.protect_delete`: "Use the Storage API instead"). Borra ficheros
desde el frontend con la Storage API (`supabase.storage.from(bucket).remove([...])`)
antes del RPC. (`auth.users` **sí** se puede borrar por SQL como `postgres`.)

**13.12 Operaciones críticas atómicas, sin tragar errores.** Ej.: en el borrado de
cuenta NO captures el error de `delete from auth.users`; si falla, que la
transacción entera se revierta (todo o nada). No dejes un estado a medias que se
reporte como éxito.

**13.13 Git: commitea ANTES de pushear.** Pushear una rama sin commits crea una
rama remota vacía → **GitHub no ofrece PR**. No dejes trabajo en `git stash`
saltando entre ramas (genera ramas vacías y líos). Verifica con `git log
origin/main..<rama>` que la rama tiene commits antes de pedir el push.

**13.14 No metas caracteres U+2028/U+2029 literales en literales de regex** (los
cuela el copy-paste): rompen el build de Vite/esbuild ("Unterminated regular
expression"). Usa `\s` (que ya los cubre) o escapes `  `.

**13.15 Mensajes de commit en una sola línea.** En la PowerShell del humano los
here-strings `@'...'@` y las comillas/paréntesis dentro del mensaje fallan. Dale
`git commit -m "mensaje en una linea sin comillas dobles ni parentesis"` (+ otro
`-m` para el trailer `Co-Authored-By` si hace falta).

---

## 14. RLS y seguridad

Nunca confíes solo en el frontend para proteger datos. Privacidad/permisos →
RLS, constraints, triggers o funciones seguras. Las policies se combinan en **OR**
(una permisiva antigua invalida una restrictiva nueva → elimínala/reemplázala). No
exponer `service_role` en cliente. No commitear `.env`.

---

## 15. Auth, roles y tema

`localStorage`: `aurea-rol` (`maestro|discipulo|ambos`), `aurea-tema`
(`dark|arena`). Reglas: discípulo→arena, maestro→dark, ambos→preferencia guardada.
Pantallas grandes: `scale.js` aplica `zoom` solo si el viewport es lo bastante
ancho; para alturas usa `--real-vh`. No rompas esta lógica al tocar responsive/temas.

---

## 16. Secretos y entorno

`.env` nunca al repo (también en Vercel > Environment Variables):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. No imprimir secretos, no crear
archivos de entorno nuevos, no modificar `.env`.

---

## 17. EmailJS, NSFWJS y avatares

- **Contacto** usa EmailJS sin backend. Si una UI dice que envía algo al equipo,
  debe haber envío real (no widgets simulados).
- **Avatares**: moderación con NSFWJS en cliente (no eliminarla). Al tocar avatar:
  validar tipo (JPG/PNG/WEBP) y tamaño, mantener la moderación, respetar el bucket
  `avatars` y sus policies (ruta `{auth.uid()}/avatar.jpg`).

---

## 18. Sistema visual (specs 017–020, 024)

`global.css` tiene el sistema base: variables `--space-*`, contenedores, tipografía
fluida, botones (`.btn-primary/.btn-secondary/.btn-ghost/.btn-danger`), tarjetas,
avatares, breakpoints (≤599 / 600–899 / 900+) y una barra de navegación inferior
móvil (`renderMobileTabbar` en `components.js`). Reutiliza estas clases en vez de
crear estilos locales nuevos.

---

## 19. Al empezar una tarea

1. Lee la spec completa y este `CLAUDE.md`.
2. Actualiza `main`; crea rama nueva.
3. Mira el último número real en `origin/main` si vas a crear spec/migración.
4. Revisa los archivos reales (y el esquema/migraciones si toca Supabase) antes de
   tocar.
5. Avisa de contradicciones spec↔código.
6. Implementa solo lo aprobado; ejecuta checks; entrega el resumen final.

---

## 20. Qué NO hacer

`git add .` · trabajar en `main` · commit/push/merge · editar migraciones
aplicadas · tocar `package.json` sin permiso · tocar `.env` · inventar
tests/datos demo · añadir frameworks · mezclar refactors grandes con una feature
pequeña · ocultar riesgos.

---

## 21. Plantilla "Mensaje para Codex"

```
Revisa este PR del repo positfilms-hash/Aurea.

Contexto:
- Implementa la spec NNN: <nombre>.
- Cambios esperados: <resumen breve>.
- Si hay migración: revisar especialmente SQL, RLS, triggers, idempotencia y
  compatibilidad con el esquema existente.

Clasifica los hallazgos como: bloqueante / recomendado / menor.
Lee los archivos modificados del PR; no hace falta el diff entero.
```

---

## 22. Prioridad general

Aurea prioriza **producción estable**. Antes de añadir complejidad:
1) evitar pérdida de datos · 2) evitar errores de permisos · 3) evitar UI
engañosa · 4) evitar divergencias git↔Supabase · 5) PRs pequeños · 6) claridad
para el humano.
