# CLAUDE.md — Aurea

Guía de trabajo para Claude (y cualquier IA que programe en este repo).
Lee esto antes de tocar cualquier archivo.

---

## Qué es Aurea

Plataforma española que conecta **maestros** y **discípulos** para relaciones de aprendizaje continuas (no cursos). Los maestros publican su disciplina; los discípulos solicitan; hay un periodo de prueba antes de consolidar la relación.

URL producción: **https://www.aureacatena.com**
Repo: GitHub → conectado a Vercel (deploy automático en cada push a `main`)

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | HTML + CSS + JS vanilla (sin frameworks) |
| Build | Vite 6 (multi-page app) |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime) |
| Deploy | Vercel (buildCommand: `npm run build`) |
| Email | EmailJS (formulario de contacto, sin backend) |
| Moderación de imagen | NSFWJS (client-side) |

---

## Estructura del proyecto

```
/ (raíz del repo)
├── CLAUDE.md                  ← este archivo
├── specs/                     ← specs de features (antes de programar)
├── supabase/migrations/       ← migraciones SQL numeradas
└── aurea-prototipo/aurea/     ← raíz del proyecto web (root de Vite)
    ├── index.html             ← landing page pública
    ├── como-funciona.html
    ├── registro.html
    ├── login.html
    ├── perfil.html            ← perfil propio (maestro/discípulo/ambos)
    ├── perfil-edicion.html    ← editar perfil con upload foto
    ├── perfil-maestro.html    ← perfil público de un maestro
    ├── perfil-discipulo.html  ← perfil público de un discípulo
    ├── discover.html          ← explorar maestros
    ├── solicitudes.html       ← solicitudes recibidas (maestro)
    ├── relaciones.html        ← relaciones activas
    ├── periodo-prueba.html    ← chat de la relación en prueba
    ├── mensajes.html          ← bandeja de mensajes
    ├── historia.html          ← relaciones pasadas
    ├── contacto.html
    ├── privacidad.html
    ├── dona.html              ← pendiente (no publicar aún)
    ├── js/
    │   ├── supabase.js        ← cliente Supabase (importa .env)
    │   ├── auth.js            ← requireAuth(), redirección, rol
    │   ├── components.js      ← renderNavPublic(), renderNavAuth(), renderFooter()
    │   ├── scale.js           ← zoom para pantallas 4K, tema arena/dark
    │   ├── categorias.js      ← CATS, poblarSub(), initHashtags()
    │   └── notif.js           ← badges de notificaciones en tiempo real
    ├── css/
    │   └── global.css         ← estilos globales, variables CSS, tema arena
    ├── assets/logo.png
    └── vite.config.js
```

---

## Credenciales y secretos

### NUNCA commitear `.env`

El `.env` está en `.gitignore`. Solo existe `.env.example` con placeholders.

```
# .env (NUNCA al repo)
VITE_SUPABASE_URL=https://newfksocgeibymtvgxqo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_gXSvor6_piW-cjwgs68GEA_dJaC66Aq
```

Estas variables se configuran también en Vercel > Environment Variables.

### EmailJS (seguras, hardcodeadas en contacto.html)
```
EJS_KEY      = '3hq5zg5R_U9rgRnER'
EJS_SERVICE  = 'service_pre7dnv'
EJS_TEMPLATE = 'template_otepyoq'
```

---

## Base de datos — tablas principales

| Tabla | Descripción |
|---|---|
| `profiles` | Un registro por usuario. Campos: `id`, `nombre`, `apellido`, `email`, `rol` (maestro/discipulo/ambos), `foto_url` |
| `maestro_perfiles` | Perfil extendido del maestro. Campos clave: `categoria`, `subcategoria`, `disciplina`, `hashtags[]`, `reputacion`, `acepta_solicitudes` |
| `discipulo_perfiles` | Perfil extendido del discípulo. Campos clave: `categoria`, `subcategoria`, `disciplina`, `hashtags[]`, `constancia` |
| `solicitudes` | Solicitudes de discípulo → maestro. Estados: `nueva`, `aceptada`, `rechazada`, `cancelada` |
| `relaciones` | Vínculo activo. Estados: `prueba`, `consolidada`, `completada`, `cancelada` |
| `mensajes` | Mensajes de chat. Campos: `relacion_id`, `autor_id`, `contenido`, `leido_at` |

### Regla de oro de Supabase
> **No modificar el schema sin una spec aprobada en `/specs/`.**
> Toda migración va numerada en `supabase/migrations/` (006_, 007_...).
> Probar siempre en Supabase Studio antes de hacer la migration definitiva.

---

## Sistema de roles y temas

- `localStorage.aurea-rol` → `'maestro'` | `'discipulo'` | `'ambos'`
- `localStorage.aurea-tema` → `'dark'` | `'arena'`

**Regla de tema:**
- rol = `discipulo` → siempre tema arena
- rol = `maestro` → siempre tema dark
- rol = `ambos` → el usuario elige; se guarda en `aurea-tema`

**`scale.js`** aplica el tema antes del render (evita flash).
**`auth.js`** sincroniza el rol de Supabase con localStorage al cargar cada página autenticada.

### Funciones globales (de scale.js / components.js)
```js
aureaSetTema(tema, rol)   // cambia tema + clases CSS
cambiarRolNav(rol)        // cambia rol desde el nav (solo en pages con nav auth)
renderNavPublic(active)   // nav para páginas públicas
renderNavAuth(active, ini) // nav para páginas autenticadas
renderFooter()            // footer
initChatFabDrag()         // hace el botón de ayuda arrastrable
```

---

## Pantalla del usuario

El usuario tiene una pantalla de **3840×2160** (4K).
`scale.js` aplica `zoom: 1.5` al `<html>`.
Todas las medidas en CSS son en píxeles lógicos (zoom ya compensa).

Para alturas correctas:
```js
const zoom = parseFloat(document.documentElement.style.zoom) || 1;
const realVh = window.innerHeight / zoom;
```

---

## Flujo de deploy

```
Editar código → git commit → git push origin main
                                    ↓
                             Vercel build automático
                             (npm run build → dist/)
                                    ↓
                          www.aureacatena.com actualizado
```

Build local de prueba:
```bash
cd "aurea-prototipo/aurea"
npm run build
```

---

## Convenciones de código

- **Sin frameworks**: HTML/CSS/JS puro. No añadir React, Vue ni librerías grandes sin discutirlo.
- **Imports ES modules** solo en `<script type="module">`. Los scripts legacy (`components.js`, `scale.js`) se cargan con `<script src="">`.
- **Vite** procesa los `*.html` en la raíz de `aurea-prototipo/aurea/`. Nuevas páginas = nuevo `.html` en esa carpeta + actualizar `vite.config.js` si hace falta (aunque ya detecta automáticamente).
- **CSS**: todo en `global.css`. Las variables CSS están en `:root` y se sobreescriben en `html.theme-arena`. No añadir estilos inline en JS salvo casos excepcionales.
- **Sin comentarios en español mezclados con inglés**: el código va en español o inglés, no los dos.

---

## Bugs conocidos y soluciones aplicadas

| Problema | Solución |
|---|---|
| Logo hasheado por Vite (logo-HASH.png) | Plugin `copyLegacyScripts` en vite.config.js copia logo.png a dist/ |
| Top-level await en Supabase SDK | `build.target: 'esnext'` en vite.config.js |
| SyntaxError por `const` duplicado en components.js | Una sola declaración por variable al inicio de la función |
| Recursión infinita setRole → cambiarRolNav → setRole | `setRole()` llama a `aureaSetTema()` directamente, no a `cambiarRolNav()` |
| FAB drag con salto (posición incorrecta) | Dividir coordenadas por zoom: `rect.left / zoom`, `(clientX - startX) / zoom` |
| Auth.js recargando la página cada segundo | Eliminar `window.location.reload()` de auth.js; solo actualizar localStorage |

---

## Flujo de trabajo con IAs

```
ChatGPT → piensa y escribe specs en /specs/
Claude  → programa (este archivo le da contexto)
Codex   → revisa PRs
GitHub  → recuerda (historial de commits)
Vercel  → enseña (deploy automático)
Supabase → NO se toca sin spec aprobada
Tú      → decides el merge
```

### Antes de empezar una feature nueva
1. Hay una spec en `/specs/nombre-feature.md`
2. La spec describe: qué hace, qué páginas toca, qué tablas de BD toca, qué flujo sigue
3. Si toca Supabase: la migración SQL está preparada y revisada antes de ejecutar

---

## Páginas pendientes / no publicadas

- `dona.html` — en espera de decisión con socio. No enlazar desde el nav aún.
