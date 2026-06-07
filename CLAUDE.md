# CLAUDE.md

Trabajo en Aurea (aureacatena.com), plataforma española que conecta maestros y discípulos para relaciones de aprendizaje continuas. No es una plataforma de cursos.

---

## Stack

- HTML/CSS/JS vanilla
- Vite 6
- Supabase: PostgreSQL, Auth, Realtime
- Vercel
- Sin frameworks frontend

---

## Tablas principales en Supabase

- `profiles`
- `maestro_perfiles`
- `discipulo_perfiles`
- `solicitudes`
- `relaciones`
- `mensajes`

---

## Roles de IA

- **ChatGPT**: piensa, estructura producto, detecta riesgos y escribe specs.
- **Claude**: programa siguiendo specs aprobadas.
- **Codex**: revisa PRs cuando esté disponible.
- **GitHub**: historial y fuente de verdad del proyecto.
- **Vercel**: deploy automático al hacer push a `main`.
- **Humano**: aprueba merges.

---

## Reglas críticas

- No trabajar directamente en `main`.
- Crear una rama nueva para cada cambio.
- Hacer PRs pequeños y acotados.
- No mezclar cambios no relacionados.
- No tocar Supabase sin una spec aprobada.
- Toda migración de Supabase debe ir numerada en `supabase/migrations/`.
- No tocar `package.json` salvo permiso explícito.
- No tocar `.env`, secretos, claves API ni configuración sensible.
- No usar `git add .`.
- No hacer merge sin aprobación humana.
- No borrar datos reales.

---

## Specs

Antes de cualquier feature no trivial debe existir una spec.
Las specs viven en `specs/` y siguen este formato:

- nombre
- estado
- qué hace
- páginas que toca
- tablas de Supabase que toca
- flujo de usuario
- SQL de migración, si aplica
- criterios de aceptación

Si una feature toca Supabase, la spec debe explicar exactamente:

- qué tablas modifica
- qué columnas añade o cambia
- qué policies/RLS afecta
- qué migración SQL se necesita
- qué riesgos existen

---

## Trabajo de Claude

Claude debe:

1. Leer este archivo antes de actuar.
2. Leer la spec correspondiente antes de programar.
3. Implementar solo lo definido en la spec.
4. Avisar si detecta contradicciones, riesgos técnicos o riesgos de UX.
5. No escribir features nuevas fuera de alcance.
6. Explicar siempre qué archivos cambió y por qué.
7. Ejecutar los checks disponibles antes de terminar.

---

## Checks antes de terminar

Ejecutar, cuando existan:

```powershell
npm.cmd test
npm.cmd run build
git diff --check
```

Si un comando no existe o falla, Claude debe decirlo claramente. No debe inventar que los tests han pasado.

---

## Resumen final obligatorio

Al terminar cualquier tarea, Claude debe responder con:

1. Archivos creados o modificados.
2. Motivo de cada cambio.
3. Checks ejecutados.
4. Riesgos pendientes.
5. Qué debe revisar visualmente el humano.
6. Comando recomendado de commit, sin ejecutarlo.

---

## Contexto técnico adicional

### Estructura del proyecto

```
/ (raíz del repo)
├── CLAUDE.md
├── specs/                        <- specs de features
├── supabase/migrations/          <- migraciones SQL numeradas
└── aurea-prototipo/aurea/        <- raíz del proyecto web (root de Vite)
    ├── index.html                <- landing page pública
    ├── como-funciona.html
    ├── registro.html
    ├── login.html
    ├── perfil.html               <- perfil propio
    ├── perfil-edicion.html       <- editar perfil, upload foto
    ├── perfil-maestro.html       <- perfil público maestro
    ├── perfil-discipulo.html     <- perfil público discípulo
    ├── discover.html             <- explorar maestros
    ├── solicitudes.html
    ├── relaciones.html
    ├── periodo-prueba.html       <- chat de relación en prueba
    ├── mensajes.html
    ├── historia.html             <- relaciones pasadas
    ├── contacto.html
    ├── privacidad.html
    ├── dona.html                 <- pendiente, no enlazar aún
    ├── js/
    │   ├── supabase.js           <- cliente Supabase (lee .env)
    │   ├── auth.js               <- requireAuth(), rol, redirección
    │   ├── components.js         <- renderNavPublic/Auth(), renderFooter()
    │   ├── scale.js              <- zoom 4K, tema arena/dark
    │   ├── categorias.js         <- CATS, poblarSub(), initHashtags()
    │   └── notif.js              <- badges de notificaciones en tiempo real
    └── css/
        └── global.css            <- estilos globales, variables CSS, tema arena
```

### Secretos

El `.env` está en `.gitignore` y NUNCA va al repo. Las variables también están configuradas en Vercel > Environment Variables.

```
# .env (nunca al repo)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

EmailJS (seguras, hardcodeadas en contacto.html):
```
EJS_KEY      = '3hq5zg5R_U9rgRnER'
EJS_SERVICE  = 'service_pre7dnv'
EJS_TEMPLATE = 'template_otepyoq'
```

### Sistema de roles y temas

- `localStorage.aurea-rol` → `'maestro'` | `'discipulo'` | `'ambos'`
- `localStorage.aurea-tema` → `'dark'` | `'arena'`
- rol `discipulo` → siempre tema arena
- rol `maestro` → siempre tema dark
- rol `ambos` → el usuario elige; se persiste en `aurea-tema`

`scale.js` aplica el tema antes del render para evitar flash.
`auth.js` sincroniza el rol de Supabase con localStorage al cargar cada página autenticada.

### Pantalla del usuario

El usuario tiene pantalla 4K (3840×2160). `scale.js` aplica `zoom: 1.5` al `<html>`.
Para alturas correctas usar:
```js
const zoom = parseFloat(document.documentElement.style.zoom) || 1;
const realVh = window.innerHeight / zoom;
```

### Bugs resueltos (no repetir)

| Problema | Solución |
|---|---|
| Logo hasheado por Vite | Plugin `copyLegacyScripts` en vite.config.js copia logo.png a dist/ |
| Top-level await en Supabase SDK | `build.target: 'esnext'` en vite.config.js |
| `const` duplicado en components.js | Una sola declaración por variable al inicio de la función |
| Recursión infinita setRole → cambiarRolNav | `setRole()` llama `aureaSetTema()` directamente, no `cambiarRolNav()` |
| FAB drag con salto de posición | Dividir por zoom: `rect.left / zoom`, `(clientX - startX) / zoom` |
| Auth.js recargando la página en bucle | Eliminar `window.location.reload()` de auth.js |
