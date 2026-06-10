# Spec 036 — Disponibilidad y ritmo del maestro

**Nombre:** Añadir disponibilidad y ritmo de acompañamiento al perfil de maestro.

**Estado:** borrador

> **Numeración:** la migración propuesta por ChatGPT (`015`) está ocupada; la
> siguiente libre real es la **018** (origin/main va por 016, la 017 está en vuelo
> en la spec 035). La spec 036 es correcta.

## Qué hace

Permite que un maestro indique si acepta nuevas solicitudes, qué ritmo de relación
prefiere y en qué modalidad acompaña, con una nota breve opcional. Mejora la calidad
de las solicitudes. No implementa calendario, reservas ni videollamadas. Toca
`maestro_perfiles` (migración) + frontend.

## ⚠️ Choque de diseño resuelto (decidido con el humano)

`maestro_perfiles` **ya tenía** campos equivalentes a dos de los propuestos, así que
no se duplican (§13.1):

- **Modalidad → se reutiliza `formato`** (ya existía: presencial/online/ambos). Se
  **extiende su `check`** para admitir `'a_acordar'`. No se añade
  `modalidad_acompanamiento`. Labels: `ambos`="Online o presencial".
- **Disponibilidad → se añade `disponibilidad_estado`** (abierta/limitada/pausada)
  como fuente de verdad del CTA, y `acepta_solicitudes` (que ya existía y usaba el
  CTA) se mantiene **como espejo** (el frontend lo sincroniza: `pausada`→false,
  resto→true), para no romper nada existente.
- **Nuevos sin solape:** `ritmo_preferido`, `disponibilidad_notas`.

## Migración `018_disponibilidad_ritmo_maestro.sql`

Idempotente. Añade `disponibilidad_estado` (default `abierta`), `ritmo_preferido`
(default `a_acordar`), `disponibilidad_notas` (≤500); extiende el check de `formato`
con `a_acordar`; añade checks de los nuevos campos; e **inicializa**
`disponibilidad_estado='pausada'` en las filas existentes que no aceptaban solicitudes.

## Frontend

- **`perfil-edicion.html`:** sección "Disponibilidad y ritmo": estado (3 valores,
  reemplaza el antiguo `f-acepta` binario), ritmo (6 valores), modalidad (`f-formato`
  extendido con "A acordar") y nota (`textarea` `maxlength=500`). Al guardar persiste
  `disponibilidad_estado`/`ritmo_preferido`/`disponibilidad_notas`/`formato` y
  sincroniza `acepta_solicitudes = (estado !== 'pausada')`. Al cargar, deriva el estado
  de `acepta_solicitudes` si el perfil es antiguo.
- **`perfil-maestro.html`:** muestra Estado · Ritmo · Modalidad (+ nota en `textContent`)
  en el bloque Disponibilidad. CTA según estado: `abierta`=CTA normal; `limitada`=CTA +
  aviso "disponibilidad limitada…"; `pausada`=sin CTA + "no acepta nuevas solicitudes
  ahora mismo". Guard en `sendSol`: rechaza si `pausada` (defensa aunque se manipule el
  DOM).
- **`discover.html` (cards):** resumen compacto: etiqueta de estado de 3 valores
  (reemplaza "Acepta solicitudes/Lista de espera") + "Ritmo · Modalidad" si son
  específicos (no `a_acordar`). No domina sobre la identidad del maestro.

## Validaciones / seguridad

- Estado/ritmo/modalidad son `select` (siempre con valor). Nota ≤500 (`maxlength` +
  `check` en BD). La nota se pinta con `textContent` (sin HTML). No se piden teléfono,
  email, dirección exacta ni ubicación precisa. No hay calendario ni reservas.

## Checks

- `npm.cmd run build`: OK.
- `git diff --check`: limpio.
- No hay script de test configurado.
- Migración: el check real es leerla (nombres de columnas reales, idempotencia,
  extensión del check de `formato`, inicialización coherente) — revisado.
- Preview (sin la migración aplicada en dev): `perfil-edicion` muestra los campos
  nuevos y ya no tiene `f-acepta`; `discover` degrada con gracia a su estado de error
  (solo `console.warn`, sin crash) porque las columnas aún no existen. La feature
  completa se prueba tras aplicar 018.

## ⚠️ Riesgos / orden de despliegue (importante)

- **Aplicar la migración 018 en Supabase Studio ANTES (o a la vez) de mergear/desplegar
  este frontend.** `discover` y `perfil-maestro` seleccionan las columnas nuevas; si la
  migración no está aplicada, esas páginas mostrarán su estado de error (no crashean,
  pero no cargan maestros). Vercel despliega al mergear a `main`.
- Verificar tras aplicar: editar un maestro y guardar disponibilidad/ritmo/nota;
  comprobar el CTA en perfil-maestro para los 3 estados; ver el resumen en las cards.

## SQL de migración

Sí aplica → `supabase/migrations/018_disponibilidad_ritmo_maestro.sql`.

## Criterios de aceptación

- [x] Existe `specs/036-disponibilidad-ritmo-maestro.md` y la migración con el número libre (018).
- [x] Se verificó el esquema: se reutiliza `formato` y `acepta_solicitudes`, no se duplican columnas.
- [x] `maestro_perfiles` tiene `disponibilidad_estado`, `ritmo_preferido`, `disponibilidad_notas`; modalidad vía `formato`.
- [x] Checks de valores: estado (3), ritmo (6), formato (4 con `a_acordar`), nota ≤500.
- [x] El maestro edita disponibilidad/ritmo/modalidad/nota desde edición de perfil.
- [x] El perfil público muestra estado, ritmo y modalidad.
- [x] CTA: `abierta`=normal; `limitada`=aviso; `pausada`=sin CTA + mensaje (y guard en envío).
- [x] Las cards muestran disponibilidad compacta.
- [x] Sin calendario, reservas, videollamadas, ubicación precisa ni datos de contacto.
- [x] No se toca `package.json` ni `.env`. `npm.cmd run build` y `git diff --check` pasan.
- [ ] **El humano ejecuta la migración 018 en Studio antes de desplegar el frontend.**
