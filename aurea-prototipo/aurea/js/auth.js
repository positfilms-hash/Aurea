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
 * Úsalo al inicio de cada página privada.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    window.location.href = 'login.html';
  }
  return session;
}

/** Cierra la sesión y redirige al inicio */
export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}
