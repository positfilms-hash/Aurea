import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readdirSync, copyFileSync, mkdirSync } from 'fs';

const ROOT = resolve(process.cwd(), 'aurea-prototipo/aurea');

// Todas las páginas HTML como entry points para el build multi-página
const htmlEntries = Object.fromEntries(
  readdirSync(ROOT)
    .filter(f => f.endsWith('.html'))
    .map(f => [f.replace('.html', ''), resolve(ROOT, f)])
);

// Plugin: copia los scripts legacy (sin type="module") a dist/js/
function copyLegacyScripts() {
  return {
    name: 'copy-legacy-scripts',
    apply: 'build',
    closeBundle() {
      const destDir = resolve(ROOT, 'dist/js');
      mkdirSync(destDir, { recursive: true });
      for (const file of ['scale.js', 'components.js']) {
        copyFileSync(resolve(ROOT, 'js', file), resolve(destDir, file));
      }
    },
  };
}

export default defineConfig({
  plugins: [copyLegacyScripts()],
  // Raíz de los archivos HTML/CSS/JS
  root: ROOT,
  // Leer .env desde la raíz del proyecto (donde está package.json)
  envDir: process.cwd(),
  build: {
    // Permite top-level await del SDK de Supabase (Chrome/Firefox/Safari modernos)
    target: 'esnext',
    rollupOptions: {
      // Compilar todas las páginas HTML, no solo index.html
      input: htmlEntries,
    },
  },
});
