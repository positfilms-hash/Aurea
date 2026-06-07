# Spec 007 — Consolidación con sobre cerrado

**Nombre:** Consolidar relación tras periodo de prueba mediante sobre cerrado.
**Estado:** en desarrollo
**Autor:** ChatGPT (spec) · Claude (implementación)
**Migración asociada:** `supabase/migrations/008_consolidacion_sobre_cerrado.sql`

---

## Qué hace

Al final del periodo de prueba, maestro y discípulo deciden por separado si
quieren consolidar. La decisión de cada parte permanece **privada (a nivel de
RLS)** hasta que ambas han decidido. Cuando existen las dos, Aurea revela el
resultado: `consolidada` si ambos dicen sí; `no_consolidada` si al menos uno
dice no. El sobre cerrado es una regla respaldada por Supabase, no solo por UI.

---

## Contradicción detectada y decisión tomada (importante)

La spec original proponía tablas nuevas, pero al revisar el código se encontró
que:

- `relaciones` **ya tenía** `decision_maestro` / `decision_discipulo` (booleanas)
  y `periodo-prueba.html` ya consolidaba con ellas.
- Ese sobre cerrado previo **no era privado**: la RLS de `relaciones` deja a cada
  participante leer la fila entera (incluida la decisión del otro). La RLS por
  filas no puede ocultar una columna a un participante.

Se consultó al humano y se decidió **"adaptar e implementar"**:

1. Crear las tablas nuevas (única forma de lograr el sobre cerrado real: cada
   decisión es una fila y se oculta por RLS).
2. Migrar `periodo-prueba.html` al sistema nuevo y **retirar** el flujo viejo de
   `decision_*` (las columnas se dejan en la tabla, sin uso, para no romper nada).
3. **Sincronizar `relaciones.estado`** en el trigger (`consolidada` / `finalizada`),
   usando estados que ya existían, para que `relaciones.html` y `notif.js`
   reflejen la consolidación. (Desviación justificada del "no tocar estado":
   sin ella, el resto de la web no vería el cambio.)

---

## Páginas y archivos que toca

- `supabase/migrations/008_consolidacion_sobre_cerrado.sql` — tablas, RLS, trigger.
- `periodo-prueba.html` — bloque de decisión sobre cerrado (sustituye el flujo viejo).
- `relaciones.html` — **sin cambios**: ya pinta por `relaciones.estado`, que ahora
  se sincroniza, así que muestra Consolidada / Finalizada automáticamente.

---

## Tablas de Supabase

**Crea:** `decisiones_consolidacion`, `resultados_consolidacion`.
**Lee/sincroniza:** `relaciones` (estado, consolidada_at, finalizada_at).
No modifica `profiles`, `maestro_perfiles`, `discipulo_perfiles`, `solicitudes`,
`mensajes`, `sesiones_prueba`, `resenas`, `historial_discipulo`.
No se añaden estados nuevos a `relaciones` (se reutilizan `consolidada` y
`finalizada`).

### Verificación de esquema
`relaciones.maestro_id` / `discipulo_id` son `profiles.id` = `auth.uid()`, así que
`is_participante_relacion()` se usa tal cual (sin adaptación de nombres).

---

## Garantías de privacidad (RLS)

- **INSERT:** un usuario solo inserta su propia decisión (`user_id = auth.uid()`)
  y solo si participa en la relación. Unicidad `(relacion_id, user_id)` ⇒ una
  decisión por persona, sin editar.
- **SELECT decisiones:** cada usuario ve su propia decisión siempre; la del otro
  **solo** después de que exista el resultado (sobre cerrado real).
- **SELECT resultado:** solo participantes.
- El cálculo del resultado lo hace un trigger `security definer` (puede contar
  ambas decisiones aunque el usuario no pueda leerlas), no el frontend.

---

## Flujo de usuario

- **Antes de decidir:** en `periodo-prueba.html` aparece el bloque con dos
  opciones (Sí consolidar / No consolidar) y aviso de que es privado.
- **Tras decidir una parte:** "Tu decisión está guardada · El resultado se
  mostrará cuando la otra persona también decida." No puede cambiarla.
- **Tras decidir ambas:** se revela "La relación se ha consolidado." o "La
  relación no se ha consolidado." (tono sobrio, sin señalar a nadie).

---

## Reglas de producto respetadas

- Solo participantes deciden (RLS).
- Una decisión por persona; no editable desde la UI.
- No se revela la decisión del otro antes de tiempo.
- El resultado solo existe con dos decisiones.
- `consolidada` solo si ambas son `consolidar`; si no, `no_consolidada`.
- No se envían mensajes automáticos, no se crean reseñas, ni pagos, ni sesiones.
- La UI **no** revela quién dijo no.

---

## Riesgos

- Filtración de la decisión antes de tiempo → evitado por RLS (no depende del front).
- Cambiar la decisión → bloqueado por unicidad + sin botón de edición.
- Copy culpabilizante → se usa "La relación no se ha consolidado".
- Tocar `relaciones.estado` a ciegas → se hace solo desde `prueba`, con estados
  existentes e idempotente (`where estado = 'prueba'`).

---

## Criterios de aceptación

- [x] Existe `specs/007-consolidacion-sobre-cerrado.md`.
- [x] Existe `supabase/migrations/008_consolidacion_sobre_cerrado.sql`.
- [x] La migración crea `decisiones_consolidacion` y `resultados_consolidacion`.
- [x] RLS activado en ambas tablas.
- [x] Solo participantes pueden insertar decisión; solo la propia.
- [x] Una decisión por usuario y relación (unique).
- [x] Antes del resultado, un usuario solo lee su propia decisión.
- [x] El resultado no existe hasta que hay dos decisiones.
- [x] `consolidar` + `consolidar` ⇒ `consolidada`; resto ⇒ `no_consolidada`.
- [x] Los participantes ven el resultado cuando existe.
- [x] La UI indica que la decisión es privada hasta que ambos deciden.
- [x] La UI no permite cambiar la decisión tras enviarla.
- [x] La UI no revela quién dijo no.
- [x] `periodo-prueba.html` muestra el bloque de decisión cuando corresponde.
- [x] `relaciones.html` muestra el estado de consolidación (vía estado sincronizado).
- [x] No se crean mensajes/reseñas automáticas ni pagos.
- [x] No se toca `package.json` ni `.env`.
- [ ] **Pendiente (humano):** ejecutar la migración 008 en Supabase Studio.

---

## Notas / fuera de alcance

- Las columnas `relaciones.decision_maestro` / `decision_discipulo` quedan en la
  tabla sin uso (se podrían retirar en una limpieza futura).
- Se retiró el "cancelar periodo" inmediato de `periodo-prueba.html`: la vía para
  no continuar es ahora "No consolidar" (sobre cerrado). Si se quiere un abandono
  anticipado explícito, sería una feature aparte.
- La revelación del resultado se ve al recargar/volver a entrar; no hay push en
  tiempo real (no requerido por la spec).
