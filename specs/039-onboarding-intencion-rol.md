# Spec 039: Onboarding por intención y rol

**Estado:** en desarrollo
**Fecha:** 2026-06-11
**Autor:** ChatGPT

---

## Qué hace

Añade una pantalla de bienvenida tras el registro que orienta al usuario según su
intención inicial (aprender, enseñar, ambas o "aún no lo tengo claro") y lo lleva
al siguiente paso lógico. Evita que una persona nueva se pierda entre perfil,
discover, ajustes o páginas vacías. No crea pagos, analítica ni IA, y **no
modifica Supabase**.

## Páginas que toca

- `aurea-prototipo/aurea/onboarding.html` — **nueva** pantalla de bienvenida
  (intención → ruta). Pantalla secundaria para "ambas cosas".
- `aurea-prototipo/aurea/js/auth.js` — nuevo helper `destinoPostAuth()` (decide
  onboarding vs discover tras autenticarse, sin duplicar lógica).
- `aurea-prototipo/aurea/registro.html` — tras registro con sesión → onboarding.
- `aurea-prototipo/aurea/login.html` — tras login → `destinoPostAuth()`.
- `aurea-prototipo/aurea/perfil.html` — bloque "Primeros pasos" en Mi cuenta si el
  perfil está incompleto (oculto cuando está completo).

No se toca `package.json` ni `.env`.

## Tablas de Supabase que toca

**No modifica Supabase.** Solo lee campos existentes (`profiles.rol`/`frase`,
`maestro_perfiles.disciplina/categoria`, `discipulo_perfiles.disciplina_buscada`)
para decidir rutas y completitud. No crea columnas, tablas, triggers, policies ni
migraciones. El estado de onboarding se guarda en `localStorage`
(`aurea-onboarding-visto`, no sensible).

## Decisión de producto y flujo

Tras registrarse (o al entrar sin haber pasado por la bienvenida y con perfil
vacío), el usuario ve **"¿Qué vienes a hacer ahora?"** con 4 opciones:

- **Quiero aprender** → `intencion.html` (test de intención, spec 038).
- **Quiero enseñar** → `perfil-edicion.html` (o `?add=maestro` si aún no es
  maestro) para completar el perfil de maestro.
- **Quiero ambas cosas** → pantalla secundaria "¿Qué quieres preparar primero?"
  (perfil de maestro / explorar maestros).
- **Aún no lo tengo claro** → `intencion.html`.

"Saltar por ahora" lleva a Mi cuenta (sin pantalla rota) y marca el onboarding
como visto.

## Integración con el rol existente (importante)

`registro.html` **ya pide el rol** (Maestro/Discípulo/Ambos) y el trigger
`handle_new_user` crea `maestro_perfiles`/`discipulo_perfiles` con placeholders.
Por eso:

- El onboarding **no crea un sistema paralelo de roles** ni reescribe `rol` a
  ciegas. Pre-selecciona la opción acorde al rol real y **delega la activación de
  un rol nuevo al flujo existente** `perfil-edicion.html?add=…` (que crea la fila
  y pone `rol='ambos'` al guardar). Así no se generan estados incoherentes
  (`rol` sin su sub-perfil) ni se pierde una capacidad ya activa.
- "Quiero aprender" no fuerza el rol discípulo a un maestro puro: explorar/orientarse
  no lo requiere y, si intenta solicitar/guardar, siguen aplicando las reglas de
  rol existentes.
- "Existe la fila" de sub-perfil **no** indica onboarding hecho (la crea el
  trigger): la completitud se mide por contenido real (`frase`, disciplina/categoría
  de maestro distintas de los placeholders, `disciplina_buscada` de discípulo).

## Primeros pasos en Mi cuenta

`perfil.html` muestra un bloque "Primeros pasos" con acciones según el rol (maestro:
completar perfil e indicar disponibilidad/ritmo — spec 036; discípulo: explorar y
guardar maestros — spec 037) **solo si faltan datos básicos**. Si el perfil está
completo, el bloque no aparece. Incluye acceso discreto a la bienvenida.

## Criterios de aceptación

- [x] Existe `specs/039-onboarding-intencion-rol.md`.
- [x] No se modifica Supabase ni se crean migraciones.
- [x] No se toca `package.json` ni `.env`.
- [x] Existe flujo de bienvenida tras registro; pregunta qué viene a hacer el
      usuario con las 4 opciones (aprender, enseñar, ambas, no lo tengo claro).
- [x] No pregunta edad ni pide datos sensibles.
- [x] aprender → intención/discover; enseñar → completar perfil maestro; ambas →
      elegir qué preparar primero; no claro → test de intención.
- [x] No crea un sistema paralelo de roles; respeta `localStorage.aurea-rol` y no
      deja el rol incoherente (delega la activación al flujo `?add=`).
- [x] El usuario puede saltar sin quedar en pantalla rota (va a Mi cuenta).
- [x] Mi cuenta muestra "Primeros pasos" si el perfil está incompleto y no lo
      muestra cuando está completo.
- [x] Tras guardar el perfil desde el onboarding, el flujo existente redirige al
      perfil/siguiente paso (perfil-edicion ya lo hace).
- [x] No se muestran errores técnicos crudos. Funciona en móvil y escritorio.
      Opciones accesibles con teclado (botones + foco + `aria-pressed`).

## Notas / restricciones

- No se incluye "modalidad económica" (no existe esa funcionalidad; su "spec 035"
  es, en este repo, el hardening de RLS).
- Si en el futuro hace falta persistir `onboarding_completado_at` en Supabase,
  será una mini-spec aparte con migración.
- Rutas privadas protegidas con `requireAuth()`; no se guardan tokens ni datos
  sensibles en localStorage.
