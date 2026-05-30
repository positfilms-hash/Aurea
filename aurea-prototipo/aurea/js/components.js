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
      <a class="nav-link${active==='mensajes'?' active':''}" href="mensajes.html" id="nav-msg-link">Mensajes<span id="nav-msg-badge" class="notif-badge" style="display:none;">0</span></a>
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

  // 2. Actualizar badge del botón
  var badge = document.getElementById('nav-rol-badge');
  if (badge) badge.textContent = '· ' + (rol === 'discipulo' ? 'Discípulo' : 'Maestro');

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
      <div><div style="font-family:var(--font-serif);font-size:15px;font-weight:500;color:var(--text-primary);">Aurea · Asistente</div><div style="font-size:9px;font-weight:300;letter-spacing:0.1em;text-transform:uppercase;color:var(--green);">● En línea</div></div>
      <button onclick="toggleChat()" style="margin-left:auto;font-size:18px;color:var(--text-faint);background:none;border:none;cursor:pointer;">×</button>
    </div>
    <div id="chat-messages" style="height:260px;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;">
      <div style="max-width:85%;align-self:flex-start;"><div style="padding:9px 12px;border-radius:2px 10px 10px 10px;font-size:12px;line-height:1.6;background:var(--night-soft);border:0.5px solid var(--border);color:var(--text-primary);">Hola. Soy el asistente de Aurea. ¿En qué puedo ayudarte?</div><div style="font-size:9px;color:var(--text-ghost);margin-top:3px;">Aurea · Ahora</div></div>
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

function renderMediador(){
  return `<div class="overlay" id="mediador-overlay">
    <div style="background:var(--night-mid);border:0.5px solid var(--border-soft);border-radius:16px;width:460px;max-height:580px;display:flex;flex-direction:column;overflow:hidden;">
      <div style="padding:18px 22px;border-bottom:0.5px solid var(--border);display:flex;align-items:center;gap:12px;background:var(--night-soft);flex-shrink:0;">
        <div style="width:36px;height:36px;border-radius:50%;background:var(--night-deep);border:0.5px solid #E8A03044;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">⚖</div>
        <div><div style="font-family:var(--font-serif);font-size:16px;font-weight:500;color:var(--text-primary);">Mediador de incidencias</div><div style="font-size:9px;font-weight:300;letter-spacing:0.1em;text-transform:uppercase;color:var(--amber);">Agente Aurea · Confidencial</div></div>
        <button onclick="closeMediador()" style="margin-left:auto;font-size:18px;color:var(--text-faint);background:none;border:none;cursor:pointer;">×</button>
      </div>
      <div id="med-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;"></div>
      <div id="med-options" style="display:flex;flex-direction:column;gap:6px;padding:0 16px 12px;">
        <button onclick="medOpt(this,'Conducta inapropiada')" style="font-size:11px;font-weight:300;color:var(--text-muted);border:0.5px solid var(--border);padding:8px 14px;border-radius:8px;cursor:pointer;background:none;text-align:left;">Conducta inapropiada</button>
        <button onclick="medOpt(this,'Abandono sin aviso')" style="font-size:11px;font-weight:300;color:var(--text-muted);border:0.5px solid var(--border);padding:8px 14px;border-radius:8px;cursor:pointer;background:none;text-align:left;">Abandono sin aviso del periodo de prueba</button>
        <button onclick="medOpt(this,'Suplantación de identidad')" style="font-size:11px;font-weight:300;color:var(--text-muted);border:0.5px solid var(--border);padding:8px 14px;border-radius:8px;cursor:pointer;background:none;text-align:left;">Suplantación de identidad</button>
        <button onclick="medOpt(this,'Otro')" style="font-size:11px;font-weight:300;color:var(--text-muted);border:0.5px solid var(--border);padding:8px 14px;border-radius:8px;cursor:pointer;background:none;text-align:left;">Otro motivo</button>
      </div>
      <div id="med-footer" style="display:none;padding:12px 16px;border-top:0.5px solid var(--border);flex-shrink:0;display:none;gap:8px;align-items:center;">
        <input id="med-input" type="text" placeholder="Escribe aquí…" style="flex:1;background:var(--night-soft);border:0.5px solid var(--border);border-radius:100px;padding:8px 14px;font-size:11px;color:var(--text-primary);outline:none;" onkeydown="if(event.key==='Enter')sendMed()">
        <button onclick="sendMed()" style="background:var(--amber);border:none;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;"><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M2 8L14 2L8 14L7 9L2 8Z" fill="#1C1410"/></svg></button>
      </div>
    </div>
  </div>`;
}

let _medStep=0,_medTipo='',_medDesc='',_medNombre='';

function openMediador(nombre){
  _medNombre=nombre||'este usuario';_medStep=0;_medTipo='';_medDesc='';
  document.getElementById('med-messages').innerHTML=`<div style="max-width:88%;align-self:flex-start;"><div style="padding:10px 14px;border-radius:2px 10px 10px 10px;font-size:12px;line-height:1.6;background:var(--night-soft);border:0.5px solid var(--border);color:var(--text-primary);">Hola. Estoy aquí para ayudarte a gestionar esta incidencia con <strong>${_medNombre}</strong>. Todo es confidencial.<br><br>¿Cuál es el tipo de incidencia?</div></div>`;
  document.getElementById('med-options').style.display='flex';
  document.getElementById('med-footer').style.display='none';
  document.getElementById('mediador-overlay').classList.add('open');
}

function closeMediador(){document.getElementById('mediador-overlay').classList.remove('open');}

function addMedMsg(text,who){
  const msgs=document.getElementById('med-messages');
  const d=document.createElement('div');
  d.style.cssText=`max-width:88%;align-self:${who==='bot'?'flex-start':'flex-end'};`;
  const b=document.createElement('div');
  b.style.cssText=who==='bot'?'padding:10px 14px;border-radius:2px 10px 10px 10px;font-size:12px;line-height:1.6;background:var(--night-soft);border:0.5px solid var(--border);color:var(--text-primary);':'padding:10px 14px;border-radius:10px 2px 10px 10px;font-size:12px;line-height:1.6;background:#2A1408;border:0.5px solid #E8A03022;color:var(--text-primary);';
  b.innerHTML=text;d.appendChild(b);msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;
}

function medOpt(btn,tipo){
  _medTipo=tipo;document.getElementById('med-options').style.display='none';addMedMsg(tipo,'user');_medStep=1;
  const f=document.getElementById('med-footer');f.style.display='flex';
  setTimeout(()=>addMedMsg(`Entendido — <em>${tipo}</em>. ¿Cuándo ocurrió y qué pasó exactamente?`,'bot'),500);
}

function sendMed(){
  const i=document.getElementById('med-input');const v=i.value.trim();if(!v)return;
  addMedMsg(v,'user');i.value='';_medStep++;
  setTimeout(()=>{
    if(_medStep===2){_medDesc=v;addMedMsg('Gracias. ¿Hay algo más que el equipo de Aurea deba tener en cuenta?','bot');}
    else if(_medStep>=3){
      document.getElementById('med-footer').style.display='none';
      addMedMsg('Perfecto. He recogido toda la información. Preparando el resumen…','bot');
      const ref='INC-'+Math.floor(Math.random()*9000+1000);
      setTimeout(()=>{
        const msgs=document.getElementById('med-messages');
        const r=document.createElement('div');
        r.style.cssText='background:var(--night-soft);border:0.5px solid #E8A03033;border-radius:10px;padding:14px;margin:4px 0;font-size:11px;color:var(--text-muted);line-height:1.8;';
        r.innerHTML=`<div style="font-size:10px;font-weight:400;letter-spacing:0.14em;text-transform:uppercase;color:var(--amber);margin-bottom:8px;">Resumen</div><strong style="color:var(--text-primary);">Tipo:</strong> ${_medTipo}<br><strong style="color:var(--text-primary);">Con:</strong> ${_medNombre}<br><strong style="color:var(--text-primary);">Descripción:</strong> ${_medDesc||v}<br><strong style="color:var(--text-primary);">Referencia:</strong> ${ref}`;
        msgs.appendChild(r);
        const btn=document.createElement('button');
        btn.style.cssText='width:calc(100% - 32px);font-family:var(--font-serif);font-size:15px;font-style:italic;color:var(--night);background:var(--amber);border:none;padding:12px;border-radius:100px;cursor:pointer;margin:8px 16px 16px;';
        btn.textContent='Enviar al equipo de Aurea';
        btn.onclick=()=>{btn.textContent='✓ Incidencia enviada';btn.style.background='var(--green)';btn.onclick=null;addMedMsg('Tu incidencia ha sido enviada con referencia <strong>'+ref+'</strong>. El equipo de Aurea la revisará en 24–48 horas.','bot');};
        msgs.appendChild(btn);msgs.scrollTop=msgs.scrollHeight;
      },800);
    }
  },500);
}

document.addEventListener('DOMContentLoaded',()=>{
  const c=document.getElementById('chat-container');
  if(c){c.innerHTML=renderChatWidget()+renderMediador();}
});
