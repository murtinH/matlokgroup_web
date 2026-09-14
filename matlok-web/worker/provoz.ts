/**
 * Provoz automatu: upozornění a týdenní report pro majitele.
 *
 * Tohle NENÍ web. Nic odsud nejde návštěvníkům — jen e-mailem na adresy
 * z dokumentu Automat v Sanity. Proto tu smí být i tržby, které podle
 * zadání na web nepatří.
 *
 * Spouští to Cloudflare každých 30 minut (wrangler.jsonc → triggers).
 * Při každém běhu, mimo noční klid:
 *
 * 1. Zásoby. Porovnají se s tím, co už bylo nahlášené, a e-mail odejde,
 *    jen když se u některého zboží stav zhoršil (dochází → vyprodáno).
 *    Doplnění nic neposílá, jen se poznamená.
 *
 * 2. Dostupnost. Když MůjAutomat několik běhů po sobě neodpovídá, odejde
 *    jedno upozornění, a po obnovení jedno „zase odpovídá“.
 *
 * 3. Týdenní report. Když za minulý kalendářní týden ještě neodešel,
 *    pošle se — v pondělí tedy v 7:00. Když MůjAutomat zrovna neodpovídá,
 *    zkusí se to znovu za půl hodiny, místo aby report propadl.
 *
 * Z objednávek se čte jen čas, částka, produkt a množství. Jména, e-maily
 * a telefony zákazníků se zahazují hned při čtení.
 *
 * Co už bylo nahlášené, si worker pamatuje v KV (binding PROVOZ):
 *   provoz:zasoby:<machineId>   stav zboží při posledním upozornění
 *   provoz:selhani:<machineId>  kolikrát po sobě API selhalo a od kdy
 *   provoz:report:<machineId>   za který týden report odešel
 */
import type {Env} from './index'
import {SANITY_API_VERZE, SANITY_DATASET, SANITY_PROJECT_ID} from '../src/lib/konfigurace'
import {cislo, objednavky, seskupSpiraly, spiralyZDetailu, zavolej, type Produkt} from './automat'
import {castiVPraze, DEN_MS, jeNocniKlid, pulnocVPraze} from './cas'
import {posliEmail} from './email'
import {sablonaReportu, sablonaUpozorneni, sablonaVypadku} from './provoz-sablony'

/** Hranice „dochází“, když ji nemá nastavenou automat ani stránka Matlok. */
const HRANICE_VYCHOZI = 3

/**
 * Po kolika neúspěšných bězích za sebou hlásit, že automat neodpovídá.
 * Čtyři běhy po půlhodině jsou zhruba dvě hodiny — krátký výpadek sítě
 * nebo MůjAutomatu nestojí za e-mail.
 */
export const SELHANI_NEZ_NAHLASIT = 4

/** Kolik zboží ukázat v reportu mezi nejprodávanějšími. */
const NEJPRODAVANEJSICH = 5

export type Stav = 'ok' | 'dochazi' | 'vyprodano'

const ZAVAZNOST: Record<Stav, number> = {ok: 0, dochazi: 1, vyprodano: 2}

export interface AutomatVProvozu {
  nazev: string
  machineId: string
  lokalita?: string | null
  prijemci?: string[] | null
  upozorneniZapnuto?: boolean | null
  upozorneniHranice?: number | null
  reportZapnuty?: boolean | null
}

interface Nastaveni {
  automaty: AutomatVProvozu[]
  /** Hranice „poslední kusy“ ze stránky Matlok — ať e-mail a web říkají totéž. */
  hraniceWebu?: number | null
  notifikacniEmail?: string | null
}

// --- Nastavení ze Sanity -----------------------------------------------

async function nactiNastaveni(): Promise<Nastaveni> {
  const dotaz = encodeURIComponent(`{
    "automaty": *[_type == "machine" && stav == "live" && defined(machineId) && machineId != "DOPLNIT"]{
      nazev, machineId, lokalita, prijemci, upozorneniZapnuto, upozorneniHranice, reportZapnuty
    },
    "hraniceWebu": *[_id == "matlokPage"][0].hranicePoslednichKusu,
    "notifikacniEmail": *[_id == "siteSettings"][0].notifikacniEmail
  }`)
  const odpoved = await fetch(
    `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERZE}/data/query/${SANITY_DATASET}?query=${dotaz}`,
  )
  if (!odpoved.ok) throw new Error(`Sanity → ${odpoved.status}`)
  const {result} = (await odpoved.json()) as {result?: Nastaveni}
  return {
    automaty: result?.automaty ?? [],
    hraniceWebu: result?.hraniceWebu,
    notifikacniEmail: result?.notifikacniEmail,
  }
}

/** Adresy z automatu; když žádné nejsou, e-mail pro poptávky z Nastavení webu. */
function prijemci(automat: AutomatVProvozu, nastaveni: Nastaveni): string[] {
  const vlastni = (automat.prijemci ?? []).map((e) => e.trim()).filter(Boolean)
  if (vlastni.length > 0) return vlastni
  return nastaveni.notifikacniEmail ? [nastaveni.notifikacniEmail] : []
}

// --- Období ------------------------------------------------------------

export interface Obdobi {
  /** Začátek týdne před sledovaným — pro srovnání. */
  predOd: Date
  /** Pondělí 0:00 sledovaného týdne. */
  od: Date
  /** Pondělí 0:00 následujícího týdne, už nepatří do sledovaného. */
  do: Date
}

/** Poslední celý kalendářní týden (pondělí až neděle) před okamžikem `ted`. */
export function minulyTyden(ted: Date): Obdobi {
  const c = castiVPraze(ted)
  const pondeli = Date.UTC(c.rok, c.mesic - 1, c.den) - c.denTydne * DEN_MS
  const pulnoc = (posunDni: number) => {
    const d = new Date(pondeli + posunDni * DEN_MS)
    return pulnocVPraze(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
  }
  return {predOd: pulnoc(-14), od: pulnoc(-7), do: pulnoc(0)}
}

// --- Zásoby ------------------------------------------------------------

export function stavZbozi(dostupnost: number, hranice: number): Stav {
  if (dostupnost <= 0) return 'vyprodano'
  return dostupnost <= hranice ? 'dochazi' : 'ok'
}

export interface ZboziVPrehledu extends Produkt {
  stav: Stav
  /** Zhoršilo se od posledního upozornění. */
  nove: boolean
  /** Kolik kusů chybí do plna. */
  doplnit: number
}

/**
 * Porovná zásoby s posledním nahlášeným stavem.
 *
 * - `nahlasit` — kolik zboží se od minula zhoršilo. Nula = e-mail se neposílá.
 * - `prehled` — všechno, co teď dochází nebo je vyprodané, ať e-mail ukáže
 *   celý obrázek, ne jen novinky.
 * - `stav` — co si uložit pro příští běh. Zboží, které z automatu zmizelo,
 *   v něm už není.
 */
export function porovnejZasoby(
  produkty: Produkt[],
  predchozi: Record<string, Stav>,
  hranice: number,
): {stav: Record<string, Stav>; prehled: ZboziVPrehledu[]; nahlasit: number} {
  const stav: Record<string, Stav> = {}
  const prehled: ZboziVPrehledu[] = []
  let nahlasit = 0

  for (const p of produkty) {
    const ted = stavZbozi(p.dostupnost, hranice)
    stav[p.id] = ted
    if (ted === 'ok') continue

    const nove = ZAVAZNOST[ted] > ZAVAZNOST[predchozi[p.id] ?? 'ok']
    if (nove) nahlasit += 1
    prehled.push({...p, stav: ted, nove, doplnit: Math.max(0, p.kapacita - p.dostupnost)})
  }

  prehled.sort(
    (a, b) =>
      ZAVAZNOST[b.stav] - ZAVAZNOST[a.stav] ||
      Number(b.nove) - Number(a.nove) ||
      a.dostupnost - b.dostupnost ||
      a.nazev.localeCompare(b.nazev, 'cs'),
  )

  return {stav, prehled, nahlasit}
}

function stejneStavy(a: Record<string, Stav>, b: Record<string, Stav>): boolean {
  const klice = Object.keys(a)
  return klice.length === Object.keys(b).length && klice.every((k) => a[k] === b[k])
}

// --- Objednávky --------------------------------------------------------

/** Objednávka zbavená všeho, co provoz nepotřebuje — hlavně údajů o zákazníkovi. */
export interface Prodej {
  cas: number
  castka: number
  polozky: {id: string | null; nazev: string | null; kategorie: string | null; kusy: number}[]
}

export function zjednodus(objednavka: Record<string, unknown>): Prodej | null {
  const cas = Date.parse(String(objednavka.createdAt ?? ''))
  if (!Number.isFinite(cas)) return null

  const polozky = ((objednavka.items ?? []) as Record<string, unknown>[]).map((p) => {
    const produkt = (p.product ?? {}) as Record<string, unknown>
    const kategorie = typeof produkt.category === 'string' ? produkt.category.trim() : ''
    return {
      id: typeof p.productId === 'string' ? p.productId : null,
      nazev: typeof produkt.name === 'string' ? produkt.name : null,
      kategorie: kategorie || null,
      kusy: cislo(p.quantity) ?? 0,
    }
  })

  return {cas, castka: cislo(objednavka.totalAmount) ?? 0, polozky}
}

async function prodejeOd(env: Env, machineId: string, od: Date): Promise<Prodej[]> {
  const vysledek: Prodej[] = []
  for await (const objednavka of objednavky(env, machineId)) {
    const prodej = zjednodus(objednavka)
    if (!prodej) continue
    // Objednávky jdou od nejnovějších. První starší znamená, že zbytek
    // historie report nepotřebuje — další stránky se nenačtou.
    if (prodej.cas < od.getTime()) break
    vysledek.push(prodej)
  }
  return vysledek
}

// --- Report ------------------------------------------------------------

export interface ProdejZbozi {
  nazev: string
  kategorie: string
  kusy: number
}

export interface DoplneniZbozi extends Produkt {
  stav: Stav
  kusyZaTyden: number
  doplnit: number
}

export interface Report {
  obdobi: Obdobi
  /** Kdy se četly zásoby — v pondělí ráno, ne na konci týdne. */
  zasobyK: Date
  hranice: number
  kusy: number
  kusyPred: number
  nakupy: number
  nakupyPred: number
  trzba: number
  trzbaPred: number
  /** Prodané kusy po dnech, pondělí až neděle. */
  podleDnu: number[]
  nejprodavanejsi: ProdejZbozi[]
  kategorie: {nazev: string; kusy: number}[]
  doplnit: DoplneniZbozi[]
  /** Skladem, ale za 14 dní ani kus. */
  bezProdeje: Produkt[]
}

export function sestavReport(
  produkty: Produkt[],
  prodeje: Prodej[],
  obdobi: Obdobi,
  hranice: number,
  zasobyK: Date,
): Report {
  const od = obdobi.od.getTime()
  const konec = obdobi.do.getTime()
  const predOd = obdobi.predOd.getTime()

  const tyden = prodeje.filter((p) => p.cas >= od && p.cas < konec)
  const pred = prodeje.filter((p) => p.cas >= predOd && p.cas < od)

  const kusu = (seznam: Prodej[]) =>
    seznam.reduce((s, p) => s + p.polozky.reduce((t, x) => t + x.kusy, 0), 0)
  const trzby = (seznam: Prodej[]) => seznam.reduce((s, p) => s + p.castka, 0)

  const vAutomatu = new Map(produkty.map((p) => [p.id, p]))
  const podleDnu = [0, 0, 0, 0, 0, 0, 0]
  const naZbozi = new Map<string, ProdejZbozi>()
  const naKategorii = new Map<string, number>()

  for (const prodej of tyden) {
    const den = castiVPraze(new Date(prodej.cas)).denTydne
    for (const x of prodej.polozky) {
      podleDnu[den] += x.kusy
      const znamy = x.id ? vAutomatu.get(x.id) : undefined
      const klic = x.id ?? x.nazev ?? '?'
      const radek = naZbozi.get(klic) ?? {
        nazev: znamy?.nazev ?? x.nazev ?? 'Neznámé zboží',
        kategorie: x.kategorie ?? znamy?.kategorie ?? 'Ostatní',
        kusy: 0,
      }
      radek.kusy += x.kusy
      naZbozi.set(klic, radek)
      naKategorii.set(radek.kategorie, (naKategorii.get(radek.kategorie) ?? 0) + x.kusy)
    }
  }

  const prodaneZa14Dni = new Set(
    [...tyden, ...pred].flatMap((p) => p.polozky.filter((x) => x.kusy > 0 && x.id).map((x) => x.id)),
  )

  const doplnit = produkty
    .map((p) => ({
      ...p,
      stav: stavZbozi(p.dostupnost, hranice),
      kusyZaTyden: naZbozi.get(p.id)?.kusy ?? 0,
      doplnit: Math.max(0, p.kapacita - p.dostupnost),
    }))
    // Vyprodané a docházející, plus zboží, kterému by při tempu minulého
    // týdne zásoba nevydržela do dalšího pondělí. Docházející zboží, které
    // se 14 dní neprodalo, doplňovat nemá smysl — patří do „neprodalo se“.
    .filter(
      (p) =>
        p.doplnit > 0 &&
        (p.stav === 'vyprodano' ||
          (p.stav === 'dochazi' && prodaneZa14Dni.has(p.id)) ||
          p.kusyZaTyden >= p.dostupnost),
    )
    .sort(
      (a, b) =>
        ZAVAZNOST[b.stav] - ZAVAZNOST[a.stav] ||
        b.kusyZaTyden - a.kusyZaTyden ||
        a.dostupnost - b.dostupnost ||
        a.nazev.localeCompare(b.nazev, 'cs'),
    )

  return {
    obdobi,
    zasobyK,
    hranice,
    kusy: kusu(tyden),
    kusyPred: kusu(pred),
    nakupy: tyden.length,
    nakupyPred: pred.length,
    trzba: trzby(tyden),
    trzbaPred: trzby(pred),
    podleDnu,
    nejprodavanejsi: [...naZbozi.values()]
      .sort((a, b) => b.kusy - a.kusy || a.nazev.localeCompare(b.nazev, 'cs'))
      .slice(0, NEJPRODAVANEJSICH),
    kategorie: [...naKategorii.entries()]
      .map(([nazev, kusy]) => ({nazev, kusy}))
      .sort((a, b) => b.kusy - a.kusy || a.nazev.localeCompare(b.nazev, 'cs')),
    doplnit,
    bezProdeje: produkty
      .filter((p) => p.dostupnost > 0 && !prodaneZa14Dni.has(p.id))
      .sort((a, b) => a.nazev.localeCompare(b.nazev, 'cs')),
  }
}

// --- Běh ---------------------------------------------------------------

export async function provozAutomatu(env: Env, ted = new Date()): Promise<void> {
  const kv = env.PROVOZ
  if (!kv) {
    // Bez paměti by worker nevěděl, co už poslal, a posílal by totéž každou půlhodinu.
    console.warn('Chybí binding PROVOZ — hlídání automatu a report neběží.')
    return
  }
  if (jeNocniKlid(ted)) return
  if (!env.MUJAUTOMAT_API_KEY) {
    console.error('Chybí MUJAUTOMAT_API_KEY — hlídání automatu a report neběží.')
    return
  }

  const nastaveni = await nactiNastaveni()
  const tyden = minulyTyden(ted)

  // Automaty jeden po druhém: problém s jedním nesmí zastavit ostatní.
  for (const automat of nastaveni.automaty) {
    try {
      await provozJednoho(env, kv, automat, nastaveni, tyden, ted)
    } catch (chyba) {
      console.error(`Provoz automatu ${automat.nazev} selhal:`, chyba)
    }
  }
}

async function provozJednoho(
  env: Env,
  kv: KVNamespace,
  automat: AutomatVProvozu,
  nastaveni: Nastaveni,
  tyden: Obdobi,
  ted: Date,
): Promise<void> {
  const komu = prijemci(automat, nastaveni)
  if (komu.length === 0) {
    console.warn(`Automat ${automat.nazev}: není kam posílat — chybí příjemci i e-mail pro poptávky.`)
    return
  }

  const klicReportu = `provoz:report:${automat.machineId}`
  const hlidat = automat.upozorneniZapnuto !== false
  const reportNaRade =
    automat.reportZapnuty !== false && (await kv.get(klicReportu)) !== tyden.od.toISOString()
  if (!hlidat && !reportNaRade) return

  let produkty: Produkt[]
  try {
    const detail = (await zavolej(env, `/machines/${automat.machineId}`)) as Record<string, unknown>
    produkty = seskupSpiraly(spiralyZDetailu(detail))
    if (produkty.length === 0) throw new Error('MůjAutomat nevrátil žádné zboží.')
  } catch (chyba) {
    console.error(`Automat ${automat.nazev}: stav se nepodařilo načíst:`, chyba)
    if (hlidat) await zaznamenejSelhani(env, kv, automat, komu, chyba, ted)
    return
  }

  const hranice = automat.upozorneniHranice ?? nastaveni.hraniceWebu ?? HRANICE_VYCHOZI

  // Každá část zvlášť: když selže e-mail upozornění, report přesto odejde.
  if (hlidat) {
    try {
      await zaznamenejObnoveni(env, kv, automat, komu, ted)
      await hlidejZasoby(env, kv, automat, komu, produkty, hranice, ted)
    } catch (chyba) {
      console.error(`Automat ${automat.nazev}: upozornění selhalo:`, chyba)
    }
  }

  if (reportNaRade) {
    const prodeje = await prodejeOd(env, automat.machineId, tyden.predOd)
    const report = sestavReport(produkty, prodeje, tyden, hranice, ted)
    await posliEmail(env, {komu, ...sablonaReportu(automat, report)})
    // Poznamená se až po odeslání — když e-mail selže, další běh to zkusí znovu.
    await kv.put(klicReportu, tyden.od.toISOString(), {expirationTtl: 60 * 60 * 24 * 60})
  }
}

async function hlidejZasoby(
  env: Env,
  kv: KVNamespace,
  automat: AutomatVProvozu,
  komu: string[],
  produkty: Produkt[],
  hranice: number,
  ted: Date,
): Promise<void> {
  const klic = `provoz:zasoby:${automat.machineId}`
  const predchozi = (await kv.get<Record<string, Stav>>(klic, 'json')) ?? {}
  const {stav, prehled, nahlasit} = porovnejZasoby(produkty, predchozi, hranice)

  if (nahlasit > 0) {
    await posliEmail(env, {komu, ...sablonaUpozorneni(automat, prehled, hranice, ted)})
  }

  // Až po odeslání: když e-mail selže, další běh zhoršení nahlásí znovu.
  // A jen při změně — zápisů do KV je na free tarifu tisíc denně.
  if (!stejneStavy(stav, predchozi)) await kv.put(klic, JSON.stringify(stav))
}

interface Selhani {
  pocet: number
  /** Čas prvního neúspěšného běhu v řadě. */
  od: string
  nahlaseno: boolean
}

function popisChyby(chyba: unknown): string {
  return (chyba instanceof Error ? chyba.message : String(chyba)).slice(0, 300)
}

async function zaznamenejSelhani(
  env: Env,
  kv: KVNamespace,
  automat: AutomatVProvozu,
  komu: string[],
  chyba: unknown,
  ted: Date,
): Promise<void> {
  const klic = `provoz:selhani:${automat.machineId}`
  const dosud = await kv.get<Selhani>(klic, 'json')
  const zaznam: Selhani = {
    pocet: (dosud?.pocet ?? 0) + 1,
    od: dosud?.od ?? ted.toISOString(),
    nahlaseno: dosud?.nahlaseno ?? false,
  }

  if (zaznam.pocet >= SELHANI_NEZ_NAHLASIT && !zaznam.nahlaseno) {
    try {
      await posliEmail(env, {
        komu,
        ...sablonaVypadku(automat, {od: new Date(zaznam.od), pokusu: zaznam.pocet, chyba: popisChyby(chyba)}),
      })
      zaznam.nahlaseno = true
    } catch (e) {
      console.error(`Automat ${automat.nazev}: upozornění na výpadek se nepodařilo odeslat:`, e)
    }
  }

  await kv.put(klic, JSON.stringify(zaznam))
}

async function zaznamenejObnoveni(
  env: Env,
  kv: KVNamespace,
  automat: AutomatVProvozu,
  komu: string[],
  ted: Date,
): Promise<void> {
  const klic = `provoz:selhani:${automat.machineId}`
  const dosud = await kv.get<Selhani>(klic, 'json')
  if (!dosud) return

  // „Zase odpovídá“ jen tehdy, když předtím odešlo „neodpovídá“.
  if (dosud.nahlaseno) {
    await posliEmail(env, {komu, ...sablonaVypadku(automat, {od: new Date(dosud.od), obnoveno: ted})})
  }
  await kv.delete(klic)
}
