// Utilidades compartidas del smoke E2E (spec 040).
// Sin login, sin Supabase, sin datos reales: solo carga de páginas y navegación.

/**
 * Empieza a recolectar errores graves de la página: excepciones no capturadas
 * (`pageerror`) y mensajes `console.error`. Llamar ANTES de page.goto().
 * Devuelve la lista viva (se va llenando) para afirmar sobre ella al final.
 *
 * Se ignora el ruido conocido que no indica fallo de la página:
 * - favicon 404 (las páginas no declaran favicon; el navegador lo pide igual)
 * - fallos de red hacia Supabase (el smoke no debe depender de datos remotos;
 *   las páginas ya degradan a estados vacío/error sin romperse)
 */
export function recogerErroresGraves(page) {
  const errores = [];
  const esRuido = (texto) =>
    texto.includes('favicon') ||
    texto.includes('Failed to load resource') ||
    texto.includes('supabase');

  page.on('pageerror', (err) => {
    errores.push(`pageerror: ${err.message}`);
  });
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return; // warnings menores no hacen fallar
    const texto = msg.text();
    if (esRuido(texto)) return;
    errores.push(`console.error: ${texto}`);
  });
  return errores;
}

/** Viewports del smoke responsive (de CODEX.md). */
export const VIEWPORTS = [
  { name: 'movil-375', width: 375, height: 812 },
  { name: 'movil-430', width: 430, height: 932 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

/**
 * ¿Puede la página hacer scroll horizontal accidental? Intenta desplazarse y
 * mira si el scroll X se mueve. (El CSS global clipa overflow-x en móvil, así
 * que medir scrollWidth daría falsos positivos con contenido clipado a propósito.)
 */
export async function tieneScrollHorizontal(page) {
  return page.evaluate(() => {
    window.scrollTo(80, 0);
    const seMovio = window.scrollX > 0;
    window.scrollTo(0, 0);
    return seMovio;
  });
}
