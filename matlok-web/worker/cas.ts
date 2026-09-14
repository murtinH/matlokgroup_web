/**
 * Pražský čas pro provoz automatu.
 *
 * Worker běží v UTC. Upozornění a report ale mluví o ránu, pondělí
 * a minulém týdnu tak, jak je vnímá člověk ve Špindlerově Mlýně —
 * včetně přechodu na letní a zimní čas.
 */

export const CASOVE_PASMO = 'Europe/Prague'
export const DEN_MS = 24 * 60 * 60 * 1000

/**
 * Noční klid podle pražského času. V noci nikdo nedoplňuje, takže
 * upozornění ve tři ráno by jen budilo. Hlídání automatu v té době
 * neběží vůbec — první ranní běh porovná stav s posledním nahlášeným
 * a pošle v jednom e-mailu všechno, co se přes noc zhoršilo.
 */
export const NOCNI_KLID = {od: 22, do: 7}

const ZKRATKY_DNU = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const CASTI = new Intl.DateTimeFormat('en-US', {
  timeZone: CASOVE_PASMO,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  weekday: 'short',
  hourCycle: 'h23',
})

export interface CastiCasu {
  rok: number
  mesic: number
  den: number
  hodina: number
  minuta: number
  sekunda: number
  /** 0 = pondělí, 6 = neděle */
  denTydne: number
}

export function castiVPraze(cas: Date): CastiCasu {
  const c: Record<string, string> = {}
  for (const {type, value} of CASTI.formatToParts(cas)) c[type] = value
  return {
    rok: Number(c.year),
    mesic: Number(c.month),
    den: Number(c.day),
    hodina: Number(c.hour) % 24,
    minuta: Number(c.minute),
    sekunda: Number(c.second),
    denTydne: ZKRATKY_DNU.indexOf(c.weekday),
  }
}

/** Okamžik, kdy v Praze začíná daný kalendářní den. */
export function pulnocVPraze(rok: number, mesic: number, den: number): Date {
  // Čas se přestavuje ve dvě nebo ve tři ráno, takže posun proti UTC
  // o půlnoci UTC je stejný jako o pražské půlnoci téhož dne.
  const utc = Date.UTC(rok, mesic - 1, den)
  const c = castiVPraze(new Date(utc))
  const posun = Date.UTC(c.rok, c.mesic - 1, c.den, c.hodina, c.minuta, c.sekunda) - utc
  return new Date(utc - posun)
}

export function jeNocniKlid(cas: Date): boolean {
  const {hodina} = castiVPraze(cas)
  return hodina >= NOCNI_KLID.od || hodina < NOCNI_KLID.do
}

/** „14. 9. 2026“, bez roku „14. 9.“ */
export function datum(cas: Date, sRokem = true): string {
  const c = castiVPraze(cas)
  return sRokem ? `${c.den}. ${c.mesic}. ${c.rok}` : `${c.den}. ${c.mesic}.`
}

/** „14. 9. 2026 8:05“ */
export function datumACas(cas: Date): string {
  const c = castiVPraze(cas)
  return `${datum(cas)} ${c.hodina}:${String(c.minuta).padStart(2, '0')}`
}
