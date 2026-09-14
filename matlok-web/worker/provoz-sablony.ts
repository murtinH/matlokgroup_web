/**
 * Texty a vzhled e-mailů z provozu automatu.
 *
 * Barvy jsou tady natvrdo, i když web je bere výhradně z CSS proměnných:
 * e-mailové klienty (Gmail, Outlook) proměnné ani styly v hlavičce
 * spolehlivě neumí, proto je všechno vepsané přímo do prvků. Hodnoty jsou
 * opsané z src/styles/tokens/colors.css — při změně styleguidu je opsat znovu.
 *
 * Česky, vykání, bez vykřičníků a emoji — stejně jako web.
 */
import type {AutomatVProvozu, Report, ZboziVPrehledu} from './provoz'
import {datum, datumACas, NOCNI_KLID} from './cas'

export interface Sablona {
  predmet: string
  html: string
  text: string
}

const BARVA = {
  text: '#102936', // --ink-800
  tlumena: '#627780', // --neutral-500
  cara: '#D4DFE3', // --neutral-200
  podklad: '#F3F8F6', // --snow
  karta: '#FFFFFF', // --neutral-0
  akcent: '#20B9E8', // --azure-500 — značkový čtverec pod nadpisem
  vyprodano: '#A8392C', // --red-600
}

const PISMO = "Inter, 'Segoe UI', Helvetica, Arial, sans-serif"
const PISMO_NADPIS = "Montserrat, 'Segoe UI', Helvetica, Arial, sans-serif"

const CISLO = new Intl.NumberFormat('cs-CZ', {maximumFractionDigits: 0})
const pocet = (n: number) => CISLO.format(n)
/** Před „Kč“ nezlomitelná mezera, ať se měna na úzkém displeji neodtrhne od čísla. */
const korun = (n: number) => `${CISLO.format(Math.round(n))}\u00A0Kč`

type Tvary = [string, string, string]
const KUS: Tvary = ['kus', 'kusy', 'kusů']
const POLOZKA: Tvary = ['položka', 'položky', 'položek']

/** Český tvar podle počtu: 1 kus, 2–4 kusy, 5 kusů. */
function tvar(n: number, [jeden, dva, pet]: Tvary): string {
  const a = Math.abs(n)
  return a === 1 ? jeden : a >= 2 && a <= 4 ? dva : pet
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Název automatu, a lokalita jen tehdy, když už v názvu není. */
function misto(automat: AutomatVProvozu): string {
  const {nazev, lokalita} = automat
  return lokalita && !nazev.includes(lokalita) ? `${nazev}, ${lokalita}` : nazev
}

// --- Stavební kameny ---------------------------------------------------

function obal(o: {nadpis: string; podnadpis: string; nahled: string; obsah: string; paticka: string}): string {
  return `<!doctype html>
<html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(o.nadpis)}</title></head>
<body style="margin:0;padding:0;background:${BARVA.podklad};">
<div style="display:none;max-height:0;overflow:hidden;">${esc(o.nahled)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BARVA.podklad};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:${BARVA.karta};border:1px solid ${BARVA.cara};border-radius:8px;">
<tr><td style="padding:28px 24px 4px;font-family:${PISMO};color:${BARVA.text};">
<h1 style="margin:0;font-family:${PISMO_NADPIS};font-size:22px;line-height:1.3;font-weight:800;color:${BARVA.text};">${esc(o.nadpis)}</h1>
<div style="width:12px;height:12px;background:${BARVA.akcent};margin-top:12px;font-size:0;line-height:0;">&nbsp;</div>
<p style="margin:14px 0 0;font-size:14px;line-height:1.5;color:${BARVA.tlumena};">${esc(o.podnadpis)}</p>
</td></tr>
<tr><td style="padding:8px 24px 24px;font-family:${PISMO};font-size:15px;line-height:1.55;color:${BARVA.text};">${o.obsah}</td></tr>
<tr><td style="padding:16px 24px 24px;border-top:1px solid ${BARVA.cara};font-family:${PISMO};font-size:13px;line-height:1.5;color:${BARVA.tlumena};">${esc(o.paticka)}</td></tr>
</table>
</td></tr></table>
</body></html>`
}

function odstavec(text: string, tlumeny = false): string {
  return `<p style="margin:14px 0 0;${tlumeny ? `font-size:13px;color:${BARVA.tlumena};` : ''}">${esc(text)}</p>`
}

function sekce(nadpis: string, uvod?: string): string {
  return (
    `<h2 style="margin:30px 0 0;font-family:${PISMO_NADPIS};font-size:17px;line-height:1.3;font-weight:700;color:${BARVA.text};">${esc(nadpis)}</h2>` +
    (uvod ? `<p style="margin:6px 0 0;font-size:14px;line-height:1.5;color:${BARVA.tlumena};">${esc(uvod)}</p>` : '')
  )
}

interface Sloupec {
  nazev: string
  /** Číslo — zarovnat doprava a nezalamovat. */
  vpravo?: boolean
  /** Nezalamovat, i když je zarovnaný doleva („1 z 12“). */
  nezalamovat?: boolean
}

/** Tabulka. Buňky v `radky` musí být už ošetřené přes esc(). */
function tabulka(sloupce: Sloupec[], radky: string[][]): string {
  const zarovnani = (s: Sloupec) => `align="${s.vpravo ? 'right' : 'left'}"`
  const hlavicka = sloupce
    .map(
      (s) =>
        `<th ${zarovnani(s)} style="padding:8px 6px;border-bottom:1px solid ${BARVA.cara};font-size:12px;line-height:1.3;font-weight:600;color:${BARVA.tlumena};">${esc(s.nazev)}</th>`,
    )
    .join('')
  const telo = radky
    .map(
      (radek) =>
        `<tr>${radek
          .map(
            (bunka, i) =>
              `<td ${zarovnani(sloupce[i])} valign="top" style="padding:8px 6px;border-bottom:1px solid ${BARVA.cara};font-size:14px;line-height:1.4;${sloupce[i].vpravo || sloupce[i].nezalamovat ? 'white-space:nowrap;' : ''}">${bunka}</td>`,
          )
          .join('')}</tr>`,
    )
    .join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:10px;font-family:${PISMO};color:${BARVA.text};"><thead><tr>${hlavicka}</tr></thead><tbody>${telo}</tbody></table>`
}

const vyprodanoHtml = `<strong style="color:${BARVA.vyprodano};">vyprodáno</strong>`

// --- Upozornění na zásoby ----------------------------------------------

export function sablonaUpozorneni(
  automat: AutomatVProvozu,
  prehled: ZboziVPrehledu[],
  hranice: number,
  cas: Date,
): Sablona {
  const nove = prehled.filter((p) => p.nove)
  const noveVyprodane = nove.filter((p) => p.stav === 'vyprodano').length
  const noveDochazi = nove.length - noveVyprodane

  const coSeStalo =
    nove.length === 1
      ? `${nove[0].stav === 'vyprodano' ? 'vyprodáno' : 'dochází'}: ${nove[0].nazev}`
      : [
          noveVyprodane > 0 ? `vyprodáno: ${noveVyprodane} ${tvar(noveVyprodane, POLOZKA)}` : '',
          noveDochazi > 0 ? `dochází: ${noveDochazi} ${tvar(noveDochazi, POLOZKA)}` : '',
        ]
          .filter(Boolean)
          .join(', ')

  // Když je nové všechno (typicky první upozornění), značka u každé položky
  // nic neříká. Ukáže se jen tam, kde se nové mísí s už nahlášeným.
  const znacit = nove.length < prehled.length
  const uPolozek = `${nove.length} ${nove.length === 1 ? 'položky' : 'položek'}`

  const nadpis = noveVyprodane > 0 ? 'Zboží v automatu se vyprodalo' : 'Zboží v automatu dochází'
  const podnadpis = `${misto(automat)} · stav ${datumACas(cas)}`
  const uvod = znacit
    ? `Stav se zhoršil u ${uPolozek}, jsou označené jako nové. Níže je všechno, co teď dochází nebo chybí.`
    : `Stav se zhoršil u ${uPolozek}.`
  const paticka = `„Dochází“ znamená ${hranice} ${tvar(hranice, KUS)} nebo méně. Upozornění chodí, jen když se stav zboží zhorší, a ne mezi ${NOCNI_KLID.od}. a ${NOCNI_KLID.do}. hodinou. Hranici, příjemce i vypnutí najdete v Sanity u dokumentu Automat.`

  const radky = prehled.map((p) => [
    (znacit && p.nove ? `<strong>${esc(p.nazev)}</strong>` : esc(p.nazev)) +
      (znacit && p.nove ? `<br><span style="font-size:12px;color:${BARVA.tlumena};">nové</span>` : ''),
    p.stav === 'vyprodano' ? vyprodanoHtml : `${pocet(p.dostupnost)} z ${pocet(p.kapacita)}`,
    `${pocet(p.doplnit)} ks`,
  ])

  const html = obal({
    nadpis,
    podnadpis,
    nahled: `${coSeStalo}.`,
    obsah:
      odstavec(uvod) +
      tabulka([{nazev: 'Zboží'}, {nazev: 'Zbývá', nezalamovat: true}, {nazev: 'Doplnit do plna', vpravo: true}], radky),
    paticka,
  })

  const text = [
    nadpis,
    podnadpis,
    '',
    uvod,
    '',
    ...prehled.map(
      (p) =>
        `- ${p.nazev}: ${p.stav === 'vyprodano' ? 'vyprodáno' : `zbývá ${p.dostupnost} z ${p.kapacita}`}, doplnit ${p.doplnit} ks${znacit && p.nove ? ' (nové)' : ''}`,
    ),
    '',
    paticka,
  ].join('\n')

  return {predmet: `${automat.nazev} – ${coSeStalo}`, html, text}
}

// --- Výpadek a obnovení ------------------------------------------------

function doba(ms: number): string {
  const minut = Math.max(1, Math.round(ms / 60000))
  if (minut < 90) return `${minut} ${tvar(minut, ['minutu', 'minuty', 'minut'])}`
  const hodin = Math.round(minut / 60)
  if (hodin < 48) return `${hodin} ${tvar(hodin, ['hodinu', 'hodiny', 'hodin'])}`
  const dni = Math.round(hodin / 24)
  return `${dni} ${tvar(dni, ['den', 'dny', 'dní'])}`
}

export function sablonaVypadku(
  automat: AutomatVProvozu,
  udaje: {od: Date; pokusu?: number; chyba?: string; obnoveno?: Date},
): Sablona {
  const podnadpis = misto(automat)
  let nadpis: string
  let odstavce: string[]
  let detail = ''
  let paticka: string

  if (udaje.obnoveno) {
    nadpis = 'Automat zase odpovídá'
    odstavce = [
      `Stav automatu se od ${datumACas(udaje.obnoveno)} zase daří načíst. Výpadek trval zhruba ${doba(udaje.obnoveno.getTime() - udaje.od.getTime())}.`,
      'Jestli během něj nějaké zboží došlo, přijde o tom samostatné upozornění.',
    ]
    paticka = 'Upozornění vypnete v Sanity u dokumentu Automat.'
  } else {
    const pokusu = udaje.pokusu ?? 0
    // 401 a 403 znamenají, že MůjAutomat nepřijal klíč — to se samo nespraví.
    const odmitnutyKlic = /→ 40[13]\b/.test(udaje.chyba ?? '')
    nadpis = 'Automat neodpovídá'
    odstavce = [
      `Od ${datumACas(udaje.od)} se nedaří načíst stav automatu z MůjAutomatu, ${pokusu} ${tvar(pokusu, ['pokus', 'pokusy', 'pokusů'])} po sobě.`,
      'Web mezitím ukazuje poslední známou nabídku, návštěvníci tedy nic rozbitého nevidí.',
      odmitnutyKlic
        ? 'MůjAutomat odmítl klíč k API. Mohl vypršet nebo být zrušený. Nový klíč je potřeba vložit do Cloudflare jako MUJAUTOMAT_API_KEY.'
        : 'Zkontrolujte v administraci MůjAutomatu, jestli je automat online. Když ano, jde nejspíš o výpadek na straně MůjAutomatu a stačí počkat.',
    ]
    detail = udaje.chyba ? `Technický detail: ${udaje.chyba}` : ''
    paticka = 'Až automat zase začne odpovídat, přijde krátká zpráva. Upozornění vypnete v Sanity u dokumentu Automat.'
  }

  const html = obal({
    nadpis,
    podnadpis,
    nahled: odstavce[0],
    obsah: odstavce.map((o) => odstavec(o)).join('') + (detail ? odstavec(detail, true) : ''),
    paticka,
  })

  const text = [nadpis, podnadpis, '', ...odstavce, ...(detail ? ['', detail] : []), '', paticka].join('\n')

  return {predmet: `${automat.nazev} – ${udaje.obnoveno ? 'zase odpovídá' : 'neodpovídá'}`, html, text}
}

// --- Týdenní report ----------------------------------------------------

function srovnani(ted: number, pred: number, format: (n: number) => string): string {
  if (pred === 0) return ted === 0 ? 'předchozí týden také nula' : 'předchozí týden nula'
  const procent = Math.round(((ted - pred) / pred) * 100)
  const zmena = procent === 0 ? 'beze změny' : `${procent > 0 ? '+' : '−'}${Math.abs(procent)} %`
  return `${zmena}, předchozí týden ${format(pred)}`
}

/** Jeden ukazatel na řádek — tři vedle sebe se na mobilu nevejdou. */
function ukazatel(popisek: string, hodnota: string, porovnani: string): string {
  return `<tr>
<td valign="top" style="padding:12px 0;border-bottom:1px solid ${BARVA.cara};font-family:${PISMO};">
<div style="font-size:14px;line-height:1.35;color:${BARVA.text};">${esc(popisek)}</div>
<div style="font-size:12px;line-height:1.35;color:${BARVA.tlumena};margin-top:2px;">${esc(porovnani)}</div>
</td>
<td align="right" valign="top" style="padding:12px 0 12px 12px;border-bottom:1px solid ${BARVA.cara};font-family:${PISMO_NADPIS};font-size:24px;line-height:1.2;font-weight:800;color:${BARVA.text};white-space:nowrap;">${esc(hodnota)}</td>
</tr>`
}

const DNY = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export function sablonaReportu(automat: AutomatVProvozu, r: Report): Sablona {
  const nedele = new Date(r.obdobi.do.getTime() - 1)
  const obdobi = `${datum(r.obdobi.od, false)} – ${datum(nedele)}`
  const nadpis = 'Týdenní report automatu'
  const podnadpis = `${misto(automat)} · ${obdobi}`
  const prumer = r.nakupy > 0 ? `Průměrný nákup ${korun(r.trzba / r.nakupy)}.` : ''

  const ukazatele = [
    {popisek: 'Prodáno kusů', hodnota: pocet(r.kusy), porovnani: srovnani(r.kusy, r.kusyPred, pocet)},
    {popisek: 'Nákupů', hodnota: pocet(r.nakupy), porovnani: srovnani(r.nakupy, r.nakupyPred, pocet)},
    {popisek: 'Tržba', hodnota: korun(r.trzba), porovnani: srovnani(r.trzba, r.trzbaPred, korun)},
  ]

  const uvodDoplneni = `Stav zásob ${datumACas(r.zasobyK)}. Vyprodané a docházející zboží a to, kterému by při tempu minulého týdne zásoba nevydržela do dalšího pondělí.`
  const uvodBezProdeje = 'Zboží je skladem, ale za posledních 14 dní se neprodal ani kus. Zvažte výměnu za jiné.'
  const paticka =
    'Report obsahuje tržby, proto chodí jen na adresy uvedené u automatu a na web se nedostane. Tržba je součet zaplacených objednávek podle MůjAutomatu. Příjemce i vypnutí reportu najdete v Sanity u dokumentu Automat.'

  // --- HTML
  let obsah =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-collapse:collapse;">${ukazatele
      .map((u) => ukazatel(u.popisek, u.hodnota, u.porovnani))
      .join('')}</table>` + (prumer ? odstavec(prumer) : '')

  if (r.kusy === 0) {
    obsah += odstavec('Za týden se nic neprodalo.')
  } else {
    obsah +=
      sekce('Prodej podle dnů') +
      tabulka(
        DNY.map((d) => ({nazev: d, vpravo: true})),
        [r.podleDnu.map((k) => pocet(k))],
      ) +
      sekce('Nejprodávanější zboží') +
      tabulka(
        [{nazev: 'Zboží'}, {nazev: 'Kategorie'}, {nazev: 'Kusů', vpravo: true}],
        r.nejprodavanejsi.map((z) => [esc(z.nazev), esc(z.kategorie), pocet(z.kusy)]),
      ) +
      sekce('Podle kategorií') +
      tabulka(
        [{nazev: 'Kategorie'}, {nazev: 'Kusů', vpravo: true}, {nazev: 'Podíl', vpravo: true}],
        r.kategorie.map((k) => [esc(k.nazev), pocet(k.kusy), `${Math.round((k.kusy / r.kusy) * 100)} %`]),
      )
  }

  obsah += sekce('Co doplnit', uvodDoplneni)
  obsah +=
    r.doplnit.length === 0
      ? odstavec('Nic doplňovat nemusíte.')
      : tabulka(
          [{nazev: 'Zboží'}, {nazev: 'Zbývá', nezalamovat: true}, {nazev: 'Za týden', vpravo: true}, {nazev: 'Doplnit', vpravo: true}],
          r.doplnit.map((p) => [
            esc(p.nazev),
            p.stav === 'vyprodano' ? vyprodanoHtml : `${pocet(p.dostupnost)} z ${pocet(p.kapacita)}`,
            `${pocet(p.kusyZaTyden)} ks`,
            `${pocet(p.doplnit)} ks`,
          ]),
        )

  if (r.bezProdeje.length > 0) {
    obsah +=
      sekce('Za 14 dní se neprodalo', uvodBezProdeje) +
      tabulka(
        [{nazev: 'Zboží'}, {nazev: 'Skladem', vpravo: true}],
        r.bezProdeje.map((p) => [esc(p.nazev), `${pocet(p.dostupnost)} ks`]),
      )
  }

  const html = obal({
    nadpis,
    podnadpis,
    nahled: `Prodáno ${pocet(r.kusy)} ${tvar(r.kusy, KUS)}, tržba ${korun(r.trzba)}.`,
    obsah,
    paticka,
  })

  // --- Čistý text
  const text: string[] = [
    nadpis,
    podnadpis,
    '',
    ...ukazatele.map((u) => `${u.popisek}: ${u.hodnota} (${u.porovnani})`),
    ...(prumer ? [prumer] : []),
  ]

  if (r.kusy === 0) {
    text.push('', 'Za týden se nic neprodalo.')
  } else {
    text.push(
      '',
      'PRODEJ PODLE DNŮ',
      DNY.map((d, i) => `${d} ${r.podleDnu[i]}`).join(' · '),
      '',
      'NEJPRODÁVANĚJŠÍ ZBOŽÍ',
      ...r.nejprodavanejsi.map((z, i) => `${i + 1}. ${z.nazev} (${z.kategorie}): ${z.kusy} ks`),
      '',
      'PODLE KATEGORIÍ',
      ...r.kategorie.map((k) => `- ${k.nazev}: ${k.kusy} ks (${Math.round((k.kusy / r.kusy) * 100)} %)`),
    )
  }

  text.push('', 'CO DOPLNIT', uvodDoplneni)
  if (r.doplnit.length === 0) text.push('Nic doplňovat nemusíte.')
  for (const p of r.doplnit) {
    text.push(
      `- ${p.nazev}: ${p.stav === 'vyprodano' ? 'vyprodáno' : `zbývá ${p.dostupnost} z ${p.kapacita}`}, za týden ${p.kusyZaTyden} ks, doplnit ${p.doplnit} ks`,
    )
  }

  if (r.bezProdeje.length > 0) {
    text.push('', 'ZA 14 DNÍ SE NEPRODALO', uvodBezProdeje, ...r.bezProdeje.map((p) => `- ${p.nazev} (skladem ${p.dostupnost} ks)`))
  }

  text.push('', paticka)

  return {predmet: `Týdenní report: ${automat.nazev}, ${obdobi}`, html, text: text.join('\n')}
}
