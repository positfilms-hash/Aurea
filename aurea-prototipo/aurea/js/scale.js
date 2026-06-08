/* AUREA — Escalado para pantallas grandes
   Usa screen.width (píxeles CSS fijos, no afectado por zoom)
   para escalar proporcionalmente en monitores de alta resolución.
   También expone --real-vh: el alto visible real en el sistema
   de coordenadas post-zoom, para que los layouts de columna
   puedan hacer scroll correctamente. */
(function () {
  // Ancho de contenido mínimo (px CSS) que queremos preservar tras el zoom.
  // Por debajo de esto el zoom causaría scroll horizontal y solapes, así que
  // se reduce el factor: en tablet/móvil o ventanas estrechas, z = 1.
  var MIN_CONTENT = 1280;

  function computeZoom() {
    var sw = screen.width;
    var vw = window.innerWidth || sw;
    var z = 1;
    if      (sw >= 3840) z = 2;
    else if (sw >= 3200) z = 1.75;
    else if (sw >= 2560) z = 1.5;
    // No ampliar si el viewport real no es lo bastante ancho.
    while (z > 1 && vw / z < MIN_CONTENT) z -= 0.25;
    return z < 1 ? 1 : z;
  }

  function apply() {
    var z = computeZoom();
    document.documentElement.style.zoom = z > 1 ? String(z) : '';
    // --real-vh: alto del viewport en coordenadas post-zoom
    document.documentElement.style.setProperty('--real-vh', (window.innerHeight / z) + 'px');
  }

  apply();
  // Recalcular en resize (cambio de ventana / orientación)
  window.addEventListener('resize', apply);

  // — Tema arena persistente —
  // Reglas de prioridad:
  //   rol=discipulo  → siempre arena
  //   rol=maestro    → siempre oscuro
  //   rol=ambos      → sigue la preferencia guardada (aurea-tema)
  //   sin rol        → sigue aurea-tema (fallback)
  var rol  = localStorage.getItem('aurea-rol');
  var tema = localStorage.getItem('aurea-tema');
  var arena = (rol === 'discipulo') ||
              (rol === 'ambos' && tema === 'arena') ||
              (!rol && tema === 'arena');
  if (arena) {
    document.documentElement.classList.add('theme-arena');
  } else {
    document.documentElement.classList.remove('theme-arena');
  }
})();

// Función global para cambiar tema desde cualquier página
// rol: 'maestro' | 'discipulo' | 'ambos' | null  (null = no actualizar)
function aureaSetTema(tema, rol) {
  if (rol)  localStorage.setItem('aurea-rol',  rol);
  if (tema === 'arena') {
    document.documentElement.classList.add('theme-arena');
    localStorage.setItem('aurea-tema', 'arena');
  } else {
    document.documentElement.classList.remove('theme-arena');
    localStorage.setItem('aurea-tema', 'dark');
  }
}
