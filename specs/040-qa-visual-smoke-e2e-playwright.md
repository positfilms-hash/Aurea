# Spec 040: QA visual y smoke E2E mínimo con Playwright

**Estado:** en desarrollo
**Fecha:** 2026-06-11
**Autor:** ChatGPT (spec) + Codex (preflight y prompt operativo)

---

## Qué hace

Añade Playwright como herramienta de smoke E2E local para que Codex pueda
ejecutar su review visual (CODEX.md § Playwright / smoke visual). Cubre tres
frentes mínimos: páginas públicas cargan sin errores graves, rutas privadas sin
sesión redirigen a login, y responsive básico sin scroll horizontal.

**No** crea usuarios, **no** hace login, **no** toca Supabase, **no** añade CI ni
visual regression estricta.

## Archivos

- `specs/040-qa-visual-smoke-e2e-playwright.md` — esta spec.
- `playwright.config.js` — config mínima (JS, Chromium solo, `testDir`
  `./tests/e2e`, baseURL `http://127.0.0.1:5173`, reporter html, webServer Vite
  con `npm.cmd`/`npm` según plataforma, `reuseExistingServer: !process.env.CI`).
- `tests/e2e/helpers.js` — recolector de errores graves (pageerror +
  console.error con filtro de ruido), viewports y detector de scroll horizontal.
- `tests/e2e/public-smoke.spec.js` — 11 rutas públicas + logout + navegación
  desde home + formularios de login/registro (sin enviarlos).
- `tests/e2e/private-routes.spec.js` — 8 rutas privadas sin sesión → login.
- `tests/e2e/responsive-smoke.spec.js` — 6 páginas × 5 viewports.
- `package.json` / `package-lock.json` — dev dependency `@playwright/test` y
  scripts `test:e2e`, `test:e2e:ui`, `test:e2e:report` (permiso explícito en el
  prompt operativo de Codex; no se tocan los scripts existentes).
- `.gitignore` — añade `test-results/` y `playwright-report/`.

## Tablas de Supabase que toca

**Ninguna.** Sin migraciones. Los tests no leen ni escriben datos; los fallos de
red hacia Supabase se filtran como ruido (las páginas ya degradan a estados
vacío/error sin romperse).

## Decisiones de implementación

- **Rutas privadas** verificadas contra el código real (`requireAuth()` en):
  perfil, perfil-edicion, solicitudes, relaciones, periodo-prueba, mensajes,
  historia y onboarding. Coincide con la lista del prompt.
- **logout.html**: caso especial — debe redirigir limpiamente a index sin exponer
  contenido privado.
- **Scroll horizontal**: se comprueba intentando desplazar (`window.scrollTo`)
  en vez de medir `scrollWidth`, porque el CSS global clipa `overflow-x` en móvil
  a propósito y `scrollWidth` daría falsos positivos.
- **Errores graves**: fallan los tests con `pageerror` o `console.error`, con
  filtro de ruido conocido (favicon 404, fallos de red/Supabase). Los warnings no
  hacen fallar.
- **login.html no tiene `nav.nav`** (usa su propio layout split): el check de
  nav lo excluye.
- **Formularios**: en registro se navega del paso 1 (rol) al paso 2 (datos) para
  verificar los campos, pero no se rellena ni envía nada.

## Cómo ejecutar

```powershell
npx playwright install chromium   # una sola vez (descarga el navegador)
npm.cmd run test:e2e              # corre el smoke (levanta Vite solo)
npm.cmd run test:e2e:report       # abre el informe html
```

Requiere el mismo `.env` local que ya necesita `npm run dev`.

## Criterios de aceptación

- [x] Existe `specs/040-qa-visual-smoke-e2e-playwright.md`.
- [x] `@playwright/test` como única dependencia nueva (dev).
- [x] Solo se añaden los 3 scripts de test; los existentes no se tocan.
- [x] Config JS mínima, solo Chromium, webServer Vite multiplataforma.
- [x] Smoke público: 11 rutas, body no vacío, título, sin pageerror/console.error
      crítico, sin depender de datos de Supabase.
- [x] Navegación desde home: Cómo funciona, Entrar, Registro, Contacto.
- [x] Privadas sin sesión → login, sin contenido privado, sin hacer login.
- [x] logout.html redirige limpiamente sin exponer contenido.
- [x] Responsive: 5 viewports × subset de 6 páginas, sin scroll horizontal,
      nav y CTA visibles cuando aplica.
- [x] No se crean usuarios. No se toca Supabase. No se toca `.env`.
- [x] Sin CI ni visual regression estricta.
- [x] `.gitignore` ignora `test-results/` y `playwright-report/`.
- [x] `npm.cmd run build` y `git diff --check` pasan.

## Notas / riesgos

- Los tests necesitan el navegador Chromium de Playwright instalado en la máquina
  (`npx playwright install chromium`); si falta, `test:e2e` falla al arrancar con
  un mensaje claro de Playwright.
- El smoke usa el dev server real con el `.env` local: las páginas harán fetch a
  Supabase. Los tests no dependen de los datos devueltos (estados cargando/vacío/
  error son válidos), solo de que la página no se rompa.
- Sin CI: el smoke es local, lo ejecuta Codex/humano antes del merge.
