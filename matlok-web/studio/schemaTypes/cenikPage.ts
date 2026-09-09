import {defineArrayMember, defineField, defineType} from 'sanity'
import {zakazBezDph, zakazBezDphVDokumentu} from './validace'

/**
 * Ceník Digital Services — stránka /cenik.
 *
 * Celý obsah stránky je tady, v komponentě není natvrdo ani jedna cena
 * (CLAUDE.md: „Obsah nikdy natvrdo v komponentě").
 *
 * Ceny jsou řetězce, ne čísla. Vedle „15 000 Kč" stojí v ceníku i „v ceně",
 * „700 Kč/h" nebo „+ 2 500 Kč za každou další stránku" — redaktor je píše
 * přesně tak, jak mají být vidět. Číslo navíc (cenaCislo) je jen u tarifů
 * a slouží výhradně strukturovaným datům pro vyhledávače.
 */

/** Karta tarifu. Stejný tvar pro weby i pro sociální sítě. */
const tarif = defineArrayMember({
  type: 'object',
  name: 'tarif',
  fields: [
    defineField({
      name: 'stitek',
      title: 'Štítek nad názvem',
      type: 'string',
      description: 'Například: Základ, Nejčastější volba, Rozšířené, A Class.',
    }),
    defineField({name: 'nazev', title: 'Název', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'cena',
      title: 'Cena',
      type: 'string',
      description:
        'Přesně tak, jak má být vidět: „15 000 Kč" nebo „5 900 Kč / měsíc". Nikdy nepsat „bez DPH".',
      validation: (r) => r.required().custom(zakazBezDph),
    }),
    defineField({
      name: 'cenaCislo',
      title: 'Cena číslem — jen pro vyhledávače',
      type: 'number',
      description:
        'Na stránce se nezobrazuje. Google z ní skládá nabídku ve výsledcích vyhledávání. Vyplnit jen tehdy, když je cena jedno číslo v korunách (15000). U cen „od" nebo individuálních nechat prázdné.',
      validation: (r) => r.positive(),
    }),
    defineField({
      name: 'polozky',
      title: 'Co tarif obsahuje',
      type: 'array',
      of: [{type: 'string'}],
      validation: (r) => r.min(1),
    }),
    defineField({
      name: 'vCene',
      title: 'Řádek „V ceně"',
      type: 'text',
      rows: 2,
      description: 'Uzavírá kartu. Například: V ceně: mobilní verze · SSL · redakční systém …',
      validation: (r) => r.custom(zakazBezDph),
    }),
    defineField({
      name: 'zvyraznit',
      title: 'Zvýraznit kartu',
      type: 'boolean',
      initialValue: false,
      description: 'Silnější rámeček a stín. Ve skupině zvýrazněte nejvýš jeden tarif.',
    }),
  ],
  preview: {
    select: {title: 'nazev', subtitle: 'cena', zvyraznit: 'zvyraznit'},
    prepare: ({title, subtitle, zvyraznit}) => ({
      title: zvyraznit ? `${title} ★` : title,
      subtitle,
    }),
  },
})

/** Řádek doplňkového ceníku. Cena smí být i slovo („v ceně"). */
const polozkaCeniku = defineArrayMember({
  type: 'object',
  name: 'polozkaCeniku',
  fields: [
    defineField({name: 'nazev', title: 'Položka', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'popis',
      title: 'Upřesnění',
      type: 'string',
      description: 'Malý řádek pod položkou, například „do 20 upravených fotografií".',
      validation: (r) => r.custom(zakazBezDph),
    }),
    defineField({
      name: 'cena',
      title: 'Cena',
      type: 'string',
      description:
        'Například „8 900 Kč", „+ 2 500 Kč", „700 Kč/h", „v ceně". Prázdné = řádek bez ceny.',
      validation: (r) => r.custom(zakazBezDph),
    }),
  ],
  preview: {select: {title: 'nazev', subtitle: 'cena'}},
})

/** Doplňkový blok — nadpis a pod ním řádky s cenami. */
const blokCeniku = defineArrayMember({
  type: 'object',
  name: 'blokCeniku',
  fields: [
    defineField({name: 'nadpis', title: 'Nadpis', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'popis',
      title: 'Úvodní věta',
      type: 'text',
      rows: 2,
      validation: (r) => r.custom(zakazBezDph),
    }),
    defineField({
      name: 'polozky',
      title: 'Řádky',
      type: 'array',
      of: [polozkaCeniku],
      validation: (r) => r.min(1),
    }),
    defineField({
      name: 'poznamka',
      title: 'Poznámka pod blokem',
      type: 'text',
      rows: 2,
      validation: (r) => r.custom(zakazBezDph),
    }),
  ],
  preview: {
    select: {title: 'nadpis', polozky: 'polozky'},
    prepare: ({title, polozky}) => ({title, subtitle: `${(polozky ?? []).length} řádků`}),
  },
})

/**
 * Cenová skupina — jeden obor služeb s vlastními tarify a doplňky.
 *
 * Skupiny jsou pole, ne pevná pole „weby" a „sítě". Třetí obor jde přidat
 * v Sanity, bez zásahu do kódu a bez nasazení.
 */
const skupina = defineArrayMember({
  type: 'object',
  name: 'skupina',
  fields: [
    defineField({name: 'eyebrow', title: 'Nadřádek', type: 'string'}),
    defineField({name: 'nadpis', title: 'Nadpis', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'kotva',
      title: 'Kotva v adrese',
      type: 'string',
      description: 'Bez mřížky, malými písmeny a bez diakritiky — například „weby".',
      validation: (r) =>
        r.required().regex(/^[a-z0-9-]+$/, {name: 'malá písmena, číslice a pomlčky'}),
    }),
    defineField({
      name: 'lead',
      title: 'Perex',
      type: 'text',
      rows: 3,
      validation: (r) => r.custom(zakazBezDph),
    }),
    defineField({name: 'tarify', title: 'Tarify', type: 'array', of: [tarif], validation: (r) => r.max(4)}),
    defineField({
      name: 'poznamka',
      title: 'Poznámka pod tarify',
      type: 'text',
      rows: 2,
      validation: (r) => r.custom(zakazBezDph),
    }),
    defineField({name: 'bloky', title: 'Doplňkové ceníky', type: 'array', of: [blokCeniku]}),
  ],
  preview: {
    select: {title: 'nadpis', tarify: 'tarify'},
    prepare: ({title, tarify}) => ({title, subtitle: `${(tarify ?? []).length} tarifů`}),
  },
})

/** Faktor, který u automatů rozhoduje o ceně. */
const faktor = defineArrayMember({
  type: 'object',
  name: 'faktor',
  fields: [
    defineField({name: 'nadpis', title: 'Nadpis', type: 'string'}),
    defineField({name: 'text', title: 'Text', type: 'text', rows: 3}),
    defineField({
      name: 'ikona',
      title: 'Ikona',
      type: 'string',
      options: {
        list: [
          {title: 'Posuvníky', value: 'posuvniky'},
          {title: 'Řetěz', value: 'retez'},
          {title: 'Fotoaparát', value: 'foto'},
          {title: 'Obnovení', value: 'obnoveni'},
          {title: 'Hodiny', value: 'hodiny'},
          {title: 'Platební karta', value: 'karta'},
          {title: 'Provoz', value: 'provoz'},
          {title: 'Konzultace', value: 'konzultace'},
        ],
      },
    }),
  ],
  preview: {select: {title: 'nadpis', subtitle: 'text'}},
})

/** Sleva na konci stránky. */
const sleva = defineArrayMember({
  type: 'object',
  name: 'sleva',
  fields: [
    defineField({
      name: 'hodnota',
      title: 'Sleva',
      type: 'string',
      description: 'Například −5 %. Používejte typografické minus (−), ne spojovník.',
      validation: (r) => r.required(),
    }),
    defineField({name: 'nazev', title: 'Kdy platí', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'popis', title: 'Upřesnění', type: 'string', validation: (r) => r.custom(zakazBezDph)}),
  ],
  preview: {select: {title: 'nazev', subtitle: 'hodnota'}},
})

const tlacitko = (name: string, title: string, group: string) =>
  defineField({
    name,
    title,
    type: 'object',
    group,
    fields: [
      defineField({name: 'text', title: 'Text', type: 'string'}),
      defineField({name: 'odkaz', title: 'Odkaz', type: 'string'}),
    ],
  })

export const cenikPage = defineType({
  name: 'cenikPage',
  title: 'Stránka Ceník',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Úvod'},
    {name: 'skupiny', title: 'Ceny služeb'},
    {name: 'automaty', title: 'Automaty'},
    {name: 'proces', title: 'Jak to probíhá'},
    {name: 'slevy', title: 'Slevy'},
    {name: 'seo', title: 'Vyhledávače'},
  ],
  // Záchranná síť nad celým dokumentem. Kdyby přibylo pole bez vlastní
  // kontroly, „bez DPH" přes něj stejně neprojde.
  validation: (rule) => rule.custom(zakazBezDphVDokumentu),
  fields: [
    // --- Úvod ---
    defineField({name: 'heroEyebrow', title: 'Nadřádek', type: 'string', group: 'hero', validation: (r) => r.required()}),
    defineField({name: 'heroNadpis', title: 'Nadpis — první řádek', type: 'string', group: 'hero', validation: (r) => r.required()}),
    defineField({name: 'heroNadpisTip', title: 'Nadpis — druhý řádek', type: 'string', group: 'hero', validation: (r) => r.required()}),
    defineField({
      name: 'heroLead', title: 'Perex', type: 'text', rows: 4, group: 'hero',
      validation: (r) => r.required().custom(zakazBezDph),
    }),
    defineField({
      name: 'poznamkaDph', title: 'Věta o DPH', type: 'string', group: 'hero',
      description: 'Povinná. Například: Nejsme plátci DPH — uvedené ceny jsou konečné.',
      validation: (r) => r.required().custom(zakazBezDph),
    }),
    defineField({
      name: 'platnost', title: 'Platnost ceníku — text', type: 'string', group: 'hero',
      description: 'Například: Ceník platí od 1. 10. 2026 do odvolání.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'platnostOd', title: 'Platnost ceníku — datum', type: 'date', group: 'hero',
      options: {dateFormat: 'D. M. YYYY'},
      description: 'Nezobrazuje se. Jde do strukturovaných dat pro vyhledávače (validFrom).',
    }),

    // --- Ceny služeb ---
    defineField({
      name: 'skupiny', title: 'Cenové skupiny', type: 'array', of: [skupina], group: 'skupiny',
      description: 'Weby na míru, Sociální sítě. Pořadí na stránce určuje pořadí tady.',
    }),

    // --- Automaty ---
    defineField({name: 'automatyEyebrow', title: 'Nadřádek', type: 'string', group: 'automaty'}),
    defineField({name: 'automatyNadpis', title: 'Nadpis', type: 'string', group: 'automaty'}),
    defineField({
      name: 'automatyLead', title: 'Perex', type: 'text', rows: 4, group: 'automaty',
      description: 'Automaty nemají pevný ceník. Text musí říct proč a odkázat na kontakt.',
      validation: (r) => r.custom(zakazBezDph),
    }),
    defineField({name: 'automatyFaktory', title: 'Co rozhoduje o ceně', type: 'array', of: [faktor], group: 'automaty', validation: (r) => r.max(6)}),
    defineField({name: 'automatyCtaNadpis', title: 'Výzva — nadpis', type: 'string', group: 'automaty'}),
    defineField({name: 'automatyCtaLead', title: 'Výzva — text', type: 'text', rows: 3, group: 'automaty', validation: (r) => r.custom(zakazBezDph)}),
    tlacitko('automatyTlacitko', 'Výzva — tlačítko', 'automaty'),

    // --- Jak to probíhá ---
    defineField({
      name: 'procesZobrazit', title: 'Zobrazit sekci „Jak to probíhá"', type: 'boolean',
      group: 'proces', initialValue: true,
      description: 'Jedno přepnutí sekci schová i vrátí. Obsah zůstane uložený.',
    }),
    defineField({name: 'procesEyebrow', title: 'Nadřádek', type: 'string', group: 'proces'}),
    defineField({name: 'procesNadpis', title: 'Nadpis', type: 'string', group: 'proces'}),
    defineField({
      name: 'proces', title: 'Kroky', type: 'array', group: 'proces',
      description: 'Číslují se automaticky podle pořadí, stejně jako principy na /sluzby.',
      of: [defineArrayMember({
        type: 'object', name: 'krok',
        fields: [
          defineField({name: 'nadpis', title: 'Nadpis', type: 'string'}),
          defineField({name: 'popis', title: 'Popis', type: 'string', validation: (r) => r.custom(zakazBezDph)}),
        ],
        preview: {select: {title: 'nadpis', subtitle: 'popis'}},
      })],
      validation: (r) => r.max(6),
    }),

    // --- Slevy ---
    defineField({name: 'slevyEyebrow', title: 'Nadřádek', type: 'string', group: 'slevy'}),
    defineField({name: 'slevyNadpis', title: 'Nadpis', type: 'string', group: 'slevy'}),
    defineField({name: 'slevyLead', title: 'Perex', type: 'text', rows: 3, group: 'slevy', validation: (r) => r.custom(zakazBezDph)}),
    defineField({name: 'slevy', title: 'Slevy', type: 'array', of: [sleva], group: 'slevy', validation: (r) => r.max(3)}),
    defineField({
      name: 'slevyPoznamka', title: 'Poznámka pod slevami', type: 'text', rows: 2, group: 'slevy',
      description: 'Sem patří zopakování věty o DPH a platnosti ceníku.',
      validation: (r) => r.custom(zakazBezDph),
    }),
    tlacitko('slevyTlacitko', 'Tlačítko', 'slevy'),

    // --- Vyhledávače ---
    defineField({
      name: 'seoTitulek', title: 'Titulek pro vyhledávače', type: 'string', group: 'seo',
      description: 'Prázdné = poskládá se z nadpisu a názvu společnosti. Google zobrazí zhruba 60 znaků.',
      validation: (r) => r.max(60).warning('Delší než 60 znaků Google zkrátí.'),
    }),
    defineField({
      name: 'seoPopis', title: 'Popis pro vyhledávače', type: 'text', rows: 3, group: 'seo',
      description: 'Prázdné = zkrácený perex. Ideálně 120–155 znaků.',
      validation: (r) => [
        r.max(160).warning('Delší než 160 znaků se ve výsledcích ořízne.'),
        r.custom(zakazBezDph),
      ],
    }),
  ],
  preview: {prepare: () => ({title: 'Stránka Ceník'})},
})
