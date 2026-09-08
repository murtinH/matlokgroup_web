/**
 * Vstupní bod webu na Cloudflare Workers.
 *
 * Statické stránky servíruje Cloudflare sám z bindingu ASSETS — tenhle
 * skript se spustí až u požadavku, pro který žádný soubor neexistuje.
 * Řeší tedy jen serverová volání pod /api/.
 *
 * ŽÁDNÝ KLÍČ SE NESMÍ DOSTAT DO KLIENTSKÉHO KÓDU. Všechny čteme z env,
 * kde je Cloudflare drží jako šifrované proměnné.
 */
import {zpracujPoptavku} from './poptavka'

export interface Env {
  /** Statické soubory z buildu Astra. Nastavuje wrangler.jsonc. */
  ASSETS: Fetcher

  PUBLIC_SANITY_PROJECT_ID: string
  PUBLIC_SANITY_DATASET: string
  SANITY_WRITE_TOKEN: string
  RESEND_API_KEY?: string

  /**
   * Počítadlo odeslání formuláře. Binding je nepovinný — dokud v Cloudflare
   * nevznikne úložiště, formulář funguje dál, jen bez omezení počtu.
   */
  RATE_LIMIT?: KVNamespace
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const adresa = new URL(request.url)

    // www na holou doménu. Řeší se tady, a ne v souboru _redirects —
    // ten u Workers zvládne jen relativní adresy, takže přesun mezi
    // doménami se do něj napsat nedá.
    if (adresa.hostname.startsWith('www.')) {
      adresa.hostname = adresa.hostname.slice(4)
      return Response.redirect(adresa.toString(), 301)
    }

    if (adresa.pathname === '/api/poptavka') {
      if (request.method !== 'POST') {
        return new Response('Metoda není povolena.', {status: 405, headers: {allow: 'POST'}})
      }
      return zpracujPoptavku(request, env)
    }

    // Cokoli jiného je statická stránka nebo soubor.
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
