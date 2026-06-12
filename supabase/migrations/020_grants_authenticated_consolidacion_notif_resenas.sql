-- ============================================================
--  AUREA · Migración 020 — GRANTs de tabla para authenticated
--  (corrige bloqueante del review de Codex sobre la spec 041)
--
--  Diagnóstico: el smoke autenticado de Codex ve 403 (permission
--  denied) al leer resultados_consolidacion, notificaciones y
--  resenas. Las migraciones 008 y 013 crearon sus tablas con RLS y
--  policies correctas pero SIN el GRANT de tabla al rol
--  `authenticated`; sin GRANT, PostgREST devuelve 403 aunque la RLS
--  permitiera la fila (mismo fallo que la 015 corrigió para `anon`
--  en las tablas de discover).
--
--  Esto rompe en producción:
--   - la etapa "Resultado" del periodo de prueba y el CTA de reseña
--     por consolidación (resultados_consolidacion)
--   - leer la decisión propia / enviarla (decisiones_consolidacion)
--   - el panel de notificaciones (notificaciones)
--   - listar y dejar reseñas (resenas)
--
--  Un GRANT solo abre la puerta de la TABLA: las filas visibles las
--  sigue decidiendo la RLS ya existente (decisión propia hasta el
--  sobre cerrado, notificaciones solo del dueño, etc.). No se añade
--  ninguna policy ni se cambia ninguna existente.
--
--  Solo se conceden las operaciones que el frontend usa de verdad:
--   - resultados_consolidacion: SELECT (el INSERT lo hace el trigger
--     SECURITY DEFINER de la 008)
--   - decisiones_consolidacion: SELECT + INSERT (decidir es insertar)
--   - notificaciones: SELECT + UPDATE (leer y marcar leídas; el
--     INSERT es solo de los triggers de la 013)
--   - resenas: SELECT + INSERT (leer reseñas y dejar la propia)
--
--  GRANT es idempotente: re-ejecutar no falla ni duplica.
--
--  Pega este archivo en:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

grant select         on public.resultados_consolidacion to authenticated;
grant select, insert on public.decisiones_consolidacion to authenticated;
grant select, update on public.notificaciones           to authenticated;
grant select, insert on public.resenas                  to authenticated;
