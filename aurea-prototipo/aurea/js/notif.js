/**
 * notif.js — Badges de notificación en el nav
 *
 * Comprueba en Supabase:
 *   • Solicitudes nuevas sin leer  → badge en "Mis solicitudes" (maestro)
 *   • Relaciones en estado 'prueba' → badge en "Mis relaciones" (ambos roles)
 */

import { supabase } from './supabase.js';

export async function checkNotificaciones() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const uid = session.user.id;

  // 1. Relaciones activas del usuario (para calcular mensajes no leídos)
  const { data: misRels } = await supabase
    .from('relaciones')
    .select('id')
    .or(`maestro_id.eq.${uid},discipulo_id.eq.${uid}`)
    .in('estado', ['prueba','consolidada']);

  const relIds = (misRels || []).map(r => r.id);

  const [solRes, relRes, msgData] = await Promise.all([
    // Solicitudes nuevas dirigidas a este maestro
    supabase.from('solicitudes')
      .select('*', { count: 'exact', head: true })
      .eq('maestro_id', uid)
      .eq('estado', 'nueva'),

    // Relaciones en prueba donde participa
    supabase.from('relaciones')
      .select('*', { count: 'exact', head: true })
      .or(`maestro_id.eq.${uid},discipulo_id.eq.${uid}`)
      .eq('estado', 'prueba'),

    // Mensajes no leídos de otros en las relaciones del usuario
    relIds.length
      ? supabase.from('mensajes')
          .select('relacion_id')
          .in('relacion_id', relIds)
          .neq('autor_id', uid)
          .is('leido_at', null)
      : Promise.resolve({ data: [] }),
  ]);

  const nuevasSolicitudes = solRes.count || 0;
  const enPrueba          = relRes.count || 0;
  const msgNoLeidos       = (msgData.data || []).length;

  if (nuevasSolicitudes > 0) _addBadge('solicitudes.html', nuevasSolicitudes);
  if (enPrueba > 0)          _addBadge('relaciones.html',  enPrueba);

  // Badge de mensajes en el nav item "Mensajes"
  if (msgNoLeidos > 0) {
    const msgBadge = document.getElementById('nav-msg-badge');
    if (msgBadge) {
      msgBadge.textContent = msgNoLeidos > 9 ? '9+' : msgNoLeidos;
      msgBadge.style.display = 'inline-flex';
    }
  }
}

function _addBadge(href, count) {
  // Busca el enlace por href exacto o que termine con el href
  const link = document.querySelector(`.nav-link[href="${href}"]`)
            || document.querySelector(`.nav-link[href$="${href}"]`);
  if (!link) return;
  // Evitar duplicados
  if (link.querySelector('.notif-badge')) return;

  const badge = document.createElement('span');
  badge.className  = 'notif-badge';
  badge.textContent = count > 9 ? '9+' : count;
  badge.style.cssText = [
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'min-width:16px',
    'height:16px',
    'padding:0 4px',
    'background:var(--gold)',
    'color:var(--night)',
    'font-size:8px',
    'font-weight:700',
    'font-family:var(--font-sans,sans-serif)',
    'border-radius:100px',
    'margin-left:5px',
    'vertical-align:middle',
    'line-height:1',
  ].join(';');

  link.appendChild(badge);
}
