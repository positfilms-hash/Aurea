/**
 * auth.js — utilidades de sesión compartidas
 * Importar con: import { getSession, requireAuth, signOut } from './auth.js';
 */
import { supabase } from './supabase.js';

/** Devuelve la sesión activa o null */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Devuelve el usuario actual o null */
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/**
 * Redirige a login.html si no hay sesión activa.
 * Siempre refresca el rol desde Supabase para mantener el nav y el
 * tema actualizados (la query es mínima: SELECT rol WHERE id = $1).
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }

  try {
    const { data: p } = await supabase.from('profiles')
      .select('rol').eq('id', session.user.id).single();

    if (p?.rol) {
      const rolAnterior = localStorage.getItem('aurea-rol');
      const rolActual   = p.rol;

      // Siempre actualizar la caché
      localStorage.setItem('aurea-rol', rolActual);

      // Si el rol ha cambiado → aplicar tema correcto y recargar para sincronizar nav
      if (rolActual !== rolAnterior) {
        if (rolActual === 'discipulo') {
          if (typeof aureaSetTema === 'function') aureaSetTema('arena');
        } else if (rolActual === 'maestro') {
          if (typeof aureaSetTema === 'function') aureaSetTema('dark');
        }
        // Recargar para que renderNavAuth() lea el rol actualizado y muestre el dropdown correcto
        window.location.reload();
        return session; // no continuar con el resto de init antes del reload
      }
    }
  } catch { /* silencioso */ }

  return session;
}

/** Cierra la sesión y redirige al inicio */
export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}
