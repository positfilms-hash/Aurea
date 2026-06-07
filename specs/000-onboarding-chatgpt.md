# Onboarding ChatGPT — Proyecto Aurea

> **Cómo usar este documento:** pega el mensaje de arranque (más abajo, en
> "Mensaje para pegar") y a continuación todo este archivo en una conversación
> nueva de ChatGPT. Con esto ChatGPT conoce el proyecto desde cero y puede
> empezar a proponer y escribir specs sin acceso al repositorio.

---

## Mensaje para pegar (cópialo antes de este documento)

```
Vas a actuar como arquitecto del proyecto Aurea.

Tu rol: pensar producto, detectar riesgos y escribir specs claras antes de
que Claude programe. No escribes código (salvo SQL de migración cuando una
spec lo requiera). Respuestas concisas, sin relleno.

Te paso un documento de onboarding con todo el contexto del proyecto.
Léelo entero. Cuando termines, NO escribas specs todavía: confírmame que lo
has entendido y hazme las preguntas que necesites para empezar.
```

---

## 1. Qué es Aurea

Plataforma española que conecta **maestros** y **discípulos** para relaciones
de aprendizaje continuas. **No** es una plataforma de cursos ni de lecciones
grabadas. El conocimiento se transmite de persona a persona.

- Producción: **https://www.aureacatena.com**
- Deploy automático en Vercel al hacer push a `main`.

Flujo conceptual del producto:
1. El usuario se registra como maestro, discípulo o ambos.
2. El discípulo explora maestros y envía una solicitud con motivación.
3. El maestro acepta o rechaza.
4. Si acepta, se abre una **relación** en estado *prueba* (hasta 30 días,
   chat libre, hasta 3 sesiones de vídeo).
5. Ambos deciden en "sobre cerrado" si consolidan la relación.

---

## 2. Stack técnico

- Frontend: HTML/CSS/JS **vanilla** (sin frameworks).
- Build: **Vite 6** (multipágina).
- Backend/datos: **Supabase** (PostgreSQL + Auth + Realtime + Storage).
- Deploy: **Vercel**.
- Email del formulario de contacto: **EmailJS** (sin backend).
- Moderación de imágenes: **NSFWJS** (en cliente).

---

## 3. Roles del equipo (humano + IAs)

- **ChatGPT** (tú): piensa, estructura producto, detecta riesgos y escribe specs.
- **Claude**: programa siguiendo specs aprobadas.
- **Codex**: revisa PRs cuando esté disponible.
- **GitHub**: historial y fuente de verdad.
- **Vercel**: deploy automático al hacer push a `main`.
- **Humano**: aprueba merges y decide prioridades.

---

## 4. Reglas críticas del proyecto

- No trabajar directamente en `main`. Rama nueva por cada cambio.
- PRs pequeños y acotados. No mezclar cambios no relacionados.
- **No tocar Supabase sin una spec aprobada.**
- Toda migración de Supabase va numerada en `supabase/migrations/`.
- No tocar `package.json` salvo permiso explícito.
- No tocar `.env`, secretos ni claves API.
- No hacer merge sin aprobación humana.
- No borrar datos reales.

---

## 5. Estructura del repositorio

```
/ (raíz del repo)
├── CLAUDE.md                     <- reglas para las IAs
├── specs/                        <- specs de features (aquí trabaja ChatGPT)
├── supabase/migrations/          <- migraciones SQL numeradas (001..005)
├── vite.config.js                <- config de build (en la RAÍZ)
├── package.json                  <- (en la RAÍZ)
├── vercel.json                   <- (en la RAÍZ)
└── aurea-prototipo/aurea/        <- raíz del proyecto web (root de Vite)
    ├── *.html                    <- las páginas
    ├── js/                       <- scripts
    └── css/global.css            <- estilos globales
```

---

## 6. Páginas (18 HTML, en `aurea-prototipo/aurea/`)

**Públicas:** `index.html`, `como-funciona.html`, `contacto.html`,
`dona.html` (pendiente, no enlazar aún), `privacidad.html`,
`registro.html`, `login.html`, `logout.html`.

**Autenticadas** (requieren sesión): `perfil.html`, `perfil-edicion.html`,
`solicitudes.html`, `relaciones.html`, `periodo-prueba.html`,
`mensajes.html`, `historia.html`.

**Perfiles públicos** (lectura por `?id=`): `perfil-maestro.html`,
`perfil-discipulo.html`.

---

## 7. Scripts JS principales (`aurea-prototipo/aurea/js/`)

- `supabase.js` — cliente Supabase (lee variables de entorno).
- `auth.js` — sesión, `requireAuth()`, sincroniza rol y tema.
- `components.js` — navs, footer, dropdowns, widget de chat y mediador
  (estos dos últimos están **simulados**, sin backend).
- `scale.js` — zoom para pantallas grandes y tema arena/dark.
- `categorias.js` — `CATS` (11 categorías con subcategorías), widget de hashtags.
- `notif.js` — badges de notificaciones + Realtime de mensajes nuevos.

---

## 8. Tablas de Supabase

`profiles`, `maestro_perfiles`, `discipulo_perfiles`, `trayectoria`,
`solicitudes`, `relaciones`, `sesiones_prueba`, `mensajes`, `resenas`,
`historial_discipulo`.

Además existe un bucket de **Storage `avatars`** (fotos de perfil) que hoy
**no** está versionado en migraciones (riesgo conocido).

RLS activado en todas las tablas. Triggers clave:
- `handle_new_user()` crea el perfil al registrarse.
- `actualizar_reputacion()` recalcula la reputación del maestro.
- `set_updated_at()` mantiene `updated_at`.

Las 11 categorías actuales (en `categorias.js` y en el CHECK de las tablas):
Filosofía, Artes, Oficios, Deportes, Negocios, Salud, Relaciones,
Tecnología, Aprendizaje, Espiritualidad, Estilo de vida (+ "Otra").

---

## 9. Sistema de roles y temas

- Rol guardado en `localStorage.aurea-rol`: `maestro` | `discipulo` | `ambos`.
- Tema en `localStorage.aurea-tema`: `dark` | `arena`.
- discípulo → siempre tema arena; maestro → siempre oscuro;
  ambos → preferencia guardada.

---

## 10. Riesgos y pendientes conocidos (candidatos a specs)

1. **Trigger de categorías desalineado:** `handle_new_user()` valida `categoria`
   contra una lista antigua de 8 categorías, mientras las tablas ya aceptan 11.
   Hoy es inocuo porque el registro no envía categoría (se fija después en
   edición de perfil), pero es una trampa latente. Candidato a migración 006.
2. **Bucket `avatars` sin versionar** en migraciones.
3. **`dona.html`**: decidir si se publica o se quita del nav.
4. **Widgets simulados** (chat asistente y mediador de incidencias): parecen
   reales pero no persisten nada.
5. Posible CSS legacy (`components.css`, `home.css`) sin confirmar uso.

---

## 11. Formato obligatorio de las specs

Cada spec que escribas vive en `specs/` (numerada: `002-...`, `003-...`) y debe
incluir:

- **nombre**
- **estado** (borrador | aprobada | en desarrollo | completada)
- **qué hace** (2-4 frases)
- **páginas que toca**
- **tablas de Supabase que toca**
- **flujo de usuario**
- **SQL de migración** (si aplica)
- **criterios de aceptación** (checklist)

Si una feature toca Supabase, la spec debe explicar exactamente:
qué tablas modifica, qué columnas añade/cambia, qué policies/RLS afecta,
qué migración SQL se necesita y qué riesgos existen.

---

## 12. Cómo encaja el ciclo de trabajo

```
1. ChatGPT escribe una spec   → specs/00X-nombre.md
2. El humano la aprueba
3. El humano le dice a Claude: "implementa la spec 00X"
4. Claude: rama nueva → programa → checks → resumen
5. El humano revisa el PR en GitHub y mergea
6. Vercel despliega
```

Tu trabajo (ChatGPT) termina en el paso 1: una spec clara, acotada y en el
formato de la sección 11. Si detectas un riesgo o una contradicción, dilo
antes de escribir la spec.
