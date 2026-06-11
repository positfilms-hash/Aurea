// Configuración mínima de Playwright para el smoke E2E de Aurea (spec 040).
// Solo Chromium. Levanta el dev server de Vite automáticamente (o reutiliza el
// que ya esté corriendo en local). No toca Supabase ni crea usuarios.
//
// Requisitos locales: `npx playwright install chromium` (una sola vez) y un
// `.env` válido en la raíz (el mismo que ya necesita `npm run dev`).
import { defineConfig, devices } from '@playwright/test';

const isWindows = process.platform === 'win32';

export default defineConfig({
  testDir: './tests/e2e',
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `${isWindows ? 'npm.cmd' : 'npm'} run dev -- --host 127.0.0.1 --port 5173`,
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
