/**
 * notif.js — Notificaciones in-app (tabla `notificaciones`)
 *
 * Exporta:
 *   checkNotificaciones()  — llamar al cargar cada página autenticada
 *   refreshNotifBadge()    — recuenta no leídas y actualiza el badge
 *   refreshMsgBadge()      — alias retrocompatible de refreshNotifBadge()
 *
 * El badge global (campana del nav) cuenta solo notificaciones no leídas.
 * Persiste (lee de la tabla) y se actualiza por Realtime si está disponible.
 */

import { supabase } from './supabase.js';

let _uid = null;
let _channel = null;

const _ALLOW_URLS = ['solicitudes.html', 'relaciones.html', 'mensajes.html', 'perfil.html'];

// ── Entrada principal ────────────────────────────────────────────────────────
export async function checkNotificaciones() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  _uid = session.user.id;
  await _refrescarTodo();
  _setupRealtime();
}

// Recuenta no leídas y actualiza el badge.
export async function refreshNotifBadge() {
  if (!_uid) return;
  const { count } = await supabase
    .from('notificaciones')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', _uid)
    .is('leida_at', null);
  _updateBadge(count || 0);
}

// Compatibilidad: antes refrescaba el badge de mensajes; ahora el de notificaciones.
export const refreshMsgBadge = refreshNotifBadge;

// ── Internos ─────────────────────────────────────────────────────────────────
async function _refrescarTodo() {
  await refreshNotifBadge();
  await _cargarLista();
}

async function _cargarLista() {
  const listEl = document.getElementById('nav-notif-list');
  if (!listEl) return;
  const { data, error } = await supabase
    .from('notificaciones')
    .select('id, titulo, cuerpo, url, leida_at, created_at')
    .eq('user_id', _uid)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    listEl.innerHTML = '<div class="nav-notif-empty">No se pudieron cargar las notificaciones.</div>';
    return;
  }
  if (!data || !data.length) {
    listEl.innerHTML = '<div class="nav-notif-empty">No tienes notificaciones.</div>';
    return;
  }
  listEl.innerHTML = data.map(n => {
    const url = _safeUrl(n.url);
    return `<a class="nav-notif-item${n.leida_at ? '' : ' unread'}" href="${url}"
       onclick="return aureaAbrirNotif(event,'${n.id}','${url}')">
      <div class="nav-notif-item-title">${_esc(n.titulo)}</div>
      ${n.cuerpo ? `<div class="nav-notif-item-body">${_esc(n.cuerpo)}</div>` : ''}
      <div class="nav-notif-item-date">${_fechaRel(n.created_at)}</div>
    </a>`;
  }).join('');
}

function _updateBadge(n) {
  // Campana de la nav superior + badge de la barra inferior móvil (spec 020).
  // Mismo recuento de notificaciones en ambos sitios (consistente, no duplicado
  // contradictorio).
  const txt = n > 9 ? '9+' : String(n);
  ['nav-notif-badge', 'tab-notif-badge'].forEach(id => {
    const b = document.getElementById(id);
    if (!b) return;
    if (n > 0) { b.textContent = txt; b.style.display = 'inline-flex'; }
    else b.style.display = 'none';
  });
}

function _setupRealtime() {
  if (_channel) { supabase.removeChannel(_channel); _channel = null; }
  _channel = supabase.channel('aurea-notificaciones')
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'notificaciones',
      filter: `user_id=eq.${_uid}`,
    }, () => { _refrescarTodo(); })
    .subscribe();
}

// ── Acciones globales (usadas desde el dropdown del nav) ──────────────────────
// Marca la notificación como leída y navega SIN bloquear: navega cuando el
// update termina o, como muy tarde, a los 600 ms (lo que ocurra antes).
window.aureaAbrirNotif = function (ev, id, url) {
  if (ev) ev.preventDefault();
  const dest = _safeUrl(url);
  let navegado = false;
  const ir = () => { if (!navegado) { navegado = true; window.location.href = dest; } };
  supabase.from('notificaciones')
    .update({ leida_at: new Date().toISOString() }).eq('id', id)
    .then(ir, ir);          // navega al terminar (éxito o error)
  setTimeout(ir, 600);      // o como máximo a los 600 ms si la request se cuelga
  return false;
};

window.marcarTodasLeidas = async function () {
  if (!_uid) return;
  await supabase.from('notificaciones')
    .update({ leida_at: new Date().toISOString() })
    .eq('user_id', _uid).is('leida_at', null);
  await _refrescarTodo();
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function _esc(s) {
  return (typeof escHtml === 'function') ? escHtml(s) : (s == null ? '' : String(s));
}
function _safeUrl(u) {
  return _ALLOW_URLS.includes(u) ? u : 'mensajes.html';
}
function _fechaRel(iso) {
  const d = Math.round((Date.now() - new Date(iso)) / 86400000);
  if (d <= 0) return 'Hoy';
  if (d === 1) return 'Ayer';
  if (d < 7) return `Hace ${d} días`;
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}
