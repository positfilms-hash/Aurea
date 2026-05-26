/* AUREA — Componentes globales JS */
const LOGO_URL = 'assets/logo.png';

function renderNavPublic(active=''){
  const pages=[{id:'index',label:'Inicio',href:'index.html'},{id:'como-funciona',label:'Cómo funciona',href:'como-funciona.html'},{id:'contacto',label:'Contacto',href:'contacto.html'},{id:'dona',label:'Dona',href:'dona.html'}];
  return `<nav class="nav"><a class="nav-logo" href="index.html"><img src="${LOGO_URL}" alt="Aurea"><span class="nav-wordmark">Aurea</span></a><div class="nav-links">${pages.map(p=>`<a class="nav-link${active===p.id?' active':''}" href="${p.href}">${p.label}</a>`).join('')}</div><a class="nav-link" href="login.html" style="font-size:11px;letter-spacing:0.08em;">Entrar</a><a class="nav-cta${active==='registro'?' active':''}" href="registro.html">Registro</a></nav>`;
}

function renderNavAuth(active='',user='RM'){
  const pages=[{id:'discover',label:'Discover',href:'discover.html'},{id:'relaciones',label:'Mis relaciones',href:'relaciones.html'},{id:'solicitudes',label:'Mis solicitudes',href:'solicitudes.html'},{id:'perfil',label:'Mi perfil',href:'perfil.html'},{id:'dona',label:'Dona',href:'dona.html'}];
  return `<nav class="nav"><a class="nav-logo" href="discover.html"><img src="${LOGO_URL}" alt="Aurea"><span class="nav-wordmark">Aurea</span></a><div class="nav-links">${pages.map(p=>`<a class="nav-link${active===p.id?' active':''}" href="${p.href}">${p.label}</a>`).join('')}</div><div class="nav-avatar">${user}</div><a href="logout.html" class="nav-link" style="font-size:10px;letter-spacing:0.1em;opacity:0.5;" title="Cerrar sesión">Salir</a></nav>`;
}

function renderFooter(){
  return `<footer class="footer"><div class="footer-top"><div><div class="footer-logo"><img src="${LOGO_URL}" alt="Aurea"><span class="footer-logo-name">Aurea</span></div><p class="footer-tagline">La cadena áurea del conocimiento. Gratuito siempre.</p></div><div><div class="footer-col-title">Plataforma</div><a class="footer-link" href="como-funciona.html">Cómo funciona</a><a class="footer-link" href="discover.html">Maestros</a><a class="footer-link" href="registro.html">Registro</a></div><div><div class="footer-col-title">Proyecto</div><a class="footer-link" href="dona.html">Dona</a><a class="footer-link" href="contacto.html">Contacto</a></div><div><div class="footer-col-title">Contacto</div><span class="footer-link">hola@aurea.app</span><span class="footer-link">incidencias@aurea.app</span><span class="footer-link">prensa@aurea.app</span></div></div><div class="footer-bottom"><span class="footer-copy">© 2026 Aurea · Todos los derechos reservados</span><div class="footer-legal"><a class="footer-legal-link" href="privacidad.html">Política de privacidad</a><a class="footer-legal-link" href="privacidad.html">Términos y condiciones</a><a class="footer-legal-link" href="privacidad.html">Cookies</a></div></div></footer>`;
}

const RESP={'prueba':'El periodo de prueba dura hasta 30 días y permite hasta 3 sesiones de videollamada. El chat es libre. Cualquiera puede aceptar o cancelar en cualquier momento.','discípulo':'Como maestro puedes tener entre 1 y 5 discípulos activos. Al llenarte tu perfil pasa a lista de espera.','plaza':'Las plazas se bloquean al aceptar un discípulo. Se liberan tras cancelar en prueba o tras 1 mes mínimo en relación consolidada.','constancia':'La constancia sube completando relaciones y baja si abandonas antes del mes mínimo.','solicitud':'Puedes enviar hasta 5 solicitudes activas (10 con Pro). Cada una puede requerir mensaje de motivación.','default':'Déjame buscarte la respuesta. Si necesitas más ayuda escríbenos a hola@aurea.app.'};

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
