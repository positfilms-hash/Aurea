// Rutas privadas sin sesión (spec 040): cada una debe terminar en login.html
// sin mostrar contenido privado. Contexto limpio (Playwright da un contexto
// nuevo por test: sin cookies ni storage). No se hace login.
import { test, expect } from '@playwright/test';

// Páginas que usan requireAuth() (verificado en el código real).
const RUTAS_PRIVADAS = [
  '/perfil.html',
  '/perfil-edicion.html',
  '/solicitudes.html',
  '/relaciones.html',
  '/periodo-prueba.html',
  '/mensajes.html',
  '/historia.html',
  '/onboarding.html',
];

for (const ruta of RUTAS_PRIVADAS) {
  test(`privada ${ruta} sin sesión redirige a login`, async ({ page }) => {
    await page.goto(ruta);

    // requireAuth() redirige con window.location.href = 'login.html'.
    await page.waitForURL(/login\.html/, { timeout: 10_000 });

    // En login no debe quedar nada del contenido privado: se ve el formulario.
    await expect(page.locator('#l-email')).toBeVisible();
    await expect(page.locator('#l-password')).toBeVisible();

    // Y nada de marcadores de páginas privadas en el DOM actual.
    const cuerpo = await page.locator('body').innerText();
    expect(cuerpo).not.toContain('Mi cuenta');
    expect(cuerpo).not.toContain('Cerrando sesión');
  });
}
