# Spec 001 — Estado actual de Aurea

**Estado:** documentación / línea base (no es una feature)
**Fecha:** 2026-06-07
**Autor:** Claude (análisis del repo, sin cambios de código)

> Esta spec documenta lo que **existe hoy** en el repositorio. No define
> cambios. Sirve como punto de partida (snapshot) para futuras specs.
> Todo lo que no se puede confirmar leyendo el código está marcado como
> **(pendiente de confirmar)**.

---

## 1. Nombre

Estado actual de Aurea — línea base del proyecto.

---

## 2. Estado

Proyecto en producción en **https://www.aureacatena.com** (deploy automático vía Vercel al hacer push a `main`).
Funcional de extremo a extremo: registro, login, perfiles, descubrimiento de maestros, solicitudes, relaciones, periodo de prueba con chat y notificaciones en tiempo real.

Último commit en `main` al documentar: `77966e9`.

---

## 3. Resumen de la web

Aurea es una plataforma española que conecta **maestros** y **discípulos** para relaciones de aprendizaje continuas (no es una plataforma de cursos ni de lecciones grabadas).

Flujo conceptual:
1. Un usuario se registra como maestro, discípulo o ambos.
2. El discípulo explora maestros y envía una solicitud con motivación.
3. El maestro acepta o rechaza.
4. Si acepta, se abre una **relación** en estado *prueba* (hasta 30 días, chat libre, hasta 3 sesiones de vídeo).
5. Ambos deciden en "sobre cerrado" si consolidan la relación.

Tecnología: sitio multipágina en HTML/CSS/JS vanilla, construido con Vite 6, datos en Supabase, desplegado en Vercel.

---

## 4. Páginas detectadas

Todas en `aurea-prototipo/aurea/` (raíz de Vite). 18 páginas HTML:

### Públicas (nav público)
| Página | Función |
|---|---|
| `index.html` | Landing. Maestro destacado + stats reales + categorías (datos de Supabase). |
| `como-funciona.html` | Explicación del proceso + franja de stats reales. |
| `contacto.html` | Formulario de contacto (EmailJS). |
| `dona.html` | Donaciones. **Pendiente / no enlazar aún** (aparece en nav, ver riesgos). |
| `privacidad.html` | Política de privacidad, términos y cookies (página única). |
| `registro.html` | Alta de usuario. |
| `login.html` | Inicio de sesión. |
| `logout.html` | Cierre de sesión. |

### Autenticadas (llaman a `requireAuth()`)
| Página | Función |
|---|---|
| `perfil.html` | Perfil propio (maestro/discípulo/ambos), toggle de rol. |
| `perfil-edicion.html` | Edición de perfil + subida de foto con moderación NSFW. |
| `solicitudes.html` | Solicitudes recibidas por el maestro. |
| `relaciones.html` | Relaciones activas. |
| `periodo-prueba.html` | Chat de la relación en prueba + sesiones + decisión. |
| `mensajes.html` | Bandeja de conversaciones. |
| `historia.html` | Relaciones pasadas. |

### Perfiles públicos (sin `requireAuth()`, lectura)
| Página | Función |
|---|---|
| `perfil-maestro.html` | Perfil público de un maestro (`?id=`). Permite enviar solicitud. |
| `perfil-discipulo.html` | Perfil público de un discípulo (`?id=`). |

---

## 5. Componentes y scripts principales

Todos en `aurea-prototipo/aurea/js/`:

| Script | Tipo | Responsabilidad |
|---|---|---|
| `supabase.js` | ES module | Crea y exporta el cliente Supabase. Lanza error si faltan las env vars. |
| `auth.js` | ES module | `getSession()`, `getUser()`, `requireAuth()`, `signOut()`. `requireAuth()` refresca el rol desde `profiles` y sincroniza tema/localStorage. |
| `components.js` | Script legacy (global) | `renderNavPublic()`, `renderNavAuth()`, `renderFooter()`, dropdowns del nav, `cambiarRolNav()`, widget de chat (`renderChatWidget`), mediador de incidencias (`renderMediador`), `initChatFabDrag()`. |
| `scale.js` | Script legacy (global) | Zoom para pantallas grandes (≥2560/3200/3840 → 1.5/1.75/2), `--real-vh`, y aplicación del tema arena/dark antes del render. Expone `aureaSetTema()`. |
| `categorias.js` | ES module | `CATS` (11 categorías con subcategorías), `poblarSub()`, `initHashtags()` (widget de hashtags con sugerencias desde BD). |
| `notif.js` | ES module | `checkNotificaciones()` y `refreshMsgBadge()`. Badges de solicitudes/relaciones/mensajes + canal Realtime de mensajes nuevos. |

Estilos: `aurea-prototipo/aurea/css/global.css` (variables CSS, tema `html.theme-arena`).
Otros CSS detectados: `css/components.css`, `css/home.css` **(pendiente de confirmar si están en uso o son legacy)**.

### Widgets simulados (sin backend real)
- **Chat asistente** (`renderChatWidget`): respuestas predefinidas por palabra clave (`RESP` en components.js). No es IA real ni guarda datos.
- **Mediador de incidencias** (`renderMediador`): flujo de UI simulado; genera una referencia aleatoria y no persiste en BD **(pendiente de confirmar si debe persistir)**.

---

## 6. Tablas de Supabase usadas

Definidas en `supabase/migrations/` y referenciadas desde el código:

| Tabla | Definida en migración | Usada en código |
|---|---|---|
| `profiles` | 001 | sí (múltiples páginas) |
| `maestro_perfiles` | 001 | sí |
| `discipulo_perfiles` | 004 | sí |
| `trayectoria` | 001 | sí (perfil, perfil-maestro, perfil-edicion) |
| `solicitudes` | 001 | sí |
| `relaciones` | 001 | sí |
| `sesiones_prueba` | 001 | sí (periodo-prueba) |
| `mensajes` | 001 | sí |
| `resenas` | 001 | sí (perfil, perfil-maestro) |
| `historial_discipulo` | 001 | sí (perfil-discipulo) |

Además se referencia un **bucket de Storage `avatars`** en `perfil-edicion.html` (subida de fotos). **(pendiente de confirmar que el bucket existe y sus políticas, no está en las migraciones SQL).**

### RLS y triggers (resumen)
- RLS activado en todas las tablas. Lectura pública en `profiles`, `maestro_perfiles`, `discipulo_perfiles`, `trayectoria`, `resenas`, `historial_discipulo`. Acceso restringido a participantes en `solicitudes`, `relaciones`, `sesiones_prueba`, `mensajes`.
- Trigger `handle_new_user()` crea `profiles` + `maestro_perfiles`/`discipulo_perfiles` según rol al registrarse.
- Trigger `actualizar_reputacion()` recalcula `reputacion`/`num_resenas` al cambiar `resenas`.
- Trigger `set_updated_at()` en todas las tablas con `updated_at`.

---

## 7. Flujos de usuario detectados

1. **Registro** (`registro.html`) → el trigger `handle_new_user` crea el perfil y el perfil de rol → redirige a edición de perfil.
2. **Login / Logout** (`login.html` / `logout.html`).
3. **Edición de perfil** (`perfil-edicion.html`): datos base (`profiles`), perfil de rol (`maestro_perfiles`/`discipulo_perfiles`), trayectoria, foto a Storage `avatars`. Modo `?add=maestro|discipulo` para añadir un segundo rol.
4. **Descubrir maestros** (`discover.html`): lista desde `maestro_perfiles` + `profiles`.
5. **Ver perfil de maestro** (`perfil-maestro.html?id=`) → **enviar solicitud** (`solicitudes`).
6. **Gestionar solicitudes** (`solicitudes.html`): el maestro acepta (crea `relaciones`) o rechaza.
7. **Relaciones** (`relaciones.html`): ver activas, navegar al periodo de prueba.
8. **Periodo de prueba** (`periodo-prueba.html`): chat (`mensajes`), sesiones (`sesiones_prueba`), decisión de consolidar/cancelar (`relaciones`).
9. **Mensajes** (`mensajes.html`): bandeja de conversaciones, badge de no leídos en tiempo real (Realtime en `notif.js`).
10. **Historia** (`historia.html`): relaciones pasadas.
11. **Contacto** (`contacto.html`): envío por EmailJS (no toca Supabase para el envío).
12. **Tema por rol**: discípulo → arena; maestro → oscuro; ambos → preferencia guardada (`localStorage`).

---

## 8. Variables de entorno detectadas (solo nombres, sin valores)

Definidas en `.env.example` y consumidas por `supabase.js` vía `import.meta.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Vite lee el `.env` desde la raíz del repo (`envDir: process.cwd()` en `vite.config.js`). En Vercel estas variables están configuradas como Environment Variables **(pendiente de confirmar desde el repo; no es visible en código)**.

Credenciales **públicas** de EmailJS hardcodeadas en `contacto.html` (claves públicas de cliente, no secretas): IDs de service/template/public key.

---

## 9. Riesgos técnicos o UX

1. **Discrepancia de ubicación en CLAUDE.md (doc):** CLAUDE.md sitúa `vite.config.js`/`package.json` dentro de `aurea-prototipo/aurea/`, pero en realidad están en la **raíz del repo**. La raíz de Vite (`root`) sí es `aurea-prototipo/aurea/`. Conviene corregir la doc.
2. **Dos archivos `.env`:** existe `.env` en la raíz y otro en `aurea-prototipo/aurea/.env`. Vite usa el de la raíz (`envDir`). El de la subcarpeta parece redundante/sin uso. Ambos están correctamente git-ignored y **no** están trackeados (verificado con `git check-ignore` y `git ls-files`).
3. **Inconsistencia de categorías en el trigger (potencial bug de datos):** la migración 005 amplió el CHECK de `categoria` a 11 categorías nuevas en las tablas, pero el trigger `handle_new_user()` (redefinido en migración 004) sigue validando contra la **lista antigua** (`'Filosofía','Artes','Oficios','Deportes','Espiritualidad','Ciencia','Lenguas','Otra'`). Un registro como maestro con categoría nueva (p. ej. `'Negocios'`, `'Salud'`, `'Tecnología'`) podría caer a `'Otra'` en el alta. **(pendiente de confirmar el comportamiento real en Supabase con una migración 006 que alinee el trigger.)**
4. **`dona.html` en el nav:** CLAUDE.md indica que no debe enlazarse aún, pero `renderNavPublic()` y `renderNavAuth()` la incluyen como enlace. Decisión de producto pendiente.
5. **Bucket de Storage `avatars` fuera de migraciones:** la subida de fotos depende de un bucket que no está versionado en `supabase/migrations/`. Riesgo de que el entorno no sea reproducible. **(pendiente de confirmar.)**
6. **Widgets simulados:** chat asistente y mediador de incidencias dan impresión de funcionalidad real pero no persisten nada. Riesgo de expectativa de usuario.
7. **Sin tests automatizados:** `package.json` no tiene script `test`. El bloque de checks de CLAUDE.md menciona `npm.cmd test`, que hoy no existe (ver sección 11).
8. **CSS posiblemente legacy:** `css/components.css` y `css/home.css` existen junto a `global.css`; sin confirmar si siguen en uso.

---

## 10. Pendientes evidentes

- Alinear el trigger `handle_new_user()` con las 11 categorías nuevas (migración 006). Requiere spec propia antes de tocar Supabase.
- Versionar la configuración del bucket `avatars` (políticas de Storage) en una migración.
- Decidir el destino de `dona.html` (publicar o quitar del nav).
- Limpiar el `.env` redundante de la subcarpeta si se confirma que no se usa.
- Corregir la ubicación de los archivos de config en CLAUDE.md.
- Decidir si el mediador de incidencias debe persistir en BD.
- Confirmar si `components.css`/`home.css` son legacy y eliminarlos si procede.

---

## 11. Criterios para considerar el estado actual documentado

- [x] Todas las páginas HTML listadas y clasificadas (pública/auth/perfil).
- [x] Todos los scripts JS principales descritos con su responsabilidad.
- [x] Tablas de Supabase mapeadas (migración que las define + uso en código).
- [x] Flujos de usuario principales identificados.
- [x] Variables de entorno listadas por nombre, sin valores.
- [x] Verificado que ningún `.env` está trackeado en git.
- [x] Riesgos y pendientes anotados, marcando lo no confirmable como *pendiente de confirmar*.
- [ ] Validación humana de los puntos marcados como *pendiente de confirmar* (categorías/trigger, bucket avatars, env vars en Vercel, CSS legacy).
