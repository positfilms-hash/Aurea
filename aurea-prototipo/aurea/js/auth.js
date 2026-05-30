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

      // Si el rol ha cambiado (o no estaba cacheado) → actualizar tema y nav
      if (rolActual !== rolAnterior) {
        // Aplicar tema correcto para roles únicos
        if (rolActual === 'discipulo') {
          if (typeof aureaSetTema === 'function') aureaSetTema('arena');
        } else if (rolActual === 'maestro') {
          if (typeof aureaSetTema === 'function') aureaSetTema('dark');
        }
        // 'ambos': respetar aurea-tema ya guardado

        // Re-renderizar el nav para que el dropdown muestre el estado correcto
        const navEl = document.getElementById('nav-container');
        if (navEl && typeof renderNavAuth === 'function') {
          // Detectar la página activa desde la URL
          const page = window.location.pathname.split('/').pop()?.replace('.html','') || '';
          navEl.innerHTML = renderNavAuth(page);
        }
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
