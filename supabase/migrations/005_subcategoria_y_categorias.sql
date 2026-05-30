-- ============================================================
--  AUREA · Migración 005
--  1. Añade columna subcategoria a maestro_perfiles y discipulo_perfiles
--  2. Actualiza CHECK de categoria con las nuevas 11 categorías
--
--  Pega este archivo en:
--  Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ── maestro_perfiles ─────────────────────────────────────────────────────

-- Añadir columna subcategoria
ALTER TABLE public.maestro_perfiles
  ADD COLUMN IF NOT EXISTS subcategoria text;

-- Reemplazar constraint de categoria con las nuevas categorías
ALTER TABLE public.maestro_perfiles
  DROP CONSTRAINT IF EXISTS maestro_perfiles_categoria_check;

ALTER TABLE public.maestro_perfiles
  ADD CONSTRAINT maestro_perfiles_categoria_check
  CHECK (categoria IN (
    'Filosofía','Artes','Oficios','Deportes','Negocios',
    'Salud','Relaciones','Tecnología','Aprendizaje',
    'Espiritualidad','Estilo de vida','Otra'
  ));

-- ── discipulo_perfiles ───────────────────────────────────────────────────

-- Añadir columna subcategoria
ALTER TABLE public.discipulo_perfiles
  ADD COLUMN IF NOT EXISTS subcategoria text;

-- Reemplazar constraint de categoria con las nuevas categorías
ALTER TABLE public.discipulo_perfiles
  DROP CONSTRAINT IF EXISTS discipulo_perfiles_categoria_check;

ALTER TABLE public.discipulo_perfiles
  ADD CONSTRAINT discipulo_perfiles_categoria_check
  CHECK (categoria IN (
    'Filosofía','Artes','Oficios','Deportes','Negocios',
    'Salud','Relaciones','Tecnología','Aprendizaje',
    'Espiritualidad','Estilo de vida','Otra'
  ));
