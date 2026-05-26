/* AUREA — Escalado para pantallas grandes
   Usa screen.width (píxeles CSS fijos, no afectado por zoom)
   para escalar proporcionalmente en monitores de alta resolución. */
(function () {
  var sw = screen.width;
  var z = 1;
  if      (sw >= 3840) z = 2;
  else if (sw >= 3200) z = 1.75;
  else if (sw >= 2560) z = 1.5;
  if (z > 1) document.documentElement.style.zoom = String(z);
})();
