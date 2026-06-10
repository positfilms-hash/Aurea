/**
 * favoritos.js — maestros guardados (spec 037)
 *
 * Los favoritos son privados: la RLS de `maestros_favoritos` solo deja a
 * cada usuario ver/crear/borrar los suyos. Aquí no hay lógica de permisos
 * de UI (quién puede guardar): eso lo decide cada página. No se notifica
 * al maestro al guardar.
 *
 * Importar con: import { fetchFavoritos, guardarFavorito, ... } from './favoritos.js';
 */
import { supabase } from './supabase.js';

/**
 * Devuelve un Set con los `maestro_id` que el usuario tiene guardados.
 * Ante error devuelve un Set vacío (el botón arranca en "Guardar").
 */
export async function fetchFavoritos(userId) {
  if (!userId) return new Set();
  const { data, error } = await supabase
    .from('maestros_favoritos')
    .select('maestro_id')
    .eq('user_id', userId);
  if (error) {
    console.warn('Error cargando favoritos:', error.message || error);
    return new Set();
  }
  return new Set((data || []).map((r) => r.maestro_id));
}

/**
 * Guarda un maestro. Devuelve true si quedó guardado.
 * Un duplicado (unique_violation 23505) se trata como éxito idempotente.
 */
export async function guardarFavorito(userId, maestroId) {
  if (!userId || !maestroId || userId === maestroId) return false;
  const { error } = await supabase
    .from('maestros_favoritos')
    .insert({ user_id: userId, maestro_id: maestroId });
  if (error && error.code !== '23505') {
    console.warn('Error guardando favorito:', error.message || error);
    return false;
  }
  return true;
}

/** Quita un maestro de guardados. Devuelve true si quedó quitado. */
export async function quitarFavorito(userId, maestroId) {
  if (!userId || !maestroId) return false;
  const { error } = await supabase
    .from('maestros_favoritos')
    .delete()
    .eq('user_id', userId)
    .eq('maestro_id', maestroId);
  if (error) {
    console.warn('Error quitando favorito:', error.message || error);
    return false;
  }
  return true;
}

/**
 * Devuelve los maestros guardados con los datos para una tarjeta, más
 * recientes primero y como máximo `limite`. Lanza si hay error de red/RLS
 * (la página distingue cargando / vacío / error).
 *
 * Descarta favoritos cuyo perfil ya no tiene fila en `maestro_perfiles`
 * (dejó de ser maestro): solo se listan maestros reales.
 */
export async function fetchFavoritosConPerfil(userId, limite = 6) {
  if (!userId) return [];

  const { data: favs, error } = await supabase
    .from('maestros_favoritos')
    .select('maestro_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limite);
  if (error) throw error;

  const ids = (favs || []).map((f) => f.maestro_id);
  if (!ids.length) return [];

  const { data: maestros, error: e2 } = await supabase
    .from('maestro_perfiles')
    .select('id, disciplina, categoria, profiles (nombre, apellido, avatar_url, avatar_color)')
    .in('id', ids);
  if (e2) throw e2;

  // Mantener el orden por created_at desc y descartar los que ya no son maestros.
  const byId = new Map((maestros || []).map((m) => [m.id, m]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}
