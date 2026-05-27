/* AUREA — Escalado para pantallas grandes
   Usa screen.width (píxeles CSS fijos, no afectado por zoom)
   para escalar proporcionalmente en monitores de alta resolución.
   También expone --real-vh: el alto visible real en el sistema
   de coordenadas post-zoom, para que los layouts de columna
   puedan hacer scroll correctamente. */
(function () {
  var sw = screen.width;
  var z = 1;
  if      (sw >= 3840) z = 2;
  else if (sw >= 3200) z = 1.75;
  else if (sw >= 2560) z = 1.5;
  if (z > 1) document.documentElement.style.zoom = String(z);
  // --real-vh: alto del viewport en coordenadas post-zoom
  var realVh = window.innerHeight / z;
  document.documentElement.style.setProperty('--real-vh', realVh + 'px');
  // Actualizar en resize por si cambia la ventana
  window.addEventListener('resize', function () {
    document.documentElement.style.setProperty('--real-vh', (window.innerHeight / z) + 'px');
  });
})();
