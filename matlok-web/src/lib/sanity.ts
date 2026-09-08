import {createClient, type SanityClient} from '@sanity/client'
import {createImageUrlBuilder} from '@sanity/image-url'
import type {SanityImageSource} from '@sanity/image-url/lib/types/types'

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID
const dataset = import.meta.env.PUBLIC_SANITY_DATASET

if (!projectId || !dataset) {
  throw new Error(
    'Chybí PUBLIC_SANITY_PROJECT_ID nebo PUBLIC_SANITY_DATASET. ' +
      'Lokálně je zkopíruj z .env.example do .env.local, na Cloudflare je nastav v Environment variables.',
  )
}

export const sanity: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2025-08-15',
  // Při buildu čteme přes CDN — je to rychlejší a levnější, a build stejně
  // běží jednorázově. Ve vývoji CDN obcházíme: cachuje řádově minuty a člověk
  // by po úpravě v Studiu koukal na starý obsah a myslel si, že je něco rozbité.
  useCdn: !import.meta.env.DEV,
})

const builder = createImageUrlBuilder(sanity)

/** Základ URL obrázku ze Sanity CDN. Rozměry a formát dolaď řetězením. */
export function obrazek(zdroj: SanityImageSource) {
  return builder.image(zdroj).auto('format')
}

/**
 * Responzivní srcset. Prohlížeč si podle `sizes` vybere,
 * kterou šířku doopravdy stáhne — na mobilu tedy nestahuje verzi pro 4K.
 */
export function srcset(zdroj: SanityImageSource, sirky: number[]): string {
  return sirky.map((w) => `${obrazek(zdroj).width(w).url()} ${w}w`).join(', ')
}
