import type {Env} from './index'
import {SANITY_API_VERZE, SANITY_DATASET, SANITY_PROJECT_ID} from '../src/lib/konfigurace'

/**
 * Živá nabídka automatu. Fáze 1 podle kapitoly 6 v ZADANI.md — jen čtení,
 * žádné objednávky.
 *
 * Tři věci, na kterých tenhle soubor stojí:
 *
 * 1. API vrací řádek na každou spirálu. Jeden produkt ve dvou spirálách
 *    přijde dvakrát, takže se řádky seskupují podle produktu a zásoby sčítají.
 *
 * 2. Ven jde jen název, cena, kategorie a zásoba. Objednávky se čtou kvůli
 *    prodávanosti, ale zůstává z nich pouhé pořadí — žádné částky, počty
 *    ani údaje o zákaznících. Zadání to zakazuje a klíč má partner:write,
 *    takže čím míň se z něj dostane ven, tím líp.
 *
 * 3. Když API neodpoví, vrátí se poslední známý stav ze Sanity. Web kvůli
 *    cizí službě nespadne.
 */

const BASE = 'https://www.mujautomat.cz/api/partner/v1'

/** Deset až patnáct minut podle zadání; volíme střed. */
const CACHE_SEKUND = 12 * 60

/** Kolik posledních objednávek se čte pro pořadí prodávanosti. */
const OBJEDNAVEK = 100

/** Kolik produktů dostane odznak „nejprodávanější". */
const TOP = 3

export interface Polozka {
  nazev: string
  cena: number
  kategorie: 'drink' | 'snack'
  dostupnost: number
  kapacita: number
  nejprodavanejsi: boolean
}

export interface Nabidka {
  ok: boolean
  zdroj: 'api' | 'zaloha'
  aktualizovano: string
  polozky: Polozka[]
}

/**
 * Kategorie z automatu jsou volný text. Web pracuje jen se dvěma skupinami,
 * takže se sem mapují podle klíčových slov; co se nechytí, je občerstvení.
 */
const NAPOJE = ['napoj', 'nápoj', 'drink', 'voda', 'water', 'juice', 'džus', 'kava', 'káva', 'coffee', 'caj', 'čaj', 'tea', 'energet', 'limonad', 'limonád', 'cola']

function urciKategorii(kategorie: string | null | undefined, nazev: string): 'drink' | 'snack' {
  const text = `${kategorie ?? ''} ${nazev}`.toLowerCase()
  return NAPOJE.some((k) => text.includes(k)) ? 'drink' : 'snack'
}

function cislo(hodnota: unknown): number | null {
  if (typeof hodnota === 'number') return hodnota
  if (typeof hodnota === 'string') {
    const n = Number(hodnota.replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }
  return null
}

/** Najde první použitelnou hodnotu pod některým z názvů. */
function pole(zaznam: Record<string, unknown>, nazvy: string[]): unknown {
  for (const n of nazvy) if (zaznam[n] !== undefined && zaznam[n] !== null) return zaznam[n]
  return undefined
}

async function zavolej(env: Env, cesta: string): Promise<unknown> {
  const odpoved = await fetch(`${BASE}${cesta}`, {
    headers: {
      authorization: `Bearer ${env.MUJAUTOMAT_API_KEY}`,
      accept: 'application/json',
    },
  })
  if (!odpoved.ok) throw new Error(`${cesta} → ${odpoved.status}`)
  return odpoved.json()
}

/**
 * Pořadí prodávanosti z posledních zaplacených objednávek.
 * Z odpovědi se bere výhradně productId a množství; všechno ostatní —
 * jména, e-maily, částky — se zahazuje hned při průchodu.
 */
async function poradiProdavanosti(env: Env, machineId: string): Promise<Set<string>> {
  try {
    const data = (await zavolej(
      env,
      `/machines/${machineId}/orders?limit=${OBJEDNAVEK}&paymentStatus=paid`,
    )) as {orders?: Record<string, unknown>[]}

    const prodeje = new Map<string, number>()
    for (const objednavka of data.orders ?? []) {
      const polozky = (objednavka.items ?? []) as Record<string, unknown>[]
      for (const p of polozky) {
        const id = typeof p.productId === 'string' ? p.productId : null
        const mnozstvi = cislo(p.quantity) ?? 0
        if (id) prodeje.set(id, (prodeje.get(id) ?? 0) + mnozstvi)
      }
    }

    return new Set(
      [...prodeje.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP)
        .map(([id]) => id),
    )
  } catch {
    // Prodávanost je ozdoba, ne podstata. Když se nepodaří, nabídka jede dál.
    return new Set()
  }
}

/** Seskupí řádky spirál podle produktu a sečte zásoby. */
function seskup(radky: Record<string, unknown>[], top: Set<string>): Polozka[] {
  const podleProduktu = new Map<string, Polozka & {id: string}>()

  for (const radek of radky) {
    const produkt = (pole(radek, ['product', 'produkt']) ?? radek) as Record<string, unknown>

    const nazev = pole(produkt, ['name', 'nazev', 'title'])
    if (typeof nazev !== 'string' || nazev.length === 0) continue

    const id =
      (typeof pole(radek, ['productId', 'product_id']) === 'string'
        ? (pole(radek, ['productId', 'product_id']) as string)
        : null) ??
      (typeof produkt.id === 'string' ? produkt.id : null) ??
      nazev

    const cena =
      cislo(pole(radek, ['price', 'cena', 'sellPrice'])) ??
      cislo(pole(produkt, ['suggestedPrice', 'price', 'cena'])) ??
      0

    const zasoba = cislo(pole(radek, ['quantity', 'stock', 'zasoba', 'currentStock', 'count'])) ?? 0
    const kapacita = cislo(pole(radek, ['capacity', 'maxQuantity', 'kapacita'])) ?? 12

    const stavajici = podleProduktu.get(id)
    if (stavajici) {
      // Stejný produkt v další spirále — zásoby i kapacita se sčítají.
      stavajici.dostupnost += zasoba
      stavajici.kapacita += kapacita
      continue
    }

    podleProduktu.set(id, {
      id,
      nazev,
      cena: Math.round(cena),
      kategorie: urciKategorii(
        pole(produkt, ['category', 'kategorie']) as string | undefined,
        nazev,
      ),
      dostupnost: zasoba,
      kapacita,
      nejprodavanejsi: top.has(id),
    })
  }

  return [...podleProduktu.values()]
    .filter((p) => p.dostupnost > 0)
    .map(({id: _id, ...zbytek}) => zbytek)
}

/** Poslední známý stav ze Sanity. Použije se, když API neodpoví. */
async function zaloha(): Promise<Nabidka> {
  const dotaz = encodeURIComponent(
    '*[_type == "product" && zobrazit == true] | order(_id asc){nazev, cena, kategorie, dostupnost, kapacita, nejprodavanejsi}',
  )
  const data = (await fetch(
    `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERZE}/data/query/${SANITY_DATASET}?query=${dotaz}`,
  ).then((r) => r.json())) as {result?: Record<string, unknown>[]}

  const polozky = (data.result ?? []).map((p) => ({
    nazev: String(p.nazev),
    cena: Number(p.cena) || 0,
    kategorie: (p.kategorie === 'drink' ? 'drink' : 'snack') as 'drink' | 'snack',
    dostupnost: Number(p.dostupnost) || 0,
    kapacita: Number(p.kapacita) || 12,
    nejprodavanejsi: Boolean(p.nejprodavanejsi),
  }))

  return {ok: true, zdroj: 'zaloha', aktualizovano: new Date().toISOString(), polozky}
}

export async function nabidkaAutomatu(request: Request, env: Env): Promise<Response> {
  const cache = caches.default
  const klic = new Request(new URL('/api/automat', request.url).toString(), {method: 'GET'})

  const ulozena = await cache.match(klic)
  if (ulozena) return ulozena

  let nabidka: Nabidka

  try {
    if (!env.MUJAUTOMAT_API_KEY) throw new Error('Chybí MUJAUTOMAT_API_KEY.')

    // machineId je v Sanity, ne v proměnných — není tajný a má jít změnit
    // bez nasazení.
    const dotaz = encodeURIComponent('*[_type == "machine" && stav == "live"][0].machineId')
    const {result: machineId} = (await fetch(
      `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERZE}/data/query/${SANITY_DATASET}?query=${dotaz}`,
    ).then((r) => r.json())) as {result?: string}

    if (!machineId || machineId === 'DOPLNIT') throw new Error('V Sanity není machineId.')

    const [detail, top] = await Promise.all([
      zavolej(env, `/machines/${machineId}`) as Promise<Record<string, unknown>>,
      poradiProdavanosti(env, machineId),
    ])

    // Seznam spirál může být pod několika názvy; bereme první pole objektů.
    const seznam =
      (Object.values(detail).find(
        (h) => Array.isArray(h) && h.length > 0 && typeof h[0] === 'object',
      ) as Record<string, unknown>[] | undefined) ?? []

    const polozky = seskup(seznam, top)
    if (polozky.length === 0) throw new Error('API nevrátilo žádné zboží.')

    nabidka = {ok: true, zdroj: 'api', aktualizovano: new Date().toISOString(), polozky}
  } catch (chyba) {
    console.error('Nabídka z Partner API selhala:', chyba)
    nabidka = await zaloha()
  }

  const odpoved = Response.json(nabidka, {
    headers: {
      // Cizí API se nevolá při každém načtení stránky.
      'cache-control': `public, max-age=${CACHE_SEKUND}`,
    },
  })

  // Uložení do cache nesmí zdržet odpověď návštěvníkovi.
  await cache.put(klic, odpoved.clone())
  return odpoved
}
