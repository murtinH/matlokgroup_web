/**
 * Vstupní bod webu na Cloudflare Workers.
 *
 * Statické stránky servíruje Cloudflare sám z bindingu ASSETS — tenhle
 * skript se spustí až u požadavku, pro který žádný soubor neexistuje.
 * Řeší tedy jen serverová volání pod /api/.
 *
 * Právě proto tady NENÍ přesměrování z www na holou doménu: u běžné
 * stránky se skript vůbec nespustí, protože ji Cloudflare odbaví dřív.
 * Řeší to Redirect Rule v Cloudflare, která běží před Workerem.
 *
 * ŽÁDNÝ KLÍČ SE NESMÍ DOSTAT DO KLIENTSKÉHO KÓDU. Všechny čteme z env,
 * kde je Cloudflare drží jako šifrované proměnné.
 */
import {zpracujPoptavku} from './poptavka'
import {nabidkaAutomatu} from './automat'

export interface Env {
  /** Statické soubory z buildu Astra. Nastavuje wrangler.jsonc. */
  ASSETS: Fetcher

  SANITY_WRITE_TOKEN: string
  RESEND_API_KEY?: string
  MUJAUTOMAT_API_KEY?: string

  /**
   * Tajný protějšek klíče Turnstile. Když chybí, ochrana formuláře
   * proti robotům se přeskočí — zůstane past a omezení počtu odeslání.
   */
  TURNSTILE_SECRET?: string

  /**
   * Počítadlo odeslání formuláře. Binding je nepovinný — dokud v Cloudflare
   * nevznikne úložiště, formulář funguje dál, jen bez omezení počtu.
   */
  RATE_LIMIT?: KVNamespace
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const adresa = new URL(request.url)

    if (adresa.pathname === '/api/poptavka') {
      if (request.method !== 'POST') {
        return new Response('Metoda není povolena.', {status: 405, headers: {allow: 'POST'}})
      }
      return zpracujPoptavku(request, env)
    }

    if (adresa.pathname === '/api/automat') {
      return nabidkaAutomatu(request, env)
    }

    // Cokoli jiného je statická stránka nebo soubor.
    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
