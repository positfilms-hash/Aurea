# Spec 006 — Mejorar la solicitud maestro-discípulo

**Nombre:** Mejorar la solicitud de relación entre discípulo y maestro.
**Estado:** en desarrollo
**Autor:** ChatGPT (spec) · Claude (implementación)
**Migración asociada:** ninguna (sin cambios en Supabase).

---

## Qué hace

Convierte la solicitud a un maestro en una **carta breve de intención** en lugar
de un mensaje casual. El discípulo entiende que abre la posibilidad de una
relación de aprendizaje (no una clase suelta) y el maestro recibe contexto
suficiente (motivación, objetivo y ritmo) para decidir con criterio.

Se resuelve **con la estructura actual de `solicitudes`**, sin tocar Supabase.

---

## Decisión técnica clave: cómo se guarda sin migración

La tabla `solicitudes` solo tiene el campo `motivacion` (text). Los criterios de
aceptación prohíben modificar Supabase, así que **la carta se compone como un
texto estructurado y legible dentro de `motivacion`**, con cabeceras:

```
Motivación:
<texto>

Objetivo en el periodo de prueba:
<texto>

Ritmo deseado:
<texto>
```

- Componer/parsear se centraliza en `components.js`: `formatSolicitud()`,
  `parseSolicitud()` y `escHtml()` (una sola fuente de verdad, usada por las 3
  páginas).
- **Retrocompatibilidad:** `parseSolicitud()` detecta las cabeceras. Una
  solicitud antigua (texto plano sin cabeceras) se interpreta como motivación a
  secas y se sigue mostrando bien. No se transforma ni se borra ningún dato.

> Se valoró parar y proponer una migración (columnas `objetivo`/`ritmo`), pero
> los criterios exigen "no modificar Supabase en esta spec", así que se optó por
> el campo existente. Si en el futuro se quiere consultar/filtrar por objetivo o
> ritmo, ahí sí tocaría una migración (spec aparte).

---

## Páginas y archivos que toca

- `js/components.js` — helpers `formatSolicitud`, `parseSolicitud`, `escHtml`.
- `perfil-maestro.html` — modal de solicitud convertido en carta de intención.
- `solicitudes.html` — cada solicitud despliega inline su contenido.
- `perfil-discipulo.html` — muestra la carta estructurada (flujo "Ver perfil").

---

## Tablas de Supabase

Principal: `solicitudes` (solo se usa el campo `motivacion` existente, vía
INSERT/SELECT ya presentes). Lectura contextual: `profiles`, `maestro_perfiles`.
No se modifica estructura, columnas, RLS ni triggers. No se crean migraciones.

---

## Qué se cambió exactamente

### `perfil-maestro.html` (formulario)
- El modal pasa de un único textarea a una carta con:
  - **Motivación** (obligatoria, mín. 120 / máx. 1200 caracteres) con contador.
  - **Objetivo en el periodo de prueba** (obligatorio, mín. 60 / máx. 800) con contador.
  - **Ritmo** (select): conversación inicial / sesión semanal / varias sesiones /
    a concretar con el maestro.
  - **Confirmación obligatoria**: "Entiendo que estoy solicitando una relación de
    aprendizaje, no una clase suelta ni una respuesta inmediata."
- Validación: no se envía si falta longitud mínima o la casilla. Mensajes de error claros.
- Copy del encabezado: explica que solicitar **no** es pedir una clase suelta.
- Copy de éxito: ya no promete respuesta inmediata ("…si decide iniciar un
  periodo de prueba contigo, te llegará un aviso").

### `solicitudes.html` (maestro)
- Antes la `motivacion` se traía pero **no se mostraba** (había que ir a "Ver
  perfil"). Ahora cada fila es desplegable: al pulsarla se abre un panel inline
  con **Motivación / Objetivo / Ritmo** (parseados), sin modal.
- Las solicitudes antiguas muestran su texto como "Motivación".
- Aceptar / rechazar conservan exactamente el comportamiento actual.
- El texto de usuario se escapa (`escHtml`) al inyectarse.

### `perfil-discipulo.html`
- La motivación de la solicitud se renderiza con cabeceras y saltos de línea si
  es una carta estructurada; las antiguas se siguen mostrando entrecomilladas.

---

## Flujo de usuario

**Discípulo:** entra en el perfil del maestro → "Enviar solicitud" → escribe
motivación + objetivo + ritmo → confirma el tipo de relación → envía → ve
confirmación honesta (sin promesa de respuesta inmediata).

**Maestro:** entra en `solicitudes.html` → despliega cada solicitud y lee
motivación, objetivo y ritmo → acepta o rechaza igual que antes.

---

## Riesgos

- Demasiados campos bajan conversión → se limita a 3 campos + confirmación, con ayudas.
- Pocos campos = solicitudes pobres → mínimos de longitud razonables.
- Copy burocrático → tono humano y sobrio.
- Tocar Supabase sin necesidad → evitado (campo existente).
- Romper solicitudes antiguas → parser retrocompatible, sin migrar datos.
- Prometer respuesta → copy de éxito sin promesas de tiempo.

---

## Criterios de aceptación

- [x] Existe `specs/006-mejorar-solicitud-maestro-discipulo.md`.
- [x] Desde `perfil-maestro.html` se entiende que se solicita una relación de aprendizaje.
- [x] El formulario pide motivación obligatoria.
- [x] El formulario pide objetivo para el periodo de prueba.
- [x] Incluye confirmación explícita del tipo de relación.
- [x] No se permite enviar una solicitud vacía o demasiado breve (mín. 120/60 + casilla).
- [x] El copy evita presentar Aurea como plataforma de clases sueltas.
- [x] El maestro ve en `solicitudes.html` el contenido relevante (inline, sin modal).
- [x] Las solicitudes antiguas siguen mostrándose correctamente.
- [x] Aceptar mantiene el comportamiento actual.
- [x] Rechazar mantiene el comportamiento actual.
- [x] No se crean tablas, no se modifica Supabase, no se crean migraciones.
- [x] No se toca `package.json` ni `.env`.
- [x] UI usable en móvil y escritorio (modal con `max-width`/scroll).
- [x] Mensajes de éxito/error claros, sin prometer respuesta inmediata.

---

## Notas / fuera de alcance

- El "ritmo" se guarda dentro de la carta (campo `motivacion`), no en una columna
  propia. Para filtrar/ordenar por ritmo u objetivo en el futuro haría falta una
  migración (spec específica).
- `mensajes.html` y `relaciones.html` no necesitaron cambios: no muestran el
  cuerpo de la solicitud.

## Revisión de Codex (post-implementación)

- **Recomendado — XSS en el render de `solicitudes.html`:** resuelto. Se escapan
  con `escHtml()` los campos de usuario (nombre, iniciales, ubicación,
  disciplina), se sanea `avatar_color` (solo hex o `var(--...)`) y se quitó
  `disciplina` del `onclick` de aceptar (ahora se busca en los datos cargados).
- **Recomendado — parser demasiado agresivo:** resuelto. `parseSolicitud()` solo
  trata el texto como carta estructurada si **empieza** por la cabecera
  `Motivación:`; así un texto antiguo libre que contenga una línea-cabecera no se
  malinterpreta.
- **Bloqueante — validación solo en cliente:** reconocido como limitación. La
  validación 120/60 + casilla cubre a usuarios normales (incluido pegar/espacios),
  pero un usuario autenticado podría insertar vía consola saltándose el cliente.
  La garantía real exige validación en servidor (CHECK/RLS), que es un cambio de
  Supabase y, por las reglas de esta spec, **queda para una spec aparte (007)**.
  Riesgo real bajo: solo permitiría una solicitud de baja calidad (el maestro la
  rechaza); RLS ya impide suplantar al discípulo.
