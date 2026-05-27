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

  const [solRes, relRes] = await Promise.all([
    // Solicitudes nuevas dirigidas a este maestro
    supabase.from('solicitudes')
      .select('*', { count: 'exact', head: true })
      .eq('maestro_id', uid)
      .eq('estado', 'nueva'),

    // Relaciones en prueba donde participa (como maestro o discípulo)
    supabase.from('relaciones')
      .select('*', { count: 'exact', head: true })
      .or(`maestro_id.eq.${uid},discipulo_id.eq.${uid}`)
      .eq('estado', 'prueba'),
  ]);

  const nuevasSolicitudes = solRes.count || 0;
  const enPrueba          = relRes.count  || 0;

  if (nuevasSolicitudes > 0) _addBadge('solicitudes.html', nuevasSolicitudes);
  if (enPrueba > 0)          _addBadge('relaciones.html',  enPrueba);
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
