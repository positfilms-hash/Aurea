/**
 * AUREA — Categorías, subcategorías y widget de hashtags
 * Importar con: import { CATS, poblarSub, initHashtags } from './categorias.js';
 */

// Escape de texto de usuario para insertarlo de forma segura en innerHTML.
// Local al módulo: categorias.js es un módulo ES y no depende del orden de
// carga de components.js (donde vive el escHtml global).
function esc(s) {
  return (s == null ? '' : String(s)).replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
}

export const CATS = {
  'Filosofía':      ['Estoicismo','Budismo','Espiritualidad','Desarrollo personal','Liderazgo','Pensamiento crítico'],
  'Artes':          ['Música','Pintura','Escritura','Fotografía','Cine','Diseño'],
  'Oficios':        ['Carpintería','Cocina','Mecánica','Electricidad','Jardinería','Artesanía'],
  'Deportes':       ['Fitness','Artes marciales','Running','Yoga','Deportes de equipo','Rendimiento'],
  'Negocios':       ['Inversión','Emprendimiento','Ventas','Marketing','Finanzas personales','Ingresos online'],
  'Salud':          ['Nutrición','Pérdida de peso','Salud mental','Medicina','Longevidad','Bienestar'],
  'Relaciones':     ['Pareja','Seducción','Familia','Crianza','Comunicación','Desarrollo social'],
  'Tecnología':     ['Programación','Inteligencia artificial','Ciberseguridad','Diseño digital','Automatización','Creación de contenido'],
  'Aprendizaje':    ['Idiomas','Estudio','Memoria','Productividad','Oposiciones','Enseñanza'],
  'Espiritualidad': ['Meditación','Energía','Religión','Consciencia','Astrología','Desarrollo espiritual'],
  'Estilo de vida': ['Imagen personal','Moda','Viajes','Minimalismo','Lujo','Hogar'],
};

/**
 * Rellena el <select> de subcategoría según la categoría seleccionada.
 * @param {HTMLSelectElement} catSel  — el select de categoría
 * @param {HTMLSelectElement} subSel  — el select de subcategoría
 * @param {string}            selSub  — valor a preseleccionar
 */
export function poblarSub(catSel, subSel, selSub = '') {
  const subs = CATS[catSel.value] || [];
  subSel.innerHTML =
    '<option value="" disabled' + (selSub ? '' : ' selected') + '>Subcategoría</option>' +
    subs.map(s => `<option value="${s}"${s === selSub ? ' selected' : ''}>${s}</option>`).join('');
  subSel.disabled = !subs.length;
  if (selSub && subs.includes(selSub)) subSel.value = selSub;
}

/**
 * Inicializa un widget de hashtags interactivo.
 *
 * @param {object} opts
 *   containerId  — id del <div> contenedor
 *   initial      — array de strings con los tags iniciales
 *   supabase     — cliente supabase para sugerencias (opcional)
 *   onChange     — callback(tags[]) llamado al cambiar
 */
export function initHashtags({ containerId, initial = [], supabase = null, onChange = null }) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return { getTags: () => [] };

  let tags = initial.map(t => t.startsWith('#') ? t : '#' + t).filter(Boolean);
  let allSugs = [];   // caché de hashtags del sistema
  let sugTimer = null;

  wrap.innerHTML = `
    <div class="ht-box" id="${containerId}-box">
      <span class="ht-chips" id="${containerId}-chips"></span>
      <input class="ht-input" id="${containerId}-inp" type="text"
             placeholder="Escribe y pulsa Enter o coma…" autocomplete="off" maxlength="32">
    </div>
    <div class="ht-sugs" id="${containerId}-sugs"></div>`;

  const inp  = document.getElementById(`${containerId}-inp`);
  const sugsEl = document.getElementById(`${containerId}-sugs`);

  // ── Cargar sugerencias del sistema (una sola vez) ──────────────────────
  async function cargarSugs() {
    if (!supabase || allSugs.length) return;
    try {
      const [m, d] = await Promise.all([
        supabase.from('maestro_perfiles').select('hashtags').not('hashtags','is',null),
        supabase.from('discipulo_perfiles').select('hashtags').not('hashtags','is',null),
      ]);
      const freq = new Map();
      [...(m.data||[]), ...(d.data||[])].forEach(r =>
        (r.hashtags||[]).forEach(h => freq.set(h, (freq.get(h)||0)+1))
      );
      allSugs = [...freq.entries()].sort((a,b)=>b[1]-a[1]).map(e=>e[0]);
    } catch { /* silencioso */ }
  }
  if (supabase) cargarSugs();

  // ── Render chips ──────────────────────────────────────────────────────
  function render() {
    document.getElementById(`${containerId}-chips`).innerHTML =
      tags.map((t,i) =>
        `<span class="ht-chip">${esc(t)}<button type="button" class="ht-del" data-i="${i}">×</button></span>`
      ).join('');
    if (onChange) onChange([...tags]);
  }

  // ── Añadir tag ─────────────────────────────────────────────────────────
  function addTag(raw) {
    let t = raw.trim().replace(/,/g,'').replace(/\s+/g,'-');
    // Solo letras (incl. acentos), números y guiones: descarta <>"'& y demás
    // puntuación que podría usarse para inyectar marcado.
    t = t.replace(/[^0-9A-Za-zÀ-ſ#-]/g, '');
    if (!t) return;
    if (!t.startsWith('#')) t = '#' + t;
    t = t.toLowerCase();
    if (tags.includes(t) || tags.length >= 8) return;
    tags.push(t);
    render();
    inp.value = '';
    hideSugs();
  }

  // ── Sugerencias ────────────────────────────────────────────────────────
  function mostrarSugs(q) {
    const lower = q.toLowerCase();
    const matches = allSugs
      .filter(h => h.toLowerCase().includes(lower) && !tags.includes(h))
      .slice(0, 6);
    if (!matches.length) { hideSugs(); return; }
    sugsEl.innerHTML = matches.map(h =>
      `<button type="button" class="ht-sug">${esc(h)}</button>`
    ).join('');
    sugsEl.classList.add('open');
  }
  function hideSugs() { sugsEl.innerHTML=''; sugsEl.classList.remove('open'); }

  // ── Eventos ────────────────────────────────────────────────────────────
  inp.addEventListener('keydown', e => {
    if ((e.key==='Enter'||e.key===',') && inp.value.trim()) { e.preventDefault(); addTag(inp.value); }
    if (e.key==='Backspace' && !inp.value && tags.length) { tags.pop(); render(); }
  });

  inp.addEventListener('input', () => {
    clearTimeout(sugTimer);
    const q = inp.value.trim().replace(/^#/,'');
    if (!q) { hideSugs(); return; }
    sugTimer = setTimeout(() => mostrarSugs(q), 150);
  });

  inp.addEventListener('focus', () => { if (allSugs.length===0 && supabase) cargarSugs(); });

  sugsEl.addEventListener('click', e => {
    const btn = e.target.closest('.ht-sug');
    if (btn) addTag(btn.textContent.replace(/^#/,''));
  });

  wrap.addEventListener('click', e => {
    const del = e.target.closest('.ht-del');
    if (del) { tags.splice(+del.dataset.i, 1); render(); }
    else inp.focus();
  });

  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) hideSugs();
  }, true);

  render();
  return { getTags: () => [...tags] };
}
