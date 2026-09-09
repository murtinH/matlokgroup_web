/**
 * Drobečková navigace pro strukturovaná data.
 *
 * Web nemá viditelnou drobečkovou lištu; Google ji přijímá i jen v JSON-LD
 * a nahrazuje jí holou adresu v řádku výsledku.
 */
export function drobecky(zaklad: string, kroky: {nazev: string; cesta: string}[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [{nazev: 'Domů', cesta: '/'}, ...kroky].map((k, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: k.nazev,
      item: `${zaklad}${k.cesta}`,
    })),
  }
}
