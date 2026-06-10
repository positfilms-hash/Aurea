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

      // Actualizar caché
      localStorage.setItem('aurea-rol', rolActual);

      // Si el rol cambió, aplicar el tema correcto (sin reload)
      if (rolActual !== rolAnterior) {
        if (rolActual === 'discipulo') {
          if (typeof aureaSetTema === 'function') aureaSetTema('arena');
        } else if (rolActual === 'maestro') {
          if (typeof aureaSetTema === 'function') aureaSetTema('dark');
        }
        // 'ambos': respetar preferencia aurea-tema ya guardada
        // El nav se actualizará en la próxima carga de página (lee de localStorage)
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

/**
 * Envía un email con enlace de recuperación de contraseña.
 * No revela si el email existe (Supabase responde igual exista o no).
 * `redirectTo` debe estar en la allowlist de Supabase
 * (Authentication > URL Configuration > Redirect URLs).
 * Devuelve { data, error } del SDK; el llamador decide el mensaje neutral.
 */
export async function enviarRecuperacion(email, redirectTo) {
  return supabase.auth.resetPasswordForEmail(
    email,
    redirectTo ? { redirectTo } : undefined,
  );
}

/**
 * Actualiza la contraseña del usuario con sesión válida (sesión normal o de
 * recuperación establecida por el enlace). Devuelve { data, error } del SDK.
 */
export async function actualizarPassword(nuevaPassword) {
  return supabase.auth.updateUser({ password: nuevaPassword });
}
