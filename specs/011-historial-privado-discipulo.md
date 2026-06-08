# Spec 011 — Historial privado del discípulo

**Nombre:** Mostrar historial privado de aprendizaje del discípulo.
**Estado:** en desarrollo
**Autor:** ChatGPT (spec) · Claude (implementación)
**Migración asociada:** ninguna (solo frontend, solo lectura).

> **Numeración:** ChatGPT la propuso como "spec 009", pero ese número ya estaba
> usado. Renumerada a **spec 011**.

---

## Qué hace

Convierte `historia.html` en el recorrido de aprendizaje del usuario: solicitudes
enviadas (pendientes / no aceptadas), relaciones en prueba (activa o terminada),
consolidadas, no consolidadas y finalizadas. Es **privado** (solo lo ve el propio
usuario) y con tono no culpabilizante. Se construye con datos existentes; **no
toca Supabase**.

---

## Decisión técnica

- `historial_discipulo` **no se escribe en ninguna parte** (tabla vacía, sin
  triggers). Por eso el historial se construye leyendo en vivo de `solicitudes`,
  `relaciones` y `resultados_consolidacion`. No se rellena ni se crean triggers
  (como pide la spec).
- RLS verificada: el usuario puede leer sus propias `solicitudes`, `relaciones` y
  `resultados_consolidacion` (policies existentes por participante). No hace falta
  spec de RLS.

---

## Páginas y archivos que toca

- `historia.html` — reescrita como timeline del recorrido del usuario.
- `perfil.html` — **sin cambios**: el acceso al historial ya está en el nav
  ("Mi perfil" → ... y "Mis relaciones → Mi historia").
- `perfil-discipulo.html` — **sin cambios**: ya cumple privacidad (ver abajo).

---

## Cómo se construye el historial (`historia.html`)

- **Solicitudes** (`discipulo_id = yo`): se muestran **todas** como eventos
  propios — `nueva`/`vista` → "Solicitud enviada", `aceptada` → "Solicitud
  aceptada", `rechazada` → "Solicitud no aceptada". No se deduplican contra
  relaciones (ver nota de Codex abajo).
- **Relaciones** (yo como discípulo o como maestro):
  - `prueba` → "Periodo de prueba activo" o "Periodo de prueba terminado"
    (vencido = `iniciada_at + dias_prueba_total` < ahora).
  - `consolidada` → "Relación consolidada".
  - `finalizada` → si `resultados_consolidacion.resultado = 'no_consolidada'`,
    "Relación no consolidada"; si no, "Relación finalizada".
  - `cancelada` → "Periodo cancelado".
- Orden: de más reciente a más antiguo. Filtros: Todo / Como discípulo / Como maestro.
- Estados de página: con datos, vacío (con CTA "Explorar maestros") y error amable
  ("No hemos podido cargar tu historial ahora mismo").
- Texto de usuario (nombres, disciplina) escapado con `escHtml`.

---

## Privacidad y tono

- El historial solo lo ve el propio usuario (RLS + página autenticada).
- **No se revela quién decidió no consolidar**: solo se muestra "Relación no
  consolidada" (del resultado), nunca la decisión individual.
- Tono no culpabilizante: "Solicitud no aceptada" (no "te rechazó"), "Relación no
  consolidada" (no "no quiso consolidar").
- **Perfil público (`perfil-discipulo.html`)**: ya **no** expone solicitudes
  rechazadas (solo muestra la solicitud puntual que un maestro revisa vía `?sol=`)
  ni relaciones no consolidadas (solo carga relaciones en `prueba`/`consolidada`).
  Criterios cumplidos sin cambios.

---

## Riesgos

- Exponer rechazos/fracasos en público → no ocurre (perfil público ya filtrado).
- Revelar quién dijo no → no se muestra (solo el resultado agregado).
- Errores técnicos crudos → se captura el error y se muestra mensaje sobrio.
- Sin estado vacío → hay estado vacío con CTA.

---

## Criterios de aceptación

- [x] Existe `specs/011-historial-privado-discipulo.md`.
- [x] `historia.html` muestra el historial del usuario autenticado.
- [x] Ordenado de más reciente a más antiguo.
- [x] Muestra solicitudes enviadas / pendientes / aceptadas / no aceptadas cuando existan.
- [x] Muestra relaciones en prueba (activa/terminada) cuando existan.
- [x] Muestra relaciones consolidadas y no consolidadas (de `resultados_consolidacion`).
- [x] No revela quién decidió no consolidar.
- [x] Sin lenguaje culpabilizante.
- [x] El perfil público no muestra solicitudes rechazadas ni relaciones no consolidadas.
- [x] Otro usuario no puede ver el historial privado (RLS).
- [x] Estado vacío con CTA "Explorar maestros".
- [x] Mensaje de error amable si falla la carga.
- [x] No se crean tablas/triggers; no se modifica Supabase; no hay migraciones.
- [x] No se toca `package.json` ni `.env`.

---

## Revisión de Codex (pre-merge)

- **Recomendado — escapado/validación:** resuelto. Las iniciales (`ini(...)`) se
  escapan con `escHtml` y `avatar_color` pasa por `safeColor()` (solo hex o
  `var(--...)`, si no, fallback) antes de entrar en `style`.
- **Recomendado — dedupe perdía eventos:** resuelto. Ya no se omiten las
  solicitudes `aceptada`: se muestran como "Solicitud aceptada". El motivo es que
  `relaciones.solicitud_id` no se rellena en los inserts actuales y la solicitud
  se marca aceptada **antes** de crear la relación, así que deduplicar por vínculo
  no es fiable y podía perder eventos (p. ej. si el insert de la relación falla).
  Mostrar la solicitud aceptada como su propio evento también cumple el criterio
  de la spec.

## Notas / fuera de alcance

- `perfil-discipulo.html` muestra una stat "Abandonos" alimentada por
  `historial_discipulo` (tabla vacía → siempre 0). No expone datos reales, pero
  es un señalador de "fracaso" en un perfil público; candidato a revisar/retirar
  en una limpieza futura (fuera del alcance de esta spec).
- No se implementa reputación pública ni ranking (decisión de producto).
