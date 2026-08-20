// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://sinapsiskinesio.com.ar',
  // /orientador queda fuera del sitemap mientras el contenido clínico no esté validado
  // (la página además va con noindex). Al aprobarlo, borrar el filtro.
  integrations: [sitemap({ filter: (page) => !page.includes('/orientador') })],
  vite: {
    plugins: [tailwindcss()],
  },
});
