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
 *    prodávanosti a kvůli jedinému souhrnnému číslu — kolik kusů se celkem
 *    prodalo. Nic dalšího z nich neodchází: žádné částky, žádné e-maily,
 *    žádné jednotlivé objednávky. Ten součet je vědomá výjimka, ne
 *    opomenutí; je to agregát přes celý automat, ze kterého nejde nic
 *    odvodit o konkrétním zákazníkovi. Klíč má partner:write, takže čím
 *    míň se z něj dostane ven, tím líp.
 *
 * 3. Když API neodpoví, vrátí se poslední známý stav: poslední úspěšná
 *    odpověď, kterou si worker uložil do KV, a teprve bez ní produkty ze
 *    Sanity. Web kvůli cizí službě nespadne.
 */

const BASE = 'https://www.mujautomat.cz/api/partner/v1'

/**
 * Zadání chtělo deset až patnáct minut. Od chvíle, kdy se prochází celá
 * historie objednávek, je jedno volání násobně dražší než dřív a prodané
 * kusy se po minutách nemění — třicet minut je rozumný kompromis.
 */
const CACHE_SEKUND = 30 * 60

/**
 * Verze tvaru odpovědi. Zvýšit při každé změně toho, co endpoint vrací.
 *
 * Je součástí klíče do cache, takže po nasazení se záznam od starého
 * workeru přestane používat okamžitě. Bez ní web 11. 9. 2026 po mergi
 * kategorií z MůjAutomatu dál ukazoval staré drink/snack — dokud záznam
 * nevypršel.
 */
const CACHE_VERZE = 2

/** Kolik objednávek se natáhne najednou. Stránkuje se přes cursor. */
const OBJEDNAVEK = 100

/**
 * Strop na počet stránek. Pojistka proti nekonečné smyčce, kdyby API
 * vracelo hasMore navždy. Při stovce objednávek na stránku to je čtyři
 * tisíce objednávek — na jeden automat s rezervou.
 */
const STRANEK_NEJVYS = 40

/** Kolik produktů dostane odznak „nejprodávanější". */
const TOP = 3

export interface Polozka {
  nazev: string
  cena: number
  /**
   * Skupina zboží tak, jak ji má nastavenou MůjAutomat — volný řetězec,
   * ne pevný výčet. Když provozovna v automatu kategorie přejmenuje nebo
   * přidá, web se přizpůsobí sám a nemusí se nasazovat.
   */
  kategorie: string
  dostupnost: number
  kapacita: number
  nejprodavanejsi: boolean
}

export interface Nabidka {
  ok: boolean
  zdroj: 'api' | 'zaloha'
  aktualizovano: string
  polozky: Polozka[]
  /**
   * Kolik kusů se z automatu celkem prodalo od spuštění.
   * null znamená „nepodařilo se zjistit“ — web pak nechá stát hodnotu
   * uloženou v Sanity místo aby ukázal nulu.
   */
  prodano: number | null
}

/**
 * Skupina zboží.
 *
 * Bere se přímo z MůjAutomatu — kategorie tam jsou nastavené (Drinks,
 * Energy & Sport, Snacks, Krkonoše) a web nemá co je přepisovat. Dřív
 * si je odhadoval sám ze dvou škatulek a v „občerstvení" pak končily
 * náplasti i kondomy.
 *
 * Odhad z názvu zůstává jen pro zboží, které kategorii nastavenou nemá:
 * rozhoduje jednotka, protože je spolehlivější než seznam značek —
 * Monster ani Red Bull v žádném seznamu nejsou, a přesto je každý pozná
 * podle „0,5l" v názvu.
 */
const OBJEM = /\d+(?:[.,]\d+)?\s*(?:ml|l)\b/i
const HMOTNOST = /\d+(?:[.,]\d+)?\s*(?:g|kg|ks)\b/i
const NAPOJE = ['napoj', 'nápoj', 'drink', 'voda', 'water', 'juice', 'džus', 'kava', 'káva', 'coffee', 'caj', 'čaj', 'tea', 'energet', 'limonad', 'limonád', 'cola', 'smoothie']

/** Skupina pro zboží, které kategorii v automatu nastavenou nemá. */
const OSTATNI = 'Ostatní'

function urciKategorii(kategorie: string | null | undefined, nazev: string): string {
  const zAutomatu = typeof kategorie === 'string' ? kategorie.trim() : ''
  if (zAutomatu) return zAutomatu

  if (OBJEM.test(nazev)) return 'Nápoje'
  if (HMOTNOST.test(nazev)) return 'Občerstvení'
  return NAPOJE.some((k) => nazev.toLowerCase().includes(k)) ? 'Nápoje' : OSTATNI
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
 * Průchod zaplacenými objednávkami. Vrací dvě věci naráz, protože obojí
 * vzniká ze stejných dat a druhý průchod by jen zdvojil volání API:
 *
 *  - `top`      — ID nejprodávanějších produktů, kvůli odznaku v nabídce
 *  - `prodano`  — kolik kusů se celkem prodalo, kvůli číslu na titulce
 *
 * Z odpovědi se bere výhradně productId a množství. Jména, e-maily
 * i částky se zahazují hned při průchodu a nikam se nepředávají.
 *
 * Stránkuje se přes cursor, dokud API hlásí hasMore. Bez toho by součet
 * říkal „posledních sto objednávek“, a to není celkový počet prodaných kusů.
 */
async function prodeje(env: Env, machineId: string): Promise<{top: Set<string>; prodano: number | null}> {
  try {
    const naProdukt = new Map<string, number>()
    let celkem = 0
    let cursor: string | undefined
    let stranka = 0

    do {
      const parametry = new URLSearchParams({limit: String(OBJEDNAVEK), paymentStatus: 'paid'})
      if (cursor) parametry.set('cursor', cursor)

      const data = (await zavolej(env, `/machines/${machineId}/orders?${parametry}`)) as {
        orders?: Record<string, unknown>[]
        nextCursor?: string
        hasMore?: boolean
      }

      for (const objednavka of data.orders ?? []) {
        const polozky = (objednavka.items ?? []) as Record<string, unknown>[]
        for (const p of polozky) {
          const mnozstvi = cislo(p.quantity) ?? 0
          celkem += mnozstvi
          const id = typeof p.productId === 'string' ? p.productId : null
          if (id) naProdukt.set(id, (naProdukt.get(id) ?? 0) + mnozstvi)
        }
      }

      cursor = data.hasMore ? data.nextCursor : undefined
      stranka += 1
    } while (cursor && stranka < STRANEK_NEJVYS)

    const top = new Set(
      [...naProdukt.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP)
        .map(([id]) => id),
    )

    return {top, prodano: celkem}
  } catch {
    // Prodávanost i počet jsou ozdoba, ne podstata. Když se nepodaří,
    // nabídka jede dál a číslo zůstane takové, jaké je v Sanity.
    return {top: new Set(), prodano: null}
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

/**
 * Klíč, pod kterým si worker v KV pamatuje poslední úspěšnou odpověď
 * z MůjAutomatu. Nese verzi tvaru odpovědi, stejně jako klíč do cache.
 */
const KLIC_POSLEDNI = `nabidka:posledni:v${CACHE_VERZE}`

/**
 * Jak dlouho platí v cache záloha. Krátce — ať se worker po výpadku brzy
 * zkusí zeptat MůjAutomatu znovu, ale ne při každém načtení stránky.
 */
const ZALOHA_SEKUND = 2 * 60

/**
 * Je uložená odpověď ještě čerstvá?
 *
 * Rozhoduje vlastní hlavička x-ulozeno s časem uložení, ne max-age.
 * Cloudflare držel záznam déle, než hlavička říkala: odpověď uložená
 * s max-age=720 se servírovala i po třinácti minutách a navenek hlásila
 * max-age=14400. Vlastní hlavičky Cloudflare nepřepisuje.
 *
 * Čas v těle (aktualizovano) k tomu sloužit nemůže: u zálohy je to čas
 * dat, který bývá hodiny starý, a worker by pak při výpadku volal
 * nedostupný MůjAutomat při každém načtení stránky.
 */
function jeCerstva(odpoved: Response): boolean {
  const ulozeno = Date.parse(odpoved.headers.get('x-ulozeno') ?? '')
  const platnost = Number(odpoved.headers.get('x-platnost-sekund'))
  const stari = Date.now() - ulozeno
  return Number.isFinite(stari) && stari >= 0 && platnost > 0 && stari < platnost * 1000
}

/**
 * Záloha, když MůjAutomat neodpoví.
 *
 * 1. Poslední úspěšná odpověď z KV — skutečné zboží, ceny a kategorie.
 * 2. Až když v KV nic není (třeba hned po prvním nasazení), produkty ze
 *    Sanity. Tam je jen šest ukázkových položek z prototypu.
 *
 * Čas v odpovědi je vždy čas dat, ne čas dotazu. Stránka ho ukazuje jako
 * „poslední známý stav z …" — dřív tam stál aktuální čas, takže zastaralá
 * nabídka vypadala jako čerstvá.
 *
 * Prodané kusy se nevracejí ani z KV. Na titulce u nich není čas, takže
 * by zaseknuté číslo vypadalo jako živé — pomlčka je poctivější.
 */
async function zaloha(env: Env): Promise<Nabidka> {
  if (env.ZALOHA_NABIDKY) {
    try {
      const posledni = await env.ZALOHA_NABIDKY.get<Nabidka>(KLIC_POSLEDNI, 'json')
      if (posledni?.polozky?.length) return {...posledni, zdroj: 'zaloha', prodano: null}
    } catch (chyba) {
      console.error('Záloha z KV selhala:', chyba)
    }
  }

  const dotaz = encodeURIComponent(
    // Starší záložní produkty mají kategorii 'drink'/'snack'; převádí se
    // na české názvy, aby filtr nikdy neukázal holé „drink".
    `{
      "polozky": *[_type == "product" && zobrazit == true] | order(_id asc){nazev, cena, "kategorie": select(kategorie == "drink" => "Nápoje", kategorie == "snack" => "Občerstvení", kategorie), dostupnost, kapacita, nejprodavanejsi},
      "zmeneno": *[_type == "product" && zobrazit == true] | order(_updatedAt desc)[0]._updatedAt
    }`,
  )
  const data = (await fetch(
    `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERZE}/data/query/${SANITY_DATASET}?query=${dotaz}`,
  ).then((r) => r.json())) as {result?: {polozky?: Record<string, unknown>[]; zmeneno?: string}}

  const polozky = (data.result?.polozky ?? []).map((p) => ({
    nazev: String(p.nazev),
    cena: Number(p.cena) || 0,
    kategorie: String(p.kategorie || 'Ostatní'),
    dostupnost: Number(p.dostupnost) || 0,
    kapacita: Number(p.kapacita) || 12,
    nejprodavanejsi: Boolean(p.nejprodavanejsi),
  }))

  return {
    ok: true,
    zdroj: 'zaloha',
    // Kdy byly produkty v Sanity naposledy změněné. Když žádné nejsou,
    // stránka nabídku nevykreslí vůbec, takže na čase nesejde.
    aktualizovano: data.result?.zmeneno ?? new Date(0).toISOString(),
    polozky,
    prodano: null,
  }
}

export async function nabidkaAutomatu(request: Request, env: Env): Promise<Response> {
  const cache = caches.default
  const klic = new Request(new URL(`/api/automat?v=${CACHE_VERZE}`, request.url).toString(), {
    method: 'GET',
  })

  const ulozena = await cache.match(klic)
  if (ulozena && jeCerstva(ulozena)) return ulozena

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

    const [detail, {top, prodano}] = await Promise.all([
      zavolej(env, `/machines/${machineId}`) as Promise<Record<string, unknown>>,
      prodeje(env, machineId),
    ])

    // Seznam spirál může být pod několika názvy; bereme první pole objektů.
    const seznam =
      (Object.values(detail).find(
        (h) => Array.isArray(h) && h.length > 0 && typeof h[0] === 'object',
      ) as Record<string, unknown>[] | undefined) ?? []

    const polozky = seskup(seznam, top)
    if (polozky.length === 0) throw new Error('API nevrátilo žádné zboží.')

    nabidka = {ok: true, zdroj: 'api', aktualizovano: new Date().toISOString(), polozky, prodano}

    // Poslední úspěšnou odpověď si worker pamatuje pro chvíle, kdy
    // MůjAutomat neodpoví. Nepodařený zápis nabídku shodit nesmí.
    if (env.ZALOHA_NABIDKY) {
      try {
        await env.ZALOHA_NABIDKY.put(KLIC_POSLEDNI, JSON.stringify(nabidka))
      } catch (chyba) {
        console.error('Zápis zálohy do KV selhal:', chyba)
      }
    }
  } catch (chyba) {
    console.error('Nabídka z Partner API selhala:', chyba)
    nabidka = await zaloha(env)
  }

  // Záloha platí jen krátce, ať se worker po výpadku brzy zeptá znovu.
  const platnost = nabidka.zdroj === 'api' ? CACHE_SEKUND : ZALOHA_SEKUND

  const odpoved = Response.json(nabidka, {
    headers: {
      // Cizí API se nevolá při každém načtení stránky.
      'cache-control': `public, max-age=${platnost}`,
      // Podle těchhle dvou hlaviček worker pozná, jestli je uložená
      // odpověď ještě čerstvá — viz jeCerstva().
      'x-ulozeno': new Date().toISOString(),
      'x-platnost-sekund': String(platnost),
    },
  })

  // Uložení do cache nesmí zdržet odpověď návštěvníkovi.
  await cache.put(klic, odpoved.clone())
  return odpoved
}
