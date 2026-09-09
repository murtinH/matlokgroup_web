import {defineField, defineType} from 'sanity'

/**
 * Texty stránky /matlok. Stejný důvod existence jako u homePage —
 * kapitola 5 v ZADANI.md pro ně nemá místo a natvrdo v komponentě být nesmí.
 * Nabídka produktů sem nepatří, ta je v dokumentech product.
 */

const dvojice = {
  type: 'object',
  name: 'dlazdice',
  fields: [
    {name: 'hodnota', title: 'Hodnota', type: 'string'},
    {name: 'popisek', title: 'Popisek', type: 'string'},
    {
      name: 'zdroj',
      title: 'Brát hodnotu z automatu',
      type: 'string',
      description:
        'Když je vyplněno, hodnotu přepíše živý údaj z Partner API. Ručně zadaná hodnota slouží jako záloha, než se data načtou.',
      options: {
        list: [
          {title: 'Počet produktů v nabídce', value: 'pocet'},
          {title: 'Prodaných kusů celkem', value: 'prodano'},
        ],
      },
    },
  ],
  preview: {select: {title: 'hodnota', subtitle: 'popisek'}},
}

export const matlokPage = defineType({
  name: 'matlokPage',
  title: 'Stránka Matlok',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Úvod'},
    {name: 'nabidka', title: 'Nabídka'},
    {name: 'vyhody', title: 'Výhody'},
    {name: 'cta', title: 'Výzva'},
  ],
  fields: [
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
    defineField({
      name: 'foto', title: 'Fotka boxu', type: 'image', group: 'hero',
      options: {hotspot: true},
      fields: [
        {name: 'alt', title: 'Alternativní text', type: 'string',
          description: 'Popis pro čtečky obrazovky. Bez něj obrázek nepatří na web.'},
      ],
    }),
    defineField({name: 'fotoPopisek', title: 'Štítek na fotce', type: 'string', group: 'hero',
      description: 'Například: Špindlerův Mlýn'}),
    defineField({name: 'kpi', title: 'Dlaždice pod fotkou', type: 'array', of: [dvojice],
      group: 'hero', validation: (r) => r.max(4)}),

    defineField({name: 'nabidkaNadpis', title: 'Nadpis', type: 'string', group: 'nabidka',
      validation: (r) => r.required()}),
    defineField({name: 'nabidkaStitek', title: 'Štítek u nadpisu', type: 'string', group: 'nabidka',
      description: 'Například: živě'}),
    defineField({
      name: 'kategorie', title: 'Filtry kategorií', type: 'array', group: 'nabidka',
      description:
        'Hodnota určuje chování: all = vše, drink = nápoje, snack = občerstvení, top = nejprodávanější, low = poslední kusy.',
      of: [{
        type: 'object', name: 'filtr',
        fields: [
          {name: 'text', title: 'Text', type: 'string'},
          {
            name: 'hodnota', title: 'Hodnota', type: 'string',
            options: {
              list: [
                {title: 'Vše', value: 'all'},
                {title: 'Nápoje', value: 'drink'},
                {title: 'Občerstvení', value: 'snack'},
                {title: 'Nejprodávanější', value: 'top'},
                {title: 'Poslední kusy', value: 'low'},
              ],
            },
          },
        ],
        preview: {select: {title: 'text', subtitle: 'hodnota'}},
      }],
    }),
    defineField({name: 'nabidkaPoznamka', title: 'Poznámka pod nabídkou', type: 'text', rows: 2,
      group: 'nabidka'}),
    defineField({
      name: 'hranicePoslednichKusu', title: 'Hranice "poslední kusy"', type: 'number',
      group: 'nabidka', initialValue: 3,
      description: 'Kolik a méně kusů se označí jako poslední kusy.',
      validation: (r) => r.required().min(1).integer(),
    }),

    defineField({
      name: 'vyhody', title: 'Výhody', type: 'array', group: 'vyhody',
      of: [{
        type: 'object', name: 'vyhoda',
        fields: [
          {name: 'nadpis', title: 'Nadpis', type: 'string'},
          {name: 'text', title: 'Text', type: 'text', rows: 3},
          {
            name: 'ikona', title: 'Ikona', type: 'string',
            options: {
              list: [
                {title: 'Hodiny', value: 'hodiny'},
                {title: 'Štít', value: 'stit'},
                {title: 'Posuvníky', value: 'posuvniky'},
                {title: 'Platební karta', value: 'karta'},
                {title: 'Obnovení', value: 'obnoveni'},
                {title: 'Řetěz', value: 'retez'},
              ],
            },
          },
        ],
        preview: {select: {title: 'nadpis', subtitle: 'text'}},
      }],
      validation: (r) => r.max(6),
    }),

    defineField({name: 'ctaEyebrow', title: 'Nadřádek', type: 'string', group: 'cta'}),
    defineField({name: 'ctaNadpis', title: 'Nadpis', type: 'string', group: 'cta'}),
    defineField({name: 'ctaLead', title: 'Perex', type: 'text', rows: 3, group: 'cta'}),
    defineField({
      name: 'ctaTlacitko', title: 'Tlačítko', type: 'object', group: 'cta',
      fields: [
        {name: 'text', title: 'Text', type: 'string'},
        {name: 'odkaz', title: 'Odkaz', type: 'string'},
      ],
    }),
  ],
  preview: {prepare: () => ({title: 'Stránka Matlok'})},
})
