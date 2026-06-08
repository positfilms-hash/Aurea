# CLAUDE.md — Aurea

Guía maestra para Claude (y cualquier IA que programe en este repo).
**Léela entera antes de tocar nada.** Resume qué es el proyecto, el flujo de
trabajo con varias IAs, las reglas críticas y las lecciones aprendidas para no
repetir errores.

---

## 1. Qué es Aurea

Plataforma española que conecta **maestros** y **discípulos** para relaciones de
aprendizaje **continuas** (no es una plataforma de cursos ni de lecciones grabadas).

- Producción: **https://www.aureacatena.com**
- Deploy automático en **Vercel** al hacer push/merge a `main`.
- No hay usuarios reales todavía (solo cuentas de prueba) → las migraciones
  pueden ser pragmáticas, pero **nunca destructivas de datos**.

Flujo de producto: registro → completar perfil → explorar maestros (discover) →
enviar solicitud → el maestro acepta → **periodo de prueba** (30 días, hasta 3
sesiones, chat) → **consolidación en sobre cerrado** (ambos deciden en privado) →
historial / reseñas.

---

## 2. Stack

- Frontend: **HTML/CSS/JS vanilla** (sin frameworks).
- Build: **Vite 6** (multipágina). `vite.config.js`, `package.json`, `vercel.json`
  están en la **raíz del repo** (no en la subcarpeta).
- Datos: **Supabase** (PostgreSQL + Auth + Realtime + Storage).
- Email del formulario de contacto: **EmailJS** (sin backend; claves públicas hardcodeadas).
- Moderación de imágenes: **NSFWJS** (en cliente).

---

## 3. Roles del equipo (humano + IAs)

```
ChatGPT  → piensa producto, detecta riesgos y ESCRIBE las specs.
Claude   → PROGRAMA siguiendo specs aprobadas (eso eres tú).
Codex    → REVISA los PRs (bloqueante / recomendado / menor).
GitHub   → historial y fuente de verdad.
Vercel   → deploy automático al mergear a main.
Supabase → las migraciones SQL las ejecuta EL HUMANO a mano (Claude no tiene acceso).
Humano   → aprueba y hace los merges; ejecuta las migraciones en Supabase.
```

---

## 4. El ciclo de trabajo (IMPORTANTE — síguelo siempre)

1. **ChatGPT entrega una spec** (el humano te la pega). Si toca Supabase, debe
   describir tablas/columnas/RLS/migración/riesgos.
2. **Claude implementa**:
   - Crea **una rama nueva** desde `main` actualizado (nunca trabajes en `main`).
   - Verifica el esquema/código real **antes** de escribir (ver §7, lección clave).
   - Implementa solo lo de la spec. Guarda la spec en `specs/NNN-nombre.md`.
   - Ejecuta los checks (§6).
   - Entrega el **resumen final obligatorio** (§9) + un **"Mensaje para Codex"**
     listo para pegar.
3. **El humano** ejecuta el commit/push que le sugieres y abre el PR.
4. **Codex revisa el PR**. El humano te pega los hallazgos.
5. **Claude corrige en la MISMA rama, ANTES del merge** (lección dura, §7).
   - **Bloqueantes**: se arreglan siempre.
   - **Recomendados/menores**: ver regla de lotes (§5).
6. Cuando Codex queda limpio (o solo "menor" diferido) → **el humano mergea** y,
   si hay migración, **la ejecuta en Supabase Studio**.

> El humano hace los commits/push/merge. Tú preparas la rama y das el comando
> exacto, **sin ejecutarlo** (salvo operaciones de git de lectura/diagnóstico).

---

## 5. Regla de lotes para recomendados de Codex

Cuando Codex **no da ningún bloqueante**, **guarda** los recomendados en
`specs/_recomendados-pendientes.md` y hazlos **en lote** (cada 2-3 specs o al
corregir un bloqueante), **salvo que veas uno fundamental** (p. ej. fuga de datos
ficticios, privacidad, seguridad) → ese se hace en el momento.

Mantén ese archivo de backlog actualizado (qué, de dónde viene, estado).

---

## 6. Checks antes de terminar (ejecútalos de verdad)

```powershell
npm.cmd run build        # desde la raíz del repo; valida también los <script type="module"> inline
git diff --check         # espacios/conflictos
npm.cmd test             # NO EXISTE (no hay tests) → dilo, no lo inventes
```

- El warning `LF will be replaced by CRLF` es normal en Windows, inofensivo.
- Las migraciones SQL viven en `supabase/migrations/` (raíz), **fuera** del root
  de Vite → no entran al build; para ellas el check real es leerlas con cuidado.

---

## 7. Lecciones aprendidas (NO repetir errores)

1. **Numeración**: specs y migraciones se numeran **independientemente** y van
   desfasadas. ChatGPT suele dar números obsoletos. **Antes de numerar, mira
   `origin/main`**:
   ```powershell
   git ls-tree origin/main specs/ --name-only | Select-Object -Last 1
   git ls-tree origin/main supabase/migrations/ --name-only | Select-Object -Last 1
   ```
   Usa el siguiente número libre de cada uno.
2. **El esquema YA suele tener lo que la spec propone añadir.** Verifica las
   columnas reales antes de crear migraciones. Casos vistos: `relaciones` ya
   tenía `iniciada_at`/`dias_prueba_total`/`decision_*`; `resenas` ya tenía
   `relacion_id` + unique; `mensajes` usa `autor_id` (no `emisor_id`). **Adapta a
   los nombres reales; no dupliques columnas.** Si hay un choque de diseño,
   **avisa al humano antes de implementar** (se hizo con AskUserQuestion).
3. **Corrige los hallazgos de Codex en la misma rama ANTES de mergear.** Una vez
   se mergeó la versión vieja y los fixes quedaron sin commitear → divergencia
   git/Supabase dolorosa. La rama que se mergea debe ser la que revisó Codex.
4. **Migraciones ya aplicadas son inmutables.** Si una migración ya está en
   `main`/Supabase, **no la edites**: crea una migración nueva (idempotente:
   `create or replace`, `drop policy if exists` + `create`, `create table if not
   exists`, `add column if not exists`).
5. **Triggers que cuentan filas y deben serializar** (sobre cerrado, límite de
   sesiones): usa `perform 1 from <tabla padre> where id = ... for no key update`
   antes de contar. **`FOR NO KEY UPDATE`**, no `FOR UPDATE` (este último choca
   con el `FOR KEY SHARE` que toma el INSERT por el FK → deadlock).
6. **RLS**: las policies se suman en **OR**. Si endureces una regla, **elimina la
   policy permisiva antigua** (si no, sigue abriendo el hueco). Para reglas
   "solo el sistema": función `SECURITY DEFINER` + `REVOKE EXECUTE` a
   public/anon/authenticated; sin policy de INSERT para clientes.
7. **No tocar `relaciones.estado` a ciegas.** Estados válidos:
   `prueba, consolidada, pausada, finalizada, cancelada`. Transiciones desde
   `prueba` solo por trigger; los participantes no deberían poder ponerlas a mano
   (policy con `using estado <> 'prueba'` + `with check estado <> 'consolidada' and estado <> 'prueba'`).
8. **XSS**: escapa SIEMPRE el texto de usuario que metas por `innerHTML` con
   `escHtml()` (global en `components.js`). Saneа `avatar_color` (solo hex o
   `var(--...)`).
9. **No dejes datos demo en el HTML estático.** Las páginas con datos remotos
   deben arrancar en "Cargando…"/vacío, no con contenido ficticio (si el JS se
   cuelga, no se ven datos falsos). Distingue **cargando / vacío / error**.
10. **El hook de auto-commit fue eliminado.** Hubo un hook `Stop` en
    `.claude/settings.json` que hacía `git add -A` + commit + push solo. Se
    desactivó. **No lo reintroduzcas.** Los commits los controla el humano.
11. **`await new Promise(()=>{})` para "parar" un módulo es frágil.** Si necesitas
    early-return en un módulo con top-level await, envuelve la lógica en una
    `(async () => { ... })()` (las imports quedan fuera) y usa `return`.

---

## 8. Reglas críticas

- No trabajar en `main`. Rama nueva por cada cambio; PRs pequeños y acotados; no
  mezclar cambios no relacionados.
- **No tocar Supabase sin spec aprobada.** Toda migración numerada en
  `supabase/migrations/`. Las ejecuta el humano en Supabase Studio.
- **Nunca** commitear `.env` ni secretos (está en `.gitignore`). No tocar
  `package.json` salvo permiso explícito.
- No usar `git add .` (preferir rutas explícitas; excepción justificada al incluir
  borrados, avisando).
- No hacer merge sin aprobación humana. No borrar datos reales.
- Avisar de contradicciones/riesgos técnicos o de UX antes de implementar.

---

## 9. Resumen final obligatorio (al terminar cada tarea)

1. Archivos creados/modificados.
2. Motivo de cada cambio.
3. Checks ejecutados (resultado real).
4. Riesgos pendientes (incluida la **acción manual de migración en Supabase** si aplica).
5. Qué debe revisar visualmente el humano.
6. **Comando recomendado de commit/push, sin ejecutarlo.**
7. **Mensaje para Codex** listo para pegar (apuntándolo al repo/PR; que Codex
   lea los archivos, no pegarle diffs enormes).

---

## 10. Estructura del proyecto

```
/ (raíz del repo)
├── CLAUDE.md                         <- este archivo
├── specs/                            <- specs (NNN-nombre.md) + _template.md + _recomendados-pendientes.md
├── supabase/migrations/             <- migraciones SQL numeradas (001..)
├── vite.config.js · package.json · vercel.json   <- EN LA RAÍZ
└── aurea-prototipo/aurea/           <- root de Vite (las páginas)
    ├── index.html, como-funciona.html, registro.html, login.html, logout.html
    ├── perfil.html, perfil-edicion.html, perfil-maestro.html, perfil-discipulo.html
    ├── discover.html, solicitudes.html, relaciones.html, periodo-prueba.html
    ├── mensajes.html, historia.html, contacto.html, privacidad.html
    ├── dona.html                     <- oculta (sin enlaces en nav/footer); "no disponible aún"
    ├── js/
    │   ├── supabase.js               <- cliente (lee .env vía import.meta.env)
    │   ├── auth.js                   <- getSession/requireAuth/signOut + sync rol/tema
    │   ├── components.js             <- navs, footer, renderEmptyState, escHtml, chat asistente; campana de notificaciones
    │   ├── scale.js                  <- zoom pantallas grandes + tema arena/dark
    │   ├── categorias.js             <- CATS (11 categorías) + hashtags + formatSolicitud/parseSolicitud
    │   └── notif.js                  <- badge + dropdown de notificaciones (tabla notificaciones) + Realtime
    └── css/global.css                <- estilos globales, variables, tema arena, .empty-state, campana
```

> Nota: `css/components.css`, `css/home.css` y la carpeta `aurea-prototipo/aurea/pages/`
> fueron **eliminados** (legacy duplicado sin uso). No recrearlos.

---

## 11. Base de datos (Supabase)

Tablas: `profiles`, `maestro_perfiles`, `discipulo_perfiles`, `trayectoria`,
`solicitudes`, `relaciones`, `sesiones_prueba`, `mensajes`, `resenas`,
`historial_discipulo`, `decisiones_consolidacion`, `resultados_consolidacion`,
`notificaciones`. Bucket de Storage: `avatars` (versionado en migración 007).

Claves de RLS/triggers ya implementadas:
- `handle_new_user()` crea el perfil al registrarse (categorías alineadas, mig. 006).
- **Sobre cerrado** (specs 007-009 / migs 008-010): `decisiones_consolidacion` +
  `resultados_consolidacion`, RLS de privacidad, trigger con `FOR NO KEY UPDATE`,
  sincroniza `relaciones.estado`; `relaciones` UPDATE bloqueado para participantes
  desde `prueba` y para poner `consolidada` a mano.
- **Límites del periodo** (spec 010 / mig 011): trigger en `sesiones_prueba`
  (máx. 3, no tras vencer; fin = `iniciada_at + dias_prueba_total`).
- **Reseñas** (spec 012 / mig 012): solo el discípulo de una relación con
  `resultado='consolidada'`; trigger + RLS; `actualizar_reputacion()` intacto.
- **Notificaciones** (spec 013 / mig 013): tabla + triggers en solicitudes,
  mensajes (`autor_id`), `resultados_consolidacion` y `resenas`; `crear_notificacion`
  SECURITY DEFINER con REVOKE.

`localStorage`: `aurea-rol` (maestro|discipulo|ambos), `aurea-tema` (dark|arena).
discípulo→arena, maestro→dark, ambos→preferencia. Pantalla 4K: `scale.js` aplica
`zoom`; para alturas usar `--real-vh` (`window.innerHeight / zoom`).

---

## 12. Estado actual (al crear esta guía)

- Última **spec** en repo: **014** (estados vacíos / onboarding).
- Última **migración**: **013** (notificaciones).
- Specs 001-014 implementadas. PR en curso al escribir esto:
  `feat/estados-vacios` (spec 014 + lote de recomendados R1/R2/O1/O2/O3a + C1-C4).
- Backlog (`specs/_recomendados-pendientes.md`): solo queda **O3b** = quitar las
  columnas `relaciones.decision_*` sin uso → necesita su propia migración + spec.
- EmailJS (claves públicas, en `contacto.html`): KEY `3hq5zg5R_U9rgRnER`,
  SERVICE `service_pre7dnv`, TEMPLATE `template_otepyoq`.

---

## 13. Credenciales / secretos

`.env` (NUNCA al repo; también en Vercel > Environment Variables):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
Repo GitHub: `positfilms-hash/Aurea`.
