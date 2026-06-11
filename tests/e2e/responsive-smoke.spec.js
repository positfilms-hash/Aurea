// Smoke responsive (spec 040): subset de páginas públicas en los 5 viewports
// de CODEX.md. Comprueba que no hay scroll horizontal accidental y que la
// nav y el CTA principal siguen visibles donde aplica.
import { test, expect } from '@playwright/test';
import { VIEWPORTS, tieneScrollHorizontal } from './helpers.js';

// Subset razonable: home, cómo funciona, login, registro y los dos perfiles
// públicos. perfil-maestro sin ?id muestra su estado "no encontrado" (responsive
// también). perfil-discipulo sin ?id redirige a solicitudes → login (es su
// comportamiento real), así que acaba en login: sin nav propia que comprobar.
const PAGINAS = [
  { ruta: '/', cta: '.hero-actions .btn-primary' },          // "Empezar ahora"
  { ruta: '/como-funciona.html', cta: null },
  { ruta: '/login.html', cta: '#btn-login', sinNav: true },
  { ruta: '/registro.html', cta: '#btn-next' },
  { ruta: '/perfil-maestro.html', cta: null },
  { ruta: '/perfil-discipulo.html', cta: null, sinNav: true }, // → redirige a login
];

for (const vp of VIEWPORTS) {
  test.describe(`viewport ${vp.name} (${vp.width}x${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const { ruta, cta, sinNav } of PAGINAS) {
      test(`${ruta} sin scroll horizontal y con UI base visible`, async ({ page }) => {
        await page.goto(ruta);
        await page.waitForLoadState('domcontentloaded');

        // 1. Sin scroll horizontal accidental.
        expect(await tieneScrollHorizontal(page), 'la página no debe desplazarse en horizontal').toBe(false);

        // 2. Header/nav visible (salvo páginas sin nav: login usa su propio
        //    split y perfil-discipulo sin id acaba redirigida a login).
        if (!sinNav) {
          await expect(page.locator('nav.nav')).toBeVisible();
        }

        // 3. CTA principal visible cuando la página tiene uno claro.
        if (cta) {
          await expect(page.locator(cta)).toBeVisible();
        }
      });
    }
  });
}
