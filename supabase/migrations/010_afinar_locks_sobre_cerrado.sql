-- ============================================================
--  AUREA · Migración 010 — Afinar locks y transiciones del sobre cerrado
--
--  Cierra los hallazgos de la 3ª revisión de Codex sobre 008+009.
--  Idempotente (CREATE OR REPLACE / DROP-CREATE).
--
--   1) Deadlock por conversión de lock: el INSERT en
--      decisiones_consolidacion toma FOR KEY SHARE sobre la fila de
--      relaciones (por el FK). Si el trigger pide FOR UPDATE, dos inserts
--      concurrentes intentan subir de KEY SHARE a UPDATE → deadlock.
--      FOR NO KEY UPDATE es compatible con KEY SHARE y aun así serializa
--      los dos triggers entre sí. El UPDATE posterior de relaciones solo
--      cambia columnas NO-clave, así que no requiere un lock mayor.
--   2) Transición indebida a 'prueba': la policy de UPDATE de relaciones
--      permitía a un participante revertir una relación cerrada
--      (finalizada/cancelada/consolidada) de vuelta a 'prueba', porque
--      WITH CHECK solo prohibía 'consolidada'. Se añade estado <> 'prueba'
--      también en WITH CHECK.
--
--  Pega este archivo en:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1) Trigger: FOR NO KEY UPDATE en lugar de FOR UPDATE.
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
  -- Serializa los triggers de la misma relación sin chocar con el
  -- FOR KEY SHARE que el INSERT toma por el FK (evita el deadlock).
  perform 1 from public.relaciones where id = new.relacion_id for no key update;

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

-- 2) Policy UPDATE de relaciones: WITH CHECK también prohíbe volver a 'prueba'.
--    Transiciones de participante permitidas: solo desde una relación que NO
--    está en prueba (USING) hacia un estado que no sea 'prueba' ni 'consolidada'
--    (p. ej. consolidada -> finalizada en "Finalizar"). Las transiciones desde
--    'prueba' las hace solo el trigger (SECURITY DEFINER, omite RLS).
drop policy if exists "Participantes actualizan relaciones" on public.relaciones;
create policy "Participantes actualizan relaciones"
  on public.relaciones for update
  using (
    (auth.uid() = maestro_id or auth.uid() = discipulo_id)
    and estado <> 'prueba'
  )
  with check (
    (auth.uid() = maestro_id or auth.uid() = discipulo_id)
    and estado <> 'prueba'
    and estado <> 'consolidada'
  );
