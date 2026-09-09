import {createClient, type SanityClient} from '@sanity/client'
import {createImageUrlBuilder} from '@sanity/image-url'
import {SANITY_API_VERZE, SANITY_DATASET, SANITY_PROJECT_ID} from './konfigurace'

export const sanity: SanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: SANITY_API_VERZE,
  // CDN se neobchází jen ve vývoji, ale i při buildu.
  //
  // Sanity po uložení textu spustí přestavbu webu okamžitě, jenže CDN drží
  // starou verzi ještě řádově minuty. Build by tak zapekl obsah, který
  // redaktor právě přepsal, a na webu by se změna neobjevila až do dalšího
  // buildu — bez zjevné příčiny. Přesně na to jsem naletěl při odstraňování
  // zmínky o dodavateli.
  //
  // Build běží jednou za změnu obsahu, takže pár dotazů navíc nic nestojí.
  useCdn: false,
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

/**
 * Rozměry obrázku vyčtené z reference na asset.
 *
 * Reference má tvar `image-<id>-<šířka>x<výška>-<přípona>`, takže poměr stran
 * jde zjistit bez dalšího dotazu do Sanity. Slouží k atributům width/height,
 * podle kterých si prohlížeč rezervuje místo dřív, než obrázek stáhne.
 *
 * Vrací null, když reference chybí nebo má jiný tvar — volající si pak
 * atributy nedoplní, což je pořád lepší než napsat tam nepravdu.
 */
export function rozmery(zdroj: Obrazek): {sirka: number; vyska: number} | null {
  const zaznam = zdroj as {asset?: {_ref?: string; _id?: string}; _ref?: string; _id?: string}
  const reference =
    typeof zdroj === 'string'
      ? zdroj
      : (zaznam?.asset?._ref ?? zaznam?.asset?._id ?? zaznam?._ref ?? zaznam?._id)

  const shoda = typeof reference === 'string' ? reference.match(/-(\d+)x(\d+)-/) : null
  return shoda ? {sirka: Number(shoda[1]), vyska: Number(shoda[2])} : null
}
