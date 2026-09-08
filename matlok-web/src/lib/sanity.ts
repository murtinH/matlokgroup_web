import {createClient, type SanityClient} from '@sanity/client'
import {createImageUrlBuilder} from '@sanity/image-url'
import {SANITY_API_VERZE, SANITY_DATASET, SANITY_PROJECT_ID} from './konfigurace'

export const sanity: SanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERZE,
  // Při buildu čteme přes CDN — je to rychlejší a levnější, a build stejně
  // běží jednorázově. Ve vývoji CDN obcházíme: cachuje řádově minuty a člověk
  // by po úpravě v Studiu koukal na starý obsah a myslel si, že je něco rozbité.
  useCdn: !import.meta.env.DEV,
})

/** Obrázek ze Sanity: buď reference na asset, nebo přímo asset. */
export type Obrazek = Parameters<ReturnType<typeof createImageUrlBuilder>['image']>[0]

const builder = createImageUrlBuilder(sanity)

/** Základ URL obrázku ze Sanity CDN. Rozměry a formát dolaď řetězením. */
export function obrazek(zdroj: Obrazek) {
  return builder.image(zdroj).auto('format')
}

/**
 * Responzivní srcset. Prohlížeč si podle `sizes` vybere,
 * kterou šířku doopravdy stáhne — na mobilu tedy nestahuje verzi pro 4K.
 */
export function srcset(zdroj: Obrazek, sirky: number[]): string {
  return sirky.map((w) => `${obrazek(zdroj).width(w).url()} ${w}w`).join(', ')
}
