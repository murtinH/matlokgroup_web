/**
 * Zpracování poptávkového formuláře.
 *
 * Pořadí kroků je záměrné: poptávka se nejdřív uloží do Sanity a teprve
 * potom se posílá notifikace. Kdyby to bylo naopak a zápis selhal, přišli
 * bychom o zakázku. E-mail se proto smí nepovést, aniž by odeslání selhalo —
 * lead je v Sanity a nikam neuteče.
 *
 * ŽÁDNÝ KLÍČ SE NESMÍ DOSTAT DO KLIENTSKÉHO KÓDU. Všechny čteme z env,
 * které Cloudflare drží jako šifrované proměnné.
 */

import type {Env} from './index'
import {SANITY_API_VERZE, SANITY_DATASET, SANITY_PROJECT_ID} from '../src/lib/konfigurace'

const ZAMERY = ['services', 'automat', 'jine'] as const
type Zamer = (typeof ZAMERY)[number]

/** Pole, která dávají smysl u daného záměru. Ostatní se zahodí. */
const POLE_PODLE_ZAMERU: Record<Zamer, string[]> = {
  services: ['sluzby', 'obor', 'stav'],
  automat: ['typ', 'misto', 'navstevnost', 'rezim'],
  jine: [],
}

const LIMIT_ODESLANI = 5
const LIMIT_OKNO_SEKUND = 60 * 60

const MAX_DELKA = 2000

function odpoved(telo: unknown, status = 200): Response {
  return new Response(JSON.stringify(telo), {
    status,
    headers: {'content-type': 'application/json; charset=utf-8'},
  })
}

/** Ořízne a omezí délku. Prázdný řetězec vrací jako undefined. */
function text(hodnota: File | string | null): string | undefined {
  if (typeof hodnota !== 'string') return undefined
  const cisty = hodnota.trim().slice(0, MAX_DELKA)
  return cisty.length > 0 ? cisty : undefined
}

function jeEmail(hodnota: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(hodnota)
}

/**
 * IP ukládáme jen jako otisk. Na počítání odeslání to stačí a nedrží to
 * osobní údaj déle, než je nutné — po hodině klíč z úložiště sám zmizí.
 */
async function otiskIp(ip: string, projectId: string): Promise<string> {
  const data = new TextEncoder().encode(`${projectId}:${ip}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(hash)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function zpracujPoptavku(request: Request, env: Env): Promise<Response> {
  let data: FormData
  try {
    data = await request.formData()
  } catch {
    return odpoved({ok: false, chyba: 'Neplatný formát požadavku.'}, 400)
  }

  // --- Past na roboty ---------------------------------------------------
  // Vyplněné pole website znamená spam. Tváříme se, že se odeslalo,
  // aby robot nezkoušel obejít kontrolu jinak.
  if (text(data.get('website'))) {
    return odpoved({ok: true})
  }

  // --- Validace ---------------------------------------------------------
  const zamer = text(data.get('zamer')) as Zamer | undefined
  if (!zamer || !ZAMERY.includes(zamer)) {
    return odpoved({ok: false, chyba: 'Chybí volba, co vás zajímá.'}, 400)
  }

  const jmeno = text(data.get('jmeno'))
  if (!jmeno) {
    return odpoved({ok: false, chyba: 'Vyplňte prosím jméno.'}, 400)
  }

  const email = text(data.get('email'))
  if (!email || !jeEmail(email)) {
    return odpoved({ok: false, chyba: 'Zkontrolujte prosím e-mail.'}, 400)
  }

  // --- Omezení počtu odeslání ------------------------------------------
  const ip = request.headers.get('cf-connecting-ip') ?? 'neznama'
  if (env.RATE_LIMIT) {
    const klic = `poptavka:${await otiskIp(ip, SANITY_PROJECT_ID)}`
    const dosud = Number((await env.RATE_LIMIT.get(klic)) ?? '0')

    if (dosud >= LIMIT_ODESLANI) {
      return odpoved(
        {ok: false, chyba: 'Z tohoto připojení přišlo příliš mnoho poptávek. Zkuste to prosím za hodinu.'},
        429,
      )
    }
    await env.RATE_LIMIT.put(klic, String(dosud + 1), {expirationTtl: LIMIT_OKNO_SEKUND})
  }

  // --- Sestavení dokumentu ---------------------------------------------
  const lead: Record<string, unknown> = {
    _type: 'lead',
    zamer,
    jmeno,
    email,
    firma: text(data.get('firma')),
    telefon: text(data.get('telefon')),
    zprava: text(data.get('zprava')),
    vytvoreno: new Date().toISOString(),
  }

  for (const pole of POLE_PODLE_ZAMERU[zamer]) {
    if (pole === 'sluzby') {
      const sluzby = data.getAll('sluzby').filter((s): s is string => typeof s === 'string')
      if (sluzby.length > 0) lead.sluzby = sluzby
    } else {
      const hodnota = text(data.get(pole))
      if (hodnota) lead[pole] = hodnota
    }
  }

  for (const klic of Object.keys(lead)) {
    if (lead[klic] === undefined) delete lead[klic]
  }

  // --- Zápis do Sanity --------------------------------------------------
  const zapis = await fetch(
    `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERZE}/data/mutate/${SANITY_DATASET}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.SANITY_WRITE_TOKEN}`,
      },
      body: JSON.stringify({mutations: [{create: lead}]}),
    },
  )

  if (!zapis.ok) {
    console.error('Zápis poptávky do Sanity selhal:', zapis.status, await zapis.text())
    return odpoved({ok: false, chyba: 'Poptávku se nepodařilo uložit. Zkuste to prosím znovu.'}, 502)
  }

  // --- Notifikace -------------------------------------------------------
  // Od tohohle místa už poptávka nemůže zmizet. Když e-mail selže,
  // zalogujeme to a návštěvníkovi přesto potvrdíme odeslání.
  try {
    await posliNotifikaci(env, lead, zamer, jmeno)
  } catch (chyba) {
    console.error('Notifikační e-mail se nepodařilo odeslat:', chyba)
  }

  return odpoved({ok: true})
}

async function posliNotifikaci(
  env: Env,
  lead: Record<string, unknown>,
  zamer: Zamer,
  jmeno: string,
): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY není nastavený, notifikace se neodesílá.')
    return
  }

  // Adresa příjemce je v Sanity, ne v kódu — jde změnit bez nasazení.
  const dotaz = encodeURIComponent('*[_id == "siteSettings"][0]{notifikacniEmail, email}')
  const nastaveni = await fetch(
    `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERZE}/data/query/${SANITY_DATASET}?query=${dotaz}`,
  ).then((r) => r.json() as Promise<{result?: {notifikacniEmail?: string; email?: string}}>)

  const prijemce = nastaveni.result?.notifikacniEmail ?? nastaveni.result?.email
  if (!prijemce) {
    console.warn('V siteSettings není adresa pro notifikace.')
    return
  }

  const nazvyZameru: Record<Zamer, string> = {
    services: 'digitální řešení',
    automat: 'automat',
    jine: 'jiné',
  }

  const radky = Object.entries(lead)
    .filter(([klic]) => klic !== '_type')
    .map(([klic, hodnota]) => `${klic}: ${Array.isArray(hodnota) ? hodnota.join(', ') : String(hodnota)}`)

  const odeslani = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Web Matlok Group <web@matlok.cz>',
      to: [prijemce],
      reply_to: String(lead.email),
      // Předmět je vidět v mobilu na první pohled, jak chce zadání.
      subject: `Poptávka – ${nazvyZameru[zamer]} – ${jmeno}`,
      text: radky.join('\n'),
    }),
  })

  if (!odeslani.ok) {
    throw new Error(`Resend odpověděl ${odeslani.status}: ${await odeslani.text()}`)
  }
}
