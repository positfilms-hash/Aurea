/**
 * notif.js — Badges de notificación en tiempo real
 *
 * Exporta:
 *   checkNotificaciones()  — llamar al cargar la página
 *   refreshMsgBadge()      — llamar tras marcar mensajes como leídos
 */

import { supabase } from './supabase.js';

// Estado compartido del módulo
let _uid      = null;
let _relIds   = [];
let _msgCount = 0;
let _channel  = null;  // canal realtime activo

// ── Entrada principal ────────────────────────────────────────────────────────
export async function checkNotificaciones() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  _uid = session.user.id;

  // Relaciones activas del usuario (para filtrar mensajes)
  const { data: rels } = await supabase
    .from('relaciones').select('id')
    .or(`maestro_id.eq.${_uid},discipulo_id.eq.${_uid}`)
    .in('estado', ['prueba','consolidada']);
  _relIds = (rels || []).map(r => r.id);

  // Conteos iniciales en paralelo
  const [solRes, relRes, msgRes] = await Promise.all([
    supabase.from('solicitudes')
      .select('*', { count: 'exact', head: true })
      .eq('maestro_id', _uid).eq('estado', 'nueva'),

    supabase.from('relaciones')
      .select('*', { count: 'exact', head: true })
      .or(`maestro_id.eq.${_uid},discipulo_id.eq.${_uid}`)
      .eq('estado', 'prueba'),

    _relIds.length
      ? supabase.from('mensajes').select('id')
          .in('relacion_id', _relIds)
          .neq('autor_id', _uid)
          .is('leido_at', null)
      : Promise.resolve({ data: [] }),
  ]);

  if (solRes.count > 0) _addBadge('solicitudes.html', solRes.count);
  if (relRes.count > 0) _addBadge('relaciones.html',  relRes.count);

  _msgCount = (msgRes.data || []).length;
  _updateMsgBadge();

  // Suscripción realtime: mensajes nuevos
  _setupRealtime();
}

// ── Refrescar badge de mensajes (llamar tras marcar como leídos) ─────────────
export async function refreshMsgBadge() {
  if (!_uid) return;
  if (!_relIds.length) { _msgCount = 0; _updateMsgBadge(); return; }

  const { data } = await supabase.from('mensajes').select('id')
    .in('relacion_id', _relIds)
    .neq('autor_id', _uid)
    .is('leido_at', null);

  _msgCount = (data || []).length;
  _updateMsgBadge();
}

// ── Realtime ─────────────────────────────────────────────────────────────────
function _setupRealtime() {
  // Eliminar canal anterior si existe
  if (_channel) { supabase.removeChannel(_channel); _channel = null; }
  if (!_relIds.length) return;

  _channel = supabase.channel('aurea-notif-msgs')
    .on('postgres_changes', {
      event:  'INSERT',
      schema: 'public',
      table:  'mensajes',
    }, (payload) => {
      const msg = payload.new;
      // Solo mensajes del OTRO participante
      if (msg.autor_id === _uid) return;
      // Solo de relaciones del usuario
      if (!_relIds.includes(msg.relacion_id)) return;
      // Si el chat está abierto en esta relación, no contar (se marca leído al momento)
      if (_isChatOpen(msg.relacion_id)) return;

      _msgCount++;
      _updateMsgBadge();
    })
    .subscribe();
}

// Detecta si el usuario tiene abierto el chat de esa relación
function _isChatOpen(relId) {
  return window.location.pathname.includes('periodo-prueba') &&
         new URLSearchParams(window.location.search).get('id') === relId;
}

// ── Helpers DOM ──────────────────────────────────────────────────────────────
function _updateMsgBadge() {
  const badge = document.getElementById('nav-msg-badge');
  if (!badge) return;
  if (_msgCount > 0) {
    badge.textContent    = _msgCount > 9 ? '9+' : String(_msgCount);
    badge.style.display  = 'inline-flex';
  } else {
    badge.style.display  = 'none';
  }
}

function _addBadge(href, count) {
  const link = document.querySelector(`.nav-link[href="${href}"]`)
            || document.querySelector(`.nav-dd-item[href="${href}"]`)
            || document.querySelector(`.nav-link[href$="${href}"]`);
  if (!link || link.querySelector('.notif-badge')) return;
  const badge = document.createElement('span');
  badge.className   = 'notif-badge';
  badge.textContent = count > 9 ? '9+' : count;
  badge.style.cssText = [
    'display:inline-flex','align-items:center','justify-content:center',
    'min-width:16px','height:16px','padding:0 4px',
    'background:var(--gold)','color:var(--night)',
    'font-size:8px','font-weight:700','font-family:var(--font-sans,sans-serif)',
    'border-radius:100px','margin-left:5px','vertical-align:middle','line-height:1',
  ].join(';');
  link.appendChild(badge);
}
