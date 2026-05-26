import { defineConfig } from 'vite';

export default defineConfig({
  // Raíz de los archivos HTML/CSS/JS
  root: 'aurea-prototipo/aurea',
  // Buscar el archivo .env en la raíz del proyecto (donde está el package.json)
  // envDir es relativo a root: ../../ sube dos niveles hasta la raíz
  envDir: '../../',
});
