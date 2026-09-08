import {defineField, defineType} from 'sanity'

export const principle = defineType({
  name: 'principle',
  title: 'Princip',
  type: 'document',
  description: 'Šest přesvědčení, na kterých stojí filozofie Digital Services.',
  fields: [
    defineField({
      name: 'poradi',
      title: 'Pořadí',
      type: 'number',
      validation: (rule) => rule.required().integer().positive(),
    }),
    defineField({
      name: 'nadpis',
      title: 'Nadpis',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'text',
      rows: 5,
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {title: 'Podle pořadí', name: 'poradiAsc', by: [{field: 'poradi', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'nadpis', poradi: 'poradi', subtitle: 'text'},
    prepare: ({title, poradi, subtitle}) => ({
      title: `${String(poradi).padStart(2, '0')} · ${title}`,
      subtitle,
    }),
  },
})
