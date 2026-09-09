import {defineField, defineType} from 'sanity'

/**
 * Texty domovské stránky. Jediný dokument svého druhu.
 *
 * Kapitola 5 v ZADANI.md tenhle typ neuvádí, ale bez něj by většina textů
 * na domovské stránce musela být natvrdo v komponentě — což CLAUDE.md
 * i POSTUP.md výslovně zakazují. Divize, zakladatelé a služby mají vlastní
 * dokumenty; sem patří jen to, co nikam jinam nepatří.
 */

const dvojiceCislo = {
  type: 'object',
  name: 'statistika',
  fields: [
    {name: 'hodnota', title: 'Hodnota', type: 'string'},
    {name: 'popisek', title: 'Popisek', type: 'string'},
    {
      name: 'zdroj',
      title: 'Brát hodnotu z automatu',
      type: 'string',
      description:
        'Když je vyplněno, hodnotu přepíše živý údaj z Partner API. Ručně zadaná hodnota slouží jako záloha, než se data načtou. U prodaných kusů zálohu nevyplňujte číslem — to nikdo neověří; nechte pomlčku.',
      options: {
        list: [
          {title: 'Počet produktů v nabídce', value: 'pocet'},
          {title: 'Prodaných kusů celkem', value: 'prodano'},
        ],
      },
    },
    {
      name: 'maleFormatovani',
      title: 'Menší písmo',
      type: 'boolean',
      description: 'Zapnout u víceslovných hodnot, aby se vešly na řádek.',
      initialValue: false,
    },
  ],
  preview: {select: {title: 'hodnota', subtitle: 'popisek'}},
}

export const homePage = defineType({
  name: 'homePage',
  title: 'Domovská stránka',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Hero'},
    {name: 'divize', title: 'Divize'},
    {name: 'zakladatele', title: 'Zakladatelé'},
    {name: 'proc', title: 'Proč Matlok'},
  ],
  fields: [
    // --- Hero ---
    defineField({name: 'heroEyebrow', title: 'Nadřádek', type: 'string', group: 'hero',
      validation: (r) => r.required()}),
    defineField({name: 'heroNadpis', title: 'Nadpis — první řádek', type: 'string', group: 'hero',
      validation: (r) => r.required()}),
    defineField({name: 'heroNadpisTip', title: 'Nadpis — druhý řádek', type: 'string', group: 'hero',
      description: 'Pod tímhle řádkem je azurová patka.', validation: (r) => r.required()}),
    defineField({name: 'heroLead', title: 'Perex', type: 'text', rows: 4, group: 'hero',
      validation: (r) => r.required()}),
    defineField({
      name: 'heroTlacitka', title: 'Tlačítka', type: 'array', group: 'hero',
      of: [{
        type: 'object', name: 'tlacitko',
        fields: [
          {name: 'text', title: 'Text', type: 'string'},
          {name: 'odkaz', title: 'Odkaz', type: 'string'},
        ],
        preview: {select: {title: 'text', subtitle: 'odkaz'}},
      }],
      validation: (r) => r.max(2),
    }),
    defineField({name: 'heroStatistiky', title: 'Čísla pod perexem', type: 'array', group: 'hero',
      of: [dvojiceCislo], validation: (r) => r.max(4)}),

    // --- Živá karta ---
    defineField({
      name: 'zivaKarta', title: 'Živá karta', type: 'object', group: 'hero',
      description: 'Karta automatu vpravo v hero sekci. V Session 5 se čísla nahradí živými daty z API.',
      fields: [
        {name: 'titulek', title: 'Titulek', type: 'string'},
        {name: 'stav', title: 'Stav', type: 'string', description: 'Například: Otevřeno'},
        {name: 'misto', title: 'Místo', type: 'string'},
        {name: 'podtitulek', title: 'Podtitulek', type: 'string'},
        {name: 'kpi', title: 'Čísla', type: 'array', of: [dvojiceCislo], validation: (r: any) => r.max(3)},
        {name: 'poznamka', title: 'Poznámka pod čarou', type: 'string'},
      ],
    }),
    defineField({name: 'pas', title: 'Běžící pás', type: 'array', of: [{type: 'string'}],
      options: {layout: 'tags'}, group: 'hero',
      description: 'Krátké názvy oborů. Na webu se opakují dokola.'}),

    // --- Sekce divizí ---
    defineField({name: 'divizeEyebrow', title: 'Nadřádek', type: 'string', group: 'divize'}),
    defineField({name: 'divizeNadpis', title: 'Nadpis', type: 'string', group: 'divize'}),
    defineField({name: 'divizeLead', title: 'Perex', type: 'text', rows: 3, group: 'divize'}),

    // --- Sekce zakladatelů ---
    defineField({name: 'zakladateleEyebrow', title: 'Nadřádek', type: 'string', group: 'zakladatele'}),
    defineField({name: 'zakladateleNadpis', title: 'Nadpis — první řádek', type: 'string', group: 'zakladatele'}),
    defineField({name: 'zakladateleNadpisTip', title: 'Nadpis — druhý řádek', type: 'string', group: 'zakladatele'}),
    defineField({name: 'zakladateleLead', title: 'Perex', type: 'text', rows: 4, group: 'zakladatele'}),
    defineField({
      name: 'vize', title: 'Vize', type: 'object', group: 'zakladatele',
      fields: [
        {name: 'nadpis', title: 'Nadpis', type: 'string'},
        {name: 'text', title: 'Text', type: 'text', rows: 3},
      ],
    }),

    // --- Proč Matlok ---
    defineField({name: 'procEyebrow', title: 'Nadřádek', type: 'string', group: 'proc'}),
    defineField({name: 'procNadpis', title: 'Nadpis', type: 'string', group: 'proc'}),
    defineField({
      name: 'duvody', title: 'Důvody', type: 'array', group: 'proc',
      of: [{
        type: 'object', name: 'duvod',
        fields: [
          {name: 'nadpis', title: 'Nadpis', type: 'string'},
          {name: 'text', title: 'Text', type: 'text', rows: 4},
          {
            name: 'ikona', title: 'Ikona', type: 'string',
            options: {
              list: [
                {title: 'Vlastní provoz', value: 'provoz'},
                {title: 'Rychlost', value: 'rychlost'},
                {title: 'Trvanlivost', value: 'trvanlivost'},
                {title: 'Hodiny', value: 'hodiny'},
                {title: 'Platební karta', value: 'karta'},
              ],
            },
          },
        ],
        preview: {select: {title: 'nadpis', subtitle: 'text'}},
      }],
      validation: (r) => r.max(3),
    }),
  ],
  preview: {prepare: () => ({title: 'Domovská stránka'})},
})
