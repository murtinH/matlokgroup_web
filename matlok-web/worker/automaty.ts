import type {Env} from './index'

/**
 * DOČASNÁ POMŮCKA — po zjištění machineId smazat.
 *
 * Vypíše seznam automatů z Partner API MůjAutomat, aby se dalo najít
 * machineId. Vrací výhradně identifikátor a název; nic dalšího z odpovědi
 * neprochází ven. Zadání (kapitola 6) zakazuje pouštět na web tržby, marže
 * a počty prodejů, a nechci riskovat, že by je API vrátilo v poli, o kterém
 * nevím. Proto se vypisují jen názvy ostatních polí, ne jejich hodnoty —
 * podle nich pak dopíšu skutečné napojení v Session 5.
 */

const BASE = 'https://www.mujautomat.cz/api/partner/v1'

/** Zkusí najít hodnotu pod některým z obvyklých názvů pole. */
function najdi(zaznam: Record<string, unknown>, moznosti: string[]): string | null {
  for (const klic of moznosti) {
    const hodnota = zaznam[klic]
    if (typeof hodnota === 'string' || typeof hodnota === 'number') return String(hodnota)
  }
  return null
}

export async function vypisAutomaty(env: Env): Promise<Response> {
  if (!env.MUJAUTOMAT_API_KEY) {
    return Response.json(
      {ok: false, chyba: 'V Cloudflare není proměnná MUJAUTOMAT_API_KEY.'},
      {status: 500},
    )
  }

  const odpoved = await fetch(`${BASE}/machines`, {
    headers: {
      authorization: `Bearer ${env.MUJAUTOMAT_API_KEY}`,
      accept: 'application/json',
    },
  })

  const telo = await odpoved.text()

  if (!odpoved.ok) {
    // Tělo chyby může obsahovat cokoli, proto ven jde jen stavový kód
    // a prvních dvě stě znaků, ať se dá poznat, co API vytýká.
    return Response.json(
      {ok: false, stav: odpoved.status, popis: telo.slice(0, 200)},
      {status: 502},
    )
  }

  let data: unknown
  try {
    data = JSON.parse(telo)
  } catch {
    return Response.json({ok: false, chyba: 'API nevrátilo JSON.'}, {status: 502})
  }

  // Seznam bývá buď přímo polem, nebo zabalený v obálce.
  const obal = data as Record<string, unknown>
  const seznam = Array.isArray(data)
    ? data
    : Array.isArray(obal.data)
      ? obal.data
      : Array.isArray(obal.machines)
        ? obal.machines
        : Array.isArray(obal.items)
          ? obal.items
          : []

  const automaty = (seznam as Record<string, unknown>[]).map((z) => ({
    machineId: najdi(z, ['id', 'machineId', 'machine_id', 'uuid', 'code', 'kod']),
    nazev: najdi(z, ['name', 'nazev', 'title', 'label', 'displayName']),
  }))

  return Response.json({
    ok: true,
    pocet: automaty.length,
    automaty,
    // Jen názvy polí, ne hodnoty — ať vím, jak API odpovídá, a přitom
    // se ven nedostane nic citlivého.
    dostupnaPole: seznam.length > 0 ? Object.keys(seznam[0] as object).sort() : [],
    obalka: Array.isArray(data) ? '(pole)' : Object.keys(obal).sort(),
  })
}
