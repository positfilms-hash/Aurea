/* AUREA — Componentes globales JS */
const LOGO_URL = 'assets/logo.png';

function renderNavPublic(active=''){
  const pages=[{id:'index',label:'Inicio',href:'index.html'},{id:'como-funciona',label:'Cómo funciona',href:'como-funciona.html'},{id:'contacto',label:'Contacto',href:'contacto.html'},{id:'dona',label:'Dona',href:'dona.html'}];
  return `<nav class="nav"><a class="nav-logo" href="index.html"><img src="${LOGO_URL}" alt="Aurea"><span class="nav-wordmark">Aurea</span></a><div class="nav-links">${pages.map(p=>`<a class="nav-link${active===p.id?' active':''}" href="${p.href}">${p.label}</a>`).join('')}</div><div style="display:flex;align-items:center;gap:8px;"><a class="nav-cta-outline" href="login.html">Entrar</a><a class="nav-cta${active==='registro'?' active':''}" href="registro.html">Registro</a></div></nav>`;
}

function renderNavAuth(active='', user='') {
  // Estado leído de localStorage — una sola vez para todo el nav
  const rol   = localStorage.getItem('aurea-rol')  || 'maestro';
  const tema  = localStorage.getItem('aurea-tema') || 'dark';
  const arena = rol === 'discipulo' || (rol === 'ambos' && tema === 'arena');
  const badge = arena ? 'Discípulo' : 'Maestro';

  // Dropdown "Mis relaciones" — el primer item cambia según la vista activa
  const relLabel  = arena ? 'Mis maestros' : 'Mis discípulos';
  const relActive = ['relaciones','solicitudes','historia'].includes(active);

  const relDd = `<div class="nav-rel-wrap" id="nav-rel-wrap">
    <button class="nav-link nav-dd-btn${relActive?' active':''}" onclick="toggleRelDd()">Mis relaciones <span class="nav-dd-arrow">▾</span></button>
    <div class="nav-dd nav-dd-left" id="nav-rel-dd">
      <a class="nav-dd-item${active==='relaciones'?' active':''}" href="relaciones.html">${relLabel}</a>
      <a class="nav-dd-item${active==='solicitudes'?' active':''}" href="solicitudes.html">Mis solicitudes</a>
      <div class="nav-dd-sep"></div>
      <a class="nav-dd-item${active==='historia'?' active':''}" href="historia.html">Mi historia</a>
    </div>
  </div>`;

  const pages = [
    {id:'discover', label:'Discover', href:'discover.html'},
    {id:'contacto', label:'Contacto', href:'contacto.html'},
    {id:'dona',     label:'Dona',     href:'dona.html'},
  ];

  // Contenido del dropdown según rol
  let ddItems = '';
  if (rol === 'ambos') {
    ddItems += `<button class="nav-dd-item${!arena?' active':''}" onclick="cambiarRolNav('maestro')">🎓 Maestro</button>`;
    ddItems += `<button class="nav-dd-item${arena?' active':''}" onclick="cambiarRolNav('discipulo')">📖 Discípulo</button>`;
    ddItems += `<div class="nav-dd-sep"></div>`;
  } else {
    const icon = rol === 'maestro' ? '🎓' : '📖';
    ddItems += `<div class="nav-dd-item" style="cursor:default;opacity:0.6;">${icon} ${badge}</div>`;
    ddItems += `<div class="nav-dd-sep"></div>`;
  }
  ddItems += `<a class="nav-dd-item" href="perfil.html">Ver mi perfil</a>`;
  ddItems += `<a class="nav-dd-item" href="perfil-edicion.html">Editar perfil</a>`;
  if (rol !== 'ambos') {
    const otro = rol === 'maestro' ? 'discipulo' : 'maestro';
    const otroLabel = rol === 'maestro' ? 'Discípulo' : 'Maestro';
    ddItems += `<div class="nav-dd-sep"></div>`;
    ddItems += `<a class="nav-dd-item nav-dd-add" href="perfil-edicion.html?add=${otro}">+ Añadir rol de ${otroLabel}</a>`;
  }

  return `<nav class="nav">
    <a class="nav-logo" href="discover.html"><img src="${LOGO_URL}" alt="Aurea"><span class="nav-wordmark">Aurea</span></a>
    <div class="nav-links">
      <a class="nav-link${active==='discover'?' active':''}" href="discover.html">Discover</a>
      ${relDd}
      <a class="nav-link${active==='mensajes'?' active':''}" href="mensajes.html" id="nav-msg-link">Mensajes <span id="nav-msg-badge" class="notif-badge" style="display:none;margin-left:3px;">0</span></a>
      ${pages.filter(p=>p.id!=='discover').map(p=>`<a class="nav-link${active===p.id?' active':''}" href="${p.href}">${p.label}</a>`).join('')}
    </div>
    <div class="nav-perfil-wrap" id="nav-perfil-wrap">
      <button class="nav-perfil-btn${active==='perfil'?' active':''}" id="nav-perfil-btn" onclick="toggleNavDd()">
        Mi perfil <span class="nav-rol-badge" id="nav-rol-badge">· ${badge}</span> <span class="nav-dd-arrow">▾</span>
      </button>
      <div class="nav-dd" id="nav-perfil-dd">${ddItems}</div>
    </div>
    <a href="logout.html" class="nav-link" style="font-size:10px;letter-spacing:0.1em;color:var(--text-secondary);" title="Cerrar sesión">Salir</a>
  </nav>`;
}

// — Nav dropdown Mis relaciones —
function toggleRelDd() {
  var dd = document.getElementById('nav-rel-dd');
  if (dd) {
    dd.classList.toggle('open');
    var dd2 = document.getElementById('nav-perfil-dd');
    if (dd2) dd2.classList.remove('open');
  }
}

// — Nav dropdown Mi perfil —
function toggleNavDd() {
  var dd = document.getElementById('nav-perfil-dd');
  if (dd) {
    dd.classList.toggle('open');
    var dd2 = document.getElementById('nav-rel-dd');
    if (dd2) dd2.classList.remove('open');
  }
}

function cambiarRolNav(rol) {
  var tema = rol === 'discipulo' ? 'arena' : 'dark';

  // 1. Cambiar tema y guardar preferencia
  if (typeof aureaSetTema === 'function') aureaSetTema(tema);

  // 2. Actualizar badge del botón "Mi perfil"
  var badge = document.getElementById('nav-rol-badge');
  if (badge) badge.textContent = '· ' + (rol === 'discipulo' ? 'Discípulo' : 'Maestro');

  // 3. Actualizar el primer item de "Mis relaciones" (Mis discípulos ↔ Mis maestros)
  var relFirstItem = document.querySelector('#nav-rel-dd .nav-dd-item');
  if (relFirstItem) relFirstItem.textContent = rol === 'discipulo' ? 'Mis maestros' : 'Mis discípulos';

  // 3. Actualizar estado activo en el dropdown
  document.querySelectorAll('#nav-perfil-dd .nav-dd-item').forEach(function(el) {
    if (el.tagName === 'BUTTON') {
      el.classList.toggle('active',
        (rol === 'maestro'   && el.textContent.includes('Maestro')) ||
        (rol === 'discipulo' && el.textContent.includes('Discípulo'))
      );
    }
  });

  // 4. Cerrar dropdown
  var dd = document.getElementById('nav-perfil-dd');
  if (dd) dd.classList.remove('open');

  // 5. Si estamos en perfil.html (tiene .role-btn), actualizar el contenido.
  //    setRole() ya NO llama a cambiarRolNav() → no hay recursión.
  var roleBtns = document.querySelectorAll('.role-btn:not(.add-role)');
  if (roleBtns.length > 0 && typeof window.setRole === 'function') {
    var targetBtn = null;
    roleBtns.forEach(function(btn) {
      var txt = btn.textContent.trim().toLowerCase();
      if ((rol === 'maestro'   && txt.indexOf('maestro')   !== -1) ||
          (rol === 'discipulo' && (txt.indexOf('discípulo') !== -1 || txt.indexOf('discipulo') !== -1))) {
        targetBtn = btn;
      }
    });
    if (targetBtn) window.setRole(rol, targetBtn);
  }
}

// Cerrar dropdowns al clicar fuera
document.addEventListener('click', function(e) {
  ['nav-perfil-wrap','nav-rel-wrap'].forEach(function(wrapId) {
    var wrap = document.getElementById(wrapId);
    if (wrap && !wrap.contains(e.target)) {
      var ddId = wrapId === 'nav-perfil-wrap' ? 'nav-perfil-dd' : 'nav-rel-dd';
      var dd = document.getElementById(ddId);
      if (dd) dd.classList.remove('open');
    }
  });
});

function renderFooter(){
  return `<footer class="footer"><div class="footer-top"><div><div class="footer-logo"><img src="${LOGO_URL}" alt="Aurea"><span class="footer-logo-name">Aurea</span></div><p class="footer-tagline">La cadena áurea del conocimiento. Gratuito siempre.</p></div><div><div class="footer-col-title">Plataforma</div><a class="footer-link" href="como-funciona.html">Cómo funciona</a><a class="footer-link" href="discover.html">Maestros</a><a class="footer-link" href="registro.html">Registro</a></div><div><div class="footer-col-title">Proyecto</div><a class="footer-link" href="dona.html">Dona</a><a class="footer-link" href="contacto.html">Contacto</a></div><div><div class="footer-col-title">Contacto</div><a class="footer-link" href="contacto.html">info.aureacatena@gmail.com</a><a class="footer-link" href="contacto.html">Formulario de contacto</a></div></div><div class="footer-bottom"><span class="footer-copy">© 2026 Aurea · Todos los derechos reservados</span><div class="footer-legal"><a class="footer-legal-link" href="privacidad.html">Política de privacidad</a><a class="footer-legal-link" href="privacidad.html">Términos y condiciones</a><a class="footer-legal-link" href="privacidad.html">Cookies</a></div></div></footer>`;
}

const RESP={'prueba':'El periodo de prueba dura hasta 30 días y permite hasta 3 sesiones de videollamada. El chat es libre. Cualquiera puede aceptar o cancelar en cualquier momento.','discípulo':'Como maestro puedes tener entre 1 y 5 discípulos activos. Al llenarte tu perfil pasa a lista de espera.','plaza':'Las plazas se bloquean al aceptar un discípulo. Se liberan tras cancelar en prueba o tras 1 mes mínimo en relación consolidada.','constancia':'La constancia sube completando relaciones y baja si abandonas antes del mes mínimo.','solicitud':'Puedes enviar hasta 5 solicitudes activas (10 con Pro). Cada una puede requerir mensaje de motivación.','default':'Déjame buscarte la respuesta. Si necesitas más ayuda escríbenos a info.aureacatena@gmail.com o usa el formulario de contacto.'};

function getResp(msg){const m=msg.toLowerCase();for(const[k,v]of Object.entries(RESP)){if(m.includes(k))return v;}return RESP.default;}

function renderChatWidget(){
  return `<button class="chat-fab" id="chat-fab" onclick="toggleChat()" title="Asistente Aurea">✦</button>
  <div class="chat-widget" id="chat-widget">
    <div style="padding:14px 16px;border-bottom:0.5px solid var(--border);display:flex;align-items:center;gap:10px;background:var(--night-soft);">
      <div style="width:32px;height:32px;border-radius:50%;background:var(--night-deep);border:0.5px solid var(--border-gold);display:flex;align-items:center;justify-content:center;font-size:14px;">✦</div>
      <div><div style="font-family:var(--font-serif);font-size:15px;font-weight:500;color:var(--text-primary);">Aurea · Asistente</div><div style="font-size:9px;font-weight:300;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-muted);">Asistente informativo</div></div>
      <button onclick="toggleChat()" style="margin-left:auto;font-size:18px;color:var(--text-faint);background:none;border:none;cursor:pointer;">×</button>
    </div>
    <div style="padding:9px 16px;background:var(--night-deep);border-bottom:0.5px solid var(--border);font-size:10px;font-weight:300;line-height:1.5;color:var(--text-muted);">No es un chat en vivo. No guarda mensajes ni contacta con el equipo. Para hablar con una persona, usa <a href="contacto.html" style="color:var(--gold);text-decoration:none;">Contacto</a>.</div>
    <div id="chat-messages" style="height:260px;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;">
      <div style="max-width:85%;align-self:flex-start;"><div style="padding:9px 12px;border-radius:2px 10px 10px 10px;font-size:12px;line-height:1.6;background:var(--night-soft);border:0.5px solid var(--border);color:var(--text-primary);">Hola. Soy un asistente informativo. Puedo orientarte sobre cómo funciona Aurea: el periodo de prueba, las solicitudes o consolidar una relación. Para hablar con una persona del equipo, escríbenos desde Contacto.</div><div style="font-size:9px;color:var(--text-ghost);margin-top:3px;">Aurea · Información</div></div>
    </div>
    <div id="chat-sugs" style="display:flex;flex-wrap:wrap;gap:5px;padding:0 14px 10px;">
      <span class="chip" onclick="chatSug(this,'¿Cómo funciona el periodo de prueba?')">¿Cómo funciona el periodo de prueba?</span>
      <span class="chip" onclick="chatSug(this,'¿Cuántas solicitudes puedo enviar?')">¿Cuántas solicitudes puedo enviar?</span>
      <span class="chip" onclick="chatSug(this,'¿Cómo mejoro mi constancia?')">¿Cómo mejoro mi constancia?</span>
    </div>
    <div style="display:flex;gap:8px;padding:10px 14px;border-top:0.5px solid var(--border);">
      <input id="chat-input" type="text" placeholder="Escribe tu pregunta…" style="flex:1;background:var(--night-soft);border:0.5px solid var(--border);border-radius:100px;padding:8px 12px;font-size:11px;color:var(--text-primary);outline:none;" onkeydown="if(event.key==='Enter')sendChat()">
      <button onclick="sendChat()" style="background:var(--gold);border:none;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;"><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M2 8L14 2L8 14L7 9L2 8Z" fill="#1C1410"/></svg></button>
    </div>
  </div>`;
}

function toggleChat(){document.getElementById('chat-widget').classList.toggle('open');}

function addChatMsg(text,who){
  const msgs=document.getElementById('chat-messages');
  const d=document.createElement('div');
  d.style.cssText=`max-width:85%;align-self:${who==='bot'?'flex-start':'flex-end'};display:flex;flex-direction:column;gap:3px;`;
  const b=document.createElement('div');
  b.style.cssText=who==='bot'?'padding:9px 12px;border-radius:2px 10px 10px 10px;font-size:12px;line-height:1.6;background:var(--night-soft);border:0.5px solid var(--border);color:var(--text-primary);':'padding:9px 12px;border-radius:10px 2px 10px 10px;font-size:12px;line-height:1.6;background:var(--night-deep);border:0.5px solid var(--border-gold);color:var(--text-primary);';
  b.textContent=text;
  const m=document.createElement('div');
  m.style.cssText=`font-size:9px;color:var(--text-ghost);${who==='user'?'text-align:right;':''}`;
  m.textContent=who==='bot'?'Aurea · Ahora':'Tú · Ahora';
  d.appendChild(b);d.appendChild(m);msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;
}

function sendChat(){const i=document.getElementById('chat-input');const v=i.value.trim();if(!v)return;document.getElementById('chat-sugs').style.display='none';addChatMsg(v,'user');i.value='';setTimeout(()=>addChatMsg(getResp(v),'bot'),600);}
function chatSug(el,text){document.getElementById('chat-sugs').style.display='none';addChatMsg(text,'user');setTimeout(()=>addChatMsg(getResp(text),'bot'),600);}

// — Mediador de incidencias: eliminado (spec 004). —
// Era un flujo simulado que decía "Incidencia enviada · INC-XXXX" sin
// guardar ni enviar nada. Hasta que exista un backend real de mediación,
// las incidencias se derivan a contacto.html (ver modal honesto en
// relaciones.html). No reintroducir un flujo que aparente abrir un caso
// si no hay envío real.

document.addEventListener('DOMContentLoaded',()=>{
  const c=document.getElementById('chat-container');
  if(c){c.innerHTML=renderChatWidget();}
  initChatFabDrag();
});

// — FAB: drag hacia las 4 esquinas + opacidad —
function initChatFabDrag() {
  var fab = document.getElementById('chat-fab');
  if (!fab) return;

  var GAP   = 28;
  var NAV_H = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 57;
  // Factor de zoom CSS (scale.js puede aplicar zoom al html)
  function getZoom() { return parseFloat(document.documentElement.style.zoom) || 1; }

  function posicionarEsquina(corner, animate) {
    var f = document.getElementById('chat-fab');
    var w = document.getElementById('chat-widget');
    if (!f) return;
    f.style.transition = animate
      ? 'left 0.35s cubic-bezier(0.34,1.56,0.64,1), right 0.35s cubic-bezier(0.34,1.56,0.64,1), top 0.35s cubic-bezier(0.34,1.56,0.64,1), bottom 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s'
      : 'opacity 0.2s';
    f.style.left   = corner.endsWith('l')   ? GAP+'px'          : 'auto';
    f.style.right  = corner.endsWith('r')   ? GAP+'px'          : 'auto';
    f.style.top    = corner.startsWith('t') ? (NAV_H+GAP)+'px'  : 'auto';
    f.style.bottom = corner.startsWith('b') ? GAP+'px'          : 'auto';
    if (w) {
      w.style.left   = corner.endsWith('l')   ? GAP+'px'             : 'auto';
      w.style.right  = corner.endsWith('r')   ? GAP+'px'             : 'auto';
      w.style.bottom = corner.startsWith('b') ? (GAP+52+12)+'px'     : 'auto';
      w.style.top    = corner.startsWith('t') ? (NAV_H+GAP+52+12)+'px' : 'auto';
    }
  }

  posicionarEsquina(localStorage.getItem('aurea-chat-corner') || 'br', false);

  var didMove = false;
  var startX, startY, origLeft, origTop;

  function onStart(e) {
    var touch = e.touches ? e.touches[0] : e;
    var zoom  = getZoom();
    startX = touch.clientX;
    startY = touch.clientY;
    didMove = false;

    // Obtener posición actual en CSS px (getBoundingClientRect devuelve px de viewport,
    // dividimos por zoom para convertir a px CSS donde están los estilos)
    var rect = fab.getBoundingClientRect();
    origLeft = rect.left / zoom;
    origTop  = rect.top  / zoom;

    fab.style.transition = 'opacity 0.2s';
    fab.style.left   = origLeft + 'px';
    fab.style.top    = origTop  + 'px';
    fab.style.right  = 'auto';
    fab.style.bottom = 'auto';

    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup',   onEnd);
    document.addEventListener('touchend',  onEnd);
  }

  function onMove(e) {
    e.preventDefault();
    var touch = e.touches ? e.touches[0] : e;
    var zoom  = getZoom();
    // clientX/Y están en viewport px; dividimos por zoom para tener CSS px
    var dx = (touch.clientX - startX) / zoom;
    var dy = (touch.clientY - startY) / zoom;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      didMove = true;
      fab.classList.add('dragging');
    }
    if (didMove) {
      fab.style.left = (origLeft + dx) + 'px';
      fab.style.top  = (origTop  + dy) + 'px';
    }
  }

  function onEnd() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('mouseup',   onEnd);
    document.removeEventListener('touchend',  onEnd);
    fab.classList.remove('dragging');

    if (!didMove) return; // fue un click

    // Detectar esquina más cercana (en viewport px, consistente con getBoundingClientRect)
    var rect   = fab.getBoundingClientRect();
    var cx     = rect.left + rect.width  / 2;
    var cy     = rect.top  + rect.height / 2;
    var w      = window.innerWidth;
    var h      = window.innerHeight;
    var corner = (cy < h / 2 ? 't' : 'b') + (cx < w / 2 ? 'l' : 'r');

    localStorage.setItem('aurea-chat-corner', corner);
    posicionarEsquina(corner, true);
  }

  fab.addEventListener('mousedown',  onStart);
  fab.addEventListener('touchstart', onStart, { passive: false });
}
