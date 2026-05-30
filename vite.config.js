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

// Plugin: copia scripts legacy y assets estáticos que components.js referencia por nombre fijo
function copyLegacyScripts() {
  return {
    name: 'copy-legacy-scripts',
    apply: 'build',
    closeBundle() {
      // JS legacy (sin type="module")
      const destJs = resolve(ROOT, 'dist/js');
      mkdirSync(destJs, { recursive: true });
      for (const file of ['scale.js', 'components.js']) {
        copyFileSync(resolve(ROOT, 'js', file), resolve(destJs, file));
      }
      // Logo sin hash — components.js lo referencia como 'assets/logo.png'
      const destAssets = resolve(ROOT, 'dist/assets');
      mkdirSync(destAssets, { recursive: true });
      copyFileSync(resolve(ROOT, 'assets/logo.png'), resolve(destAssets, 'logo.png'));
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
