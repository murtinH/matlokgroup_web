import {defineField, defineType} from 'sanity'

/**
 * Texty stránky /sluzby. Principy a služby mají vlastní dokumenty
 * (principle, service) — sem patří jen to, co nikam jinam nepatří.
 */
export const sluzbyPage = defineType({
  name: 'sluzbyPage',
  title: 'Stránka Digital Services',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Úvod'},
    {name: 'filozofie', title: 'Filozofie'},
    {name: 'sluzby', title: 'Služby a proces'},
    {name: 'vzorek', title: 'Náš vzorek'},
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

    defineField({name: 'filozofieEyebrow', title: 'Nadřádek', type: 'string', group: 'filozofie'}),
    defineField({name: 'filozofieNadpis', title: 'Nadpis', type: 'string', group: 'filozofie'}),
    defineField({
      name: 'filozofieLead', title: 'Perex', type: 'text', rows: 3, group: 'filozofie',
      description:
        'Pozor na počet principů — když jich v dokumentech principle přibude nebo ubude, musí sedět i tenhle text.',
    }),

    defineField({name: 'sluzbyEyebrow', title: 'Nadřádek', type: 'string', group: 'sluzby'}),
    defineField({name: 'sluzbyNadpis', title: 'Nadpis', type: 'string', group: 'sluzby'}),
    defineField({
      name: 'proces', title: 'Kroky procesu', type: 'array', group: 'sluzby',
      of: [{
        type: 'object', name: 'krok',
        fields: [
          {name: 'nadpis', title: 'Nadpis', type: 'string'},
          {name: 'popis', title: 'Popis', type: 'string'},
        ],
        preview: {select: {title: 'nadpis', subtitle: 'popis'}},
      }],
      description: 'Číslují se automaticky podle pořadí.',
      validation: (r) => r.max(5),
    }),

    defineField({name: 'vzorekEyebrow', title: 'Nadřádek', type: 'string', group: 'vzorek'}),
    defineField({name: 'vzorekNadpis', title: 'Nadpis', type: 'string', group: 'vzorek'}),
    defineField({name: 'vzorekText', title: 'Text', type: 'text', rows: 3, group: 'vzorek'}),
    defineField({
      name: 'vzorekFakta', title: 'Čísla', type: 'array', group: 'vzorek',
      of: [{
        type: 'object', name: 'fakt',
        fields: [
          {name: 'hodnota', title: 'Hodnota', type: 'string'},
          {name: 'popisek', title: 'Popisek', type: 'string'},
        ],
        preview: {select: {title: 'hodnota', subtitle: 'popisek'}},
      }],
      validation: (r) => r.max(4),
    }),
    defineField({
      name: 'ctaTlacitko', title: 'Tlačítko', type: 'object', group: 'vzorek',
      fields: [
        {name: 'text', title: 'Text', type: 'string'},
        {name: 'odkaz', title: 'Odkaz', type: 'string'},
      ],
    }),
    defineField({name: 'ctaPoznamka', title: 'Poznámka vedle tlačítka', type: 'string', group: 'vzorek'}),
  ],
  preview: {prepare: () => ({title: 'Stránka Digital Services'})},
})
