# Spec 033 — SEO y metadatos públicos

**Nombre:** Añadir SEO básico y metadatos públicos en Aurea.

**Estado:** borrador

> **Nota de numeración:** ChatGPT la llamó "032", pero la **032 ya estaba ocupada**
> por la spec del tema claro (`032-tema-claro-global-textura.md`, en vuelo). Esta se
> renumera a **033**.

## Qué hace

Mejora cómo aparece Aurea en buscadores, pestañas y enlaces compartidos: `<title>`
únicos, meta descriptions, canonical, Open Graph, Twitter Cards, `noindex` en
páginas no públicas, `robots.txt` y `sitemap.xml`. **No** añade analítica, tracking
ni scripts externos. No toca Supabase, `package.json` ni `.env`.

## Dominio

Se usa **`https://aureacatena.com`** (sin www) para canonical/OG, según `CLAUDE.md`
§1. ⚠️ La spec original usaba `www.`; el humano debe confirmar el dominio canónico y
que Vercel redirige la otra variante de forma consistente.

## Imagen social

No existe `og-image.png`. Se usa **`assets/logo.png`** (que sí existe, se copia a
`dist/assets/`) como `og:image`/`twitter:image`, con `twitter:card=summary` (cuadrada,
encaja con el logo). No se referencia ninguna imagen inexistente.

## Metadatos por página pública estática

Cada una recibe `<title>` único (formato `X — Aurea`), `meta description`,
`canonical`, OG (`site_name/type/title/description/url/image`) y Twitter Card:
`index.html` (home), `como-funciona.html`, `discover.html`, `contacto.html`,
`registro.html`, `login.html`, `privacidad.html`, `cookies.html`, `aviso-legal.html`.
La home comunica que Aurea conecta maestros y discípulos y **evita lenguaje de cursos**
("No es una plataforma de cursos…"). `discover.html` se incluye por ser pública
principal aunque la spec no la listara.

## Perfiles públicos dinámicos

`perfil-maestro.html` y `perfil-discipulo.html` llevan un `<head>` **genérico**
correcto (título "Perfil de maestro/discípulo — Aurea", `og:type=profile`, sin
canonical estático para no apuntar todos los perfiles a la misma URL). Tras cargar el
perfil, un helper global **`aureaSetMeta()`** (en `components.js`) actualiza
`document.title`, description, `og:title/description/url` y `canonical` con **solo
datos públicos**:

- Maestro: `{Nombre} — Maestro en Aurea` + "Aprende con {Nombre} en Aurea dentro de
  {categoría}…". Canonical/og:url con el `?id=` real.
- Discípulo: `{Nombre} — Discípulo en Aurea` + "Perfil público de {Nombre}…".

No se incluye historial, solicitudes, relaciones, mensajes, email ni datos privados.
Si el perfil no existe, no se actualiza nada → queda el título genérico (no engañoso).

## Indexación

`<meta name="robots" content="noindex, nofollow">` en páginas autenticadas / no útiles
para SEO: `perfil.html`, `perfil-edicion.html`, `solicitudes.html`, `relaciones.html`,
`periodo-prueba.html`, `mensajes.html`, `historia.html`, `logout.html`,
`recuperar-password.html`, `actualizar-password.html`. `dona.html` ya lo tenía.

## robots.txt y sitemap.xml (nuevos, en `public/`)

Vite copia `aurea-prototipo/aurea/public/*` a la raíz de `dist` → servidos en
`/robots.txt` y `/sitemap.xml`.

- **robots.txt:** `User-agent: * / Allow: /` + `Sitemap:`. No se hace `Disallow` de las
  páginas `noindex` (a propósito: bloquear el crawl impediría que el robot vea el
  `noindex`; y evita exponer rutas privadas como "secretas").
- **sitemap.xml:** solo páginas públicas estables (home, cómo funciona, discover,
  contacto, registro, privacidad, cookies, aviso legal). Sin páginas autenticadas, sin
  `dona.html`, sin perfiles dinámicos.

## Checks

- `npm.cmd run build`: OK; `robots.txt` y `sitemap.xml` aparecen en `dist/` raíz.
- `git diff --check`: limpio (solo aviso LF→CRLF).
- No hay script de test configurado.
- Preview: home con title/description/canonical/OG correctos y sin lenguaje de cursos;
  `perfil.html` con `noindex`; `/robots.txt` y `/sitemap.xml` servidos (8 URLs, sin
  auth); perfil-maestro y perfil-discípulo actualizan title/description/canonical con
  datos públicos (verificado: "Patricia Blanco Estébanez — Maestro/Discípulo en Aurea",
  sin datos privados). Sin errores de consola.

## SQL de migración

No aplica.

## Riesgos / pendientes

- **Dominio www vs no-www:** confirmar el canónico y el redirect en Vercel; afecta a
  todos los canonical/OG.
- **og:image** es el logo (cuadrado, `summary`); si se quiere una tarjeta grande
  (`summary_large_image`), crear una imagen social 1200×630 dedicada en un futuro.
- Los metadatos dinámicos de perfil se aplican por JS: los crawlers que no ejecutan JS
  verán el `<head>` genérico (correcto y no engañoso). Suficiente para el alcance.

## Criterios de aceptación

- [x] Existe `specs/033-seo-metadatos-publicos.md`.
- [x] No se modifica Supabase; no migraciones; no `package.json`/`.env`.
- [x] Cada página pública principal tiene `<title>` único y meta description.
- [x] La home comunica maestros↔discípulos y evita lenguaje de cursos.
- [x] como-funciona / contacto / registro / login con título y descripción propios.
- [x] perfil-maestro y perfil-discipulo con metadatos base + dinámicos sin datos privados.
- [x] Open Graph y Twitter Card en páginas públicas; no se referencia og:image inexistente.
- [x] Páginas autenticadas y `logout.html` con `noindex`; `dona.html` mantiene `noindex`.
- [x] Canonical correcto en públicas estáticas; sin canonical genérico para perfiles dinámicos.
- [x] Se crean `robots.txt` y `sitemap.xml` mínimos; el sitemap no incluye autenticadas ni `dona.html`.
- [x] No se añade analítica, píxeles ni scripts externos; `html lang="es"` presente; un `<h1>` por página.
- [x] `npm.cmd run build` y `git diff --check` pasan.
