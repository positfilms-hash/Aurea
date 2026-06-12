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

/**
 * Decide a dónde llevar al usuario tras autenticarse (login o registro con
 * sesión inmediata). Devuelve una URL relativa. Usado por login.html y
 * registro.html para no duplicar la lógica de bienvenida (spec 039).
 *
 * - Si ya vio el onboarding (flag por usuario, ver claveOnboardingVisto) →
 *   discover.
 * - Si su perfil ya tiene contenido propio (frase, disciplina real de maestro o
 *   disciplina buscada de discípulo) → es un usuario establecido → discover.
 * - En otro caso (recién registrado, perfil vacío) → onboarding.
 *
 * Nota: el trigger handle_new_user crea maestro_perfiles/discipulo_perfiles al
 * registrarse (con placeholders), así que la mera existencia de esas filas NO
 * indica que el usuario esté configurado: se mira el contenido real.
 */

/**
 * Clave de localStorage del flag "onboarding visto", POR USUARIO: en un
 * navegador compartido, el flag de una cuenta no debe saltarse la bienvenida
 * de otra (hallazgo del review de Codex sobre la spec 039/041).
 */
export function claveOnboardingVisto(uid) {
  return `aurea-onboarding-visto:${uid}`;
}

export async function destinoPostAuth() {
  const session = await getSession();
  if (!session) return 'login.html';
  if (localStorage.getItem(claveOnboardingVisto(session.user.id))) return 'discover.html';

  try {
    const uid = session.user.id;
    const { data: p } = await supabase.from('profiles')
      .select('rol, frase').eq('id', uid).single();
    if (p?.frase && p.frase.trim()) return 'discover.html';

    const rol = p?.rol || 'discipulo';
    if (rol === 'maestro' || rol === 'ambos') {
      const { data: m } = await supabase.from('maestro_perfiles')
        .select('disciplina, categoria').eq('id', uid).maybeSingle();
      const real = m && m.disciplina && m.disciplina !== 'Sin especificar'
        && m.categoria && m.categoria !== 'Otra';
      if (real) return 'discover.html';
    }
    if (rol === 'discipulo' || rol === 'ambos') {
      const { data: d } = await supabase.from('discipulo_perfiles')
        .select('disciplina_buscada').eq('id', uid).maybeSingle();
      if (d && d.disciplina_buscada && d.disciplina_buscada.trim()) return 'discover.html';
    }
  } catch {
    // Ante cualquier fallo de lectura, no atrapamos al usuario: a discover.
    return 'discover.html';
  }
  return 'onboarding.html';
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
