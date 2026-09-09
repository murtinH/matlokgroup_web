/**
 * Sdílená pravidla validace obsahu.
 *
 * Matlok Group s.r.o. není plátcem DPH. Sousloví „bez DPH" je u neplátce
 * zavádějící — žádné DPH se k ceně nepřipočítává, ceny jsou konečné
 * (ZADANI.md kap. 7, CLAUDE.md).
 *
 * Kontrola byla dosud opsaná dvakrát, ve faq.ts a v kontaktPage.ts.
 * Ceník by přidal další místa, tak je na jednom.
 */
export function zakazBezDph(hodnota: unknown): true | string {
  return typeof hodnota === 'string' && /bez\s+DPH/i.test(hodnota)
    ? 'Nepoužívat „bez DPH". Společnost není plátcem DPH, ceny jsou konečné.'
    : true
}

/**
 * Stejná kontrola nad celým dokumentem. Záchranná síť pro pole, která
 * u sebe vlastní validaci nemají — třeba pro takové, které do schématu
 * teprve přibude. Používá se navíc, ne místo té první.
 */
export function zakazBezDphVDokumentu(dokument: unknown): true | string {
  return /bez\s+DPH/i.test(JSON.stringify(dokument ?? {}))
    ? 'Někde v dokumentu je „bez DPH". Společnost není plátcem DPH, ceny jsou konečné.'
    : true
}
