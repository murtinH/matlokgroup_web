// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://matlok.cz',
  output: 'static',
  integrations: [
    sitemap({
      /**
       * Astro staví do složek (dist/matlok/index.html), takže by mapa webu
       * nabídla https://matlok.cz/matlok/ — s lomítkem na konci. Jenže
       * odkazy na webu ho nemají, kanonická adresa v Base.astro ho utíná
       * a Cloudflare taky (html_handling: drop-trailing-slash ve
       * wrangler.jsonc). Bez téhle úpravy by mapa webu nabízela Googlu
       * adresy, které se přesměrovávají, a on by místo indexace hlásil
       * „Stránka s přesměrováním".
       */
      serialize: (polozka) => {
        const adresa = new URL(polozka.url);
        adresa.pathname = adresa.pathname.replace(/\/+$/, '') || '/';
        return { ...polozka, url: adresa.href };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
