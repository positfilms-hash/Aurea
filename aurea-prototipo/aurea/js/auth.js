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
 * Además cachea el rol del usuario en localStorage para que
 * scale.js pueda aplicar el tema correcto en todas las páginas.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  // Cachear rol si no está guardado todavía (o ha pasado >5 min)
  const rolCached = localStorage.getItem('aurea-rol');
  const rolTs     = parseInt(localStorage.getItem('aurea-rol-ts') || '0');
  const stale     = Date.now() - rolTs > 5 * 60 * 1000; // 5 minutos
  if (!rolCached || stale) {
    try {
      const { data: p } = await supabase.from('profiles')
        .select('rol').eq('id', session.user.id).single();
      if (p?.rol) {
        localStorage.setItem('aurea-rol',    p.rol);
        localStorage.setItem('aurea-rol-ts', String(Date.now()));
        // Aplicar tema solo si es un rol único (ambos lo gestiona perfil.html)
        if (p.rol === 'discipulo') aureaSetTema('arena', 'discipulo');
        else if (p.rol === 'maestro') aureaSetTema('dark', 'maestro');
        else localStorage.setItem('aurea-rol', 'ambos'); // ambos: no forzar tema
      }
    } catch { /* silencioso — usará el valor cacheado */ }
  }
  return session;
}

/** Cierra la sesión y redirige al inicio */
export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}
