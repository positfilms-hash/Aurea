// Smoke de páginas públicas (spec 040): cada ruta carga, tiene contenido y no
// lanza errores graves. Sin sesión, sin Supabase, sin datos reales.
import { test, expect } from '@playwright/test';
import { recogerErroresGraves } from './helpers.js';

// Rutas públicas prioritarias (CODEX.md). Sin ?id, perfil-maestro muestra su
// estado "no encontrado" y perfil-discipulo redirige a solicitudes → login
// (comportamiento real): en ambos casos debe acabar en una página limpia
// de Aurea sin errores graves, que es lo que valida este smoke.
const RUTAS_PUBLICAS = [
  '/',
  '/index.html',
  '/como-funciona.html',
  '/registro.html',
  '/login.html',
  '/contacto.html',
  '/perfil-maestro.html',
  '/perfil-discipulo.html',
  '/privacidad.html',
  '/cookies.html',
  '/aviso-legal.html',
];

for (const ruta of RUTAS_PUBLICAS) {
  test(`pública ${ruta} carga sin errores graves`, async ({ page }) => {
    const errores = recogerErroresGraves(page);
    await page.goto(ruta);

    // El título existe y es de Aurea (todas las páginas lo declaran).
    await expect(page).toHaveTitle(/Aurea/i);

    // El body tiene contenido real (no página en blanco).
    const texto = (await page.locator('body').innerText()).trim();
    expect(texto.length).toBeGreaterThan(20);

    // Dar un margen a los módulos asíncronos antes de evaluar errores.
    await page.waitForTimeout(500);
    expect(errores).toEqual([]);
  });
}

test('logout.html no expone contenido y redirige a home', async ({ page }) => {
  await page.goto('/logout.html');
  // Redirige limpiamente a index (sin sesión también pasa por signOut + redirect).
  await page.waitForURL(/index\.html|\/$/, { timeout: 10_000 });
  await expect(page).toHaveTitle(/Aurea/i);
});

test.describe('navegación desde home', () => {
  test('enlaces de la nav pública visibles y navegan', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav.nav');
    await expect(nav).toBeVisible();

    // Enlaces esperados en la nav pública de la home.
    const enlaces = [
      { texto: 'Cómo funciona', destino: /como-funciona\.html/ },
      { texto: 'Contacto', destino: /contacto\.html/ },
      { texto: 'Entrar', destino: /login\.html/ },
      { texto: 'Registro', destino: /registro\.html/ },
    ];
    for (const { texto, destino } of enlaces) {
      await page.goto('/');
      const enlace = page.locator('nav.nav').getByText(texto, { exact: false }).first();
      await expect(enlace).toBeVisible();
      await enlace.click();
      await page.waitForURL(destino);
    }
  });
});

test.describe('formularios usables (sin enviar)', () => {
  test('login muestra email, contraseña y botón principal', async ({ page }) => {
    await page.goto('/login.html');
    await expect(page.locator('#l-email')).toBeVisible();
    await expect(page.locator('#l-password')).toBeVisible();
    await expect(page.locator('#btn-login')).toBeVisible();
    // No se envía el formulario: no se crean usuarios ni sesiones.
  });

  test('registro muestra selector de rol y luego los campos principales', async ({ page }) => {
    await page.goto('/registro.html');
    // Paso 1: las tres tarjetas de rol y el botón de continuar.
    await expect(page.locator('.rol-card')).toHaveCount(3);
    const continuar = page.locator('#btn-next');
    await expect(continuar).toBeVisible();
    await expect(continuar).toBeDisabled();

    // Elegir un rol habilita continuar; pasar al paso 2 muestra los campos.
    await page.locator('.rol-card').first().click();
    await expect(continuar).toBeEnabled();
    await continuar.click();
    await expect(page.locator('#f-nombre')).toBeVisible();
    await expect(page.locator('#f-email')).toBeVisible();
    await expect(page.locator('#f-password')).toBeVisible();
    // No se rellena ni se envía: cero usuarios creados.
  });
});
