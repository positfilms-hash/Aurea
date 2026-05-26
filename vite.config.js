import { defineConfig } from 'vite';

export default defineConfig({
  // Raíz de los archivos HTML/CSS/JS
  root: 'aurea-prototipo/aurea',
  // process.cwd() devuelve la carpeta desde donde se ejecuta npm run dev
  // que siempre es la raíz del proyecto, donde vive el .env
  envDir: process.cwd(),
});
