-- ============================================================
--  AUREA · Migración 009 — Endurecer el sobre cerrado
--
--  Cierra los hallazgos de la revisión de Codex sobre la 008. Es
--  IDEMPOTENTE y deja el estado final correcto tanto si se aplicó la
--  008 original como una variante con fixes parciales:
--
--   1) Condición de carrera entre las dos decisiones: se bloquea la
--      relación (FOR UPDATE) antes de contar, para que dos decisiones
--      concurrentes no cuenten cada una solo la suya y se pierda el
--      resultado.
--   2) El INSERT de decisión solo se permite si la relación está en
--      'prueba'.
--   3) Lockdown de relaciones.estado: un participante NO puede modificar
--      una relación que esté en 'prueba' (todas las transiciones desde
--      'prueba' las hace solo el trigger, que es SECURITY DEFINER y omite
--      RLS), ni poner 'consolidada' a mano. El resto de transiciones de
--      participante (p. ej. 'Finalizar' una relación consolidada ->
--      finalizada) siguen permitidas.
--
--  Requiere que la 008 ya esté aplicada (tablas, is_participante_relacion,
--  trigger). Pega este archivo en:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1) Trigger con bloqueo por relación (evita el resultado perdido en carrera).
create or replace function public.calcular_resultado_consolidacion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_decisiones integer;
  total_si integer;
begin
  -- Serializar por relación: la 2ª transacción espera al commit de la 1ª y,
  -- en READ COMMITTED, su conteo posterior ya ve ambas decisiones.
  perform 1 from public.relaciones where id = new.relacion_id for update;

  select count(*) into total_decisiones
  from public.decisiones_consolidacion
  where relacion_id = new.relacion_id;

  if total_decisiones < 2 then
    return new;
  end if;

  select count(*) into total_si
  from public.decisiones_consolidacion
  where relacion_id = new.relacion_id
    and decision = 'consolidar';

  insert into public.resultados_consolidacion (relacion_id, resultado, decided_at)
  values (
    new.relacion_id,
    case when total_si = 2 then 'consolidada' else 'no_consolidada' end,
    now()
  )
  on conflict (relacion_id) do nothing;

  if total_si = 2 then
    update public.relaciones
       set estado = 'consolidada', consolidada_at = now(), updated_at = now()
     where id = new.relacion_id and estado = 'prueba';
  else
    update public.relaciones
       set estado = 'finalizada', finalizada_at = now(), updated_at = now()
     where id = new.relacion_id and estado = 'prueba';
  end if;

  return new;
end;
$$;

-- 2) INSERT de decisión solo sobre relaciones en 'prueba'.
drop policy if exists "decisiones_consolidacion_insert_participante" on public.decisiones_consolidacion;
create policy "decisiones_consolidacion_insert_participante"
on public.decisiones_consolidacion
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_participante_relacion(relacion_id, auth.uid())
  and exists (
    select 1 from public.relaciones r
    where r.id = relacion_id and r.estado = 'prueba'
  )
);

-- 3) Lockdown de UPDATE en relaciones:
--    - USING estado <> 'prueba'  → un participante no puede tocar relaciones en
--      prueba (las cierra solo el trigger por el sobre cerrado).
--    - WITH CHECK estado <> 'consolidada' → un participante no puede poner
--      'consolidada' a mano (solo el trigger).
drop policy if exists "Participantes actualizan relaciones" on public.relaciones;
create policy "Participantes actualizan relaciones"
  on public.relaciones for update
  using (
    (auth.uid() = maestro_id or auth.uid() = discipulo_id)
    and estado <> 'prueba'
  )
  with check (
    (auth.uid() = maestro_id or auth.uid() = discipulo_id)
    and estado <> 'consolidada'
  );
